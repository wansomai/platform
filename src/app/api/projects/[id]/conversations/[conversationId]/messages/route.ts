// app/api/projects/[id]/conversations/[conversationId]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  getUserIdFromRequest,
  checkProjectAccess,
} from "@/lib/auth/authorization";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { performWebSearch, isWebSearchConfigured } from '@/lib/web-search';
import LRUCache from 'lru-cache'

// Set a reasonable timeout
export const maxDuration = 60;

// Initialize Prisma with connection pooling
const prisma = new PrismaClient();

// Default settings if none exist
const DEFAULT_SETTINGS = {
  citeSources: true,
  suggestActions: true,
  webSearch: false,
  model: 'gpt-3.5-turbo',
  temperature: 0.7
};

// Maximum size of content to include in context (characters)
const MAX_DOCUMENT_CHUNK_SIZE = 1000;
const MAX_CHUNKS_PER_DOC = 3;
const MAX_TOTAL_CHUNKS = 10;

// Schema validation
const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
});

// Document embedding cache - up to 100 documents, expire after 1 hour
const embeddingCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour
});

// Simple function to determine if a message is a greeting
function isSimpleGreeting(text: string): boolean {
  const normalizedText = text.toLowerCase().trim();
  const simplePatterns = [
    /^hi+\b/, /^hello\b/, /^hey\b/, /^howdy\b/, /^greetings\b/,
    /^good\s(morning|afternoon|evening|day)\b/, /^how are you/,
    /^what can you do/, /^who are you/, /^what is your name/,
    /^thanks/, /^thank you/, /^great/, /^awesome/, /^cool/,
    /^nice/, /^ok\b/, /^okay\b/, /^\?{1,3}$/
  ];
  return simplePatterns.some(pattern => pattern.test(normalizedText)) || normalizedText.length < 20;
}

// Encoder for streaming response
const encoder = new TextEncoder();

// POST handler - Send a message to the conversation with streaming
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: projectId, conversationId } = (await params);
    const body = await request.json();
    const { content } = createMessageSchema.parse(body);
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ status: 401, message: "Authentication required" }, { status: 401 });
    }
    
    // Determine if this is a simple query that doesn't need full context
    const isSimpleQuery = isSimpleGreeting(content);
    
    // Start parallel operations immediately
    const accessCheckPromise = checkProjectAccess(projectId, userId);
    
    // Only fetch what we need based on query type
    const conversationPromise = prisma.conversation.findFirst({
      where: { id: conversationId, projectId },
      select: { id: true } // Minimal select for faster query
    });
    
    // Create the user message in parallel with other operations
    const userMessagePromise = prisma.message.create({
      data: {
        content,
        role: "user",
        conversationId,
        userId,
      }
    });
    
    // Always get message history and metadata for proper context
    const messageHistoryPromise = prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 10, // Limit to 10 most recent messages
      select: {
        role: true,
        content: true,
      }
    });
    
    const metaPromise = prisma.conversationMeta.findUnique({
      where: { conversationId },
      select: { 
        instructions: true,
        settings: true
      }
    });
    
    // For context-dependent queries, get project details
    interface SimpleProject {
      title: string;
    }
    
    interface FullProject {
      title: string;
      description: string | null;
      knowledgeBase: {
        instructions: string | null;
      } | null;
    }
    
    const projectPromise = isSimpleQuery 
      ? Promise.resolve({ title: "" } as SimpleProject) 
      : prisma.project.findUnique({
          where: { id: projectId },
          select: {
            title: true,
            description: true,
            knowledgeBase: {
              select: { instructions: true }
            }
          }
        });
    
    // Only load documents for non-simple queries
    const documentsPromise = isSimpleQuery 
      ? Promise.resolve([]) 
      : prisma.conversationDocument.findMany({
          where: { conversation_id: conversationId },
          select: {
            document: {
              select: {
                id: true,
                title: true,
                content: {
                  select: { content: true }
                }
              }
            }
          }
        });
    
    // Wait for essential checks first
    const [hasAccess, conversation] = await Promise.all([
      accessCheckPromise,
      conversationPromise
    ]);
    
    if (!hasAccess) {
      return NextResponse.json(
        { status: 403, message: "Permission denied" },
        { status: 403 }
      );
    }
    
    if (!conversation) {
      return NextResponse.json(
        { status: 404, message: "Conversation not found" },
        { status: 404 }
      );
    }
    
    // Now that we've validated access, wait for the remaining data in parallel
    const [
      userMessage,
      messageHistory,
      conversationMeta,
      project,
      conversationDocuments
    ] = await Promise.all([
      userMessagePromise,
      messageHistoryPromise,
      metaPromise,
      projectPromise,
      documentsPromise
    ]);
    
    // Create a stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        
        try {
          // Send initial status to client immediately
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'status',
                status: 'started',
                statusMessage: 'Processing your request...',
                conversationId: conversation.id,
                content: '',
              }) + '\n'
            )
          );

          // Process settings
          let settings = DEFAULT_SETTINGS;
          if (conversationMeta?.settings) {
            try {
              settings = typeof conversationMeta.settings === 'string' 
                ? JSON.parse(conversationMeta.settings) 
                : conversationMeta.settings as any;
            } catch (error) {
              console.error('Error parsing settings:', error);
            }
          }
          
          // Create the custom instructions
          const customInstructions = conversationMeta?.instructions ||
                                    (isSimpleQuery ? "" : (project as FullProject)?.knowledgeBase?.instructions || "");
          
          // Prepare document vectors for search - only if needed
          let relevantContent = "";
          const documentObjects: Document[] = [];
          
          if (!isSimpleQuery && conversationDocuments.length > 0) {
            try {
              // Process only documents with content (skip extraction for speed)
              for (const docRef of conversationDocuments) {
                if (!docRef.document.content?.content) continue;
                
                const documentId = docRef.document.id;
                const documentContent = docRef.document.content.content;
                
                // Create smaller chunks from document content for better relevance
                const chunks = chunkDocumentContent(
                  documentContent, 
                  docRef.document.title,
                  documentId
                );
                
                documentObjects.push(...chunks);
              }
              
              if (documentObjects.length > 0) {
                // Initialize embeddings and vector store
                const embeddings = new OpenAIEmbeddings({
                  openAIApiKey: process.env.OPENAI_API_KEY,
                  modelName: "text-embedding-ada-002",
                  batchSize: 512,
                  stripNewLines: true
                });
                
                // Only search a reasonable number of documents
                const docsToSearch = documentObjects.slice(0, MAX_TOTAL_CHUNKS);
                
                // Create vector store and search
                const vectorStore = await MemoryVectorStore.fromDocuments(
                  docsToSearch,
                  embeddings
                );
                
                // Find the most relevant documents
                const queryResults = await vectorStore.similaritySearch(
                  content, 
                  3,
                  (doc) => doc.pageContent.length > 50
                );
                
                // Format relevant content
                if (queryResults.length > 0) {
                  relevantContent = queryResults
                    .map(doc => {
                      const truncatedContent = doc.pageContent.substring(0, MAX_DOCUMENT_CHUNK_SIZE);
                      return `### Document: ${doc.metadata.title} ###\n${truncatedContent}\n`;
                    })
                    .join("\n\n");
                }
              }
            } catch (vectorError) {
              console.error("Error in vector search:", vectorError);
              // Fallback to a simpler approach without failing completely
              relevantContent = documentObjects.slice(0, 2)
                .map(doc => `### Document: ${doc.metadata.title} ###\n${doc.pageContent.substring(0, 500)}\n`)
                .join("\n\n");
            }
          }
          
          // Get web search results if enabled and appropriate
          let webSearchResults = "";
          if (settings.webSearch && !isSimpleQuery && isWebSearchConfigured()) {
            try {
              // Start web search in parallel with other operations
              const searchPromise = performWebSearch(content);
              
              // Set a timeout to ensure search doesn't slow down response too much
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Web search timeout')), 2000);
              });
              
              // Use the search results only if they come back quickly enough
              const searchResults = await Promise.race([searchPromise, timeoutPromise])
                .catch(() => "Search timed out");
              
              if (searchResults && searchResults !== "Search timed out") {
                webSearchResults = sanitizeSearchResults(searchResults as string);
              }
            } catch (error) {
              console.error("Web search error:", error);
            }
          }
          
          // Format message history in correct order
          const aiMessages = messageHistory.reverse().map((msg) => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
          }));
          
          // Create appropriate system message based on context
          let systemMessage;
          
          if (isSimpleQuery) {
            systemMessage = `You are wansom, a legal assistant for professionals working on a project titled "${
              project?.title || "Project"
            }".
            Provide helpful, accurate, and concise responses.
            ${customInstructions ? `Special instructions: ${customInstructions}` : ""}`;
          } else {
            const fullProject = project as FullProject;
            
            systemMessage = `You are wansom,legal assistant for professionals working on a project titled "${
              fullProject?.title || "Project"
            }".
            ${fullProject?.description ? `Project description: ${fullProject.description}` : ""}
            ${customInstructions ? `Special instructions: ${customInstructions}` : ""}
            
            ${relevantContent ? 
              `${settings.citeSources ? 
                "IMPORTANT: I'm providing you with documents that are relevant to this conversation. " +
                "Use information from these documents to answer questions when possible. " +
                "Cite document names when you reference information from them."
                : 
                "I'm providing you with documents that are relevant to this conversation. " +
                "Use information from these documents to answer questions when possible."
              }
              
              Here are the relevant documents for context:
              ${relevantContent}
              
              ${settings.citeSources ? 
                "If you find information in the documents, tell the user which document it came from."
                : 
                "Use the document information when relevant to the query."
              }`
              : 
              conversationDocuments.length > 0
                ? `Note: There are ${conversationDocuments.length} documents attached to this conversation, but no content was found relevant to this specific query.`
                : "No documents are currently attached to this conversation."
            }
            
            ${webSearchResults ? 
              `I've also searched the web and found this relevant information: 
              ${webSearchResults}
              
              Use this information if it's relevant to the query.`
              : 
              ""
            }
            
            ${settings.suggestActions ? 
              "If appropriate, suggest relevant actions based on the query."
              : 
              ""
            }`;
          }
          
          // Create the prompt template
          const prompt = ChatPromptTemplate.fromPromptMessages([
            SystemMessagePromptTemplate.fromTemplate(systemMessage),
            ...aiMessages.map((msg) =>
              msg.role === "user"
                ? HumanMessagePromptTemplate.fromTemplate(msg.content)
                : SystemMessagePromptTemplate.fromTemplate(msg.content)
            ),
            HumanMessagePromptTemplate.fromTemplate(content),
          ]);
          
          // Configure the chat model for streaming
          const chatModel = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: settings.model || process.env.OPENAI_MODEL || "gpt-3.5-turbo",
            temperature: settings.temperature || 0.7,
            streaming: true,
          });
          
          // Format the prompt
          const formattedPrompt = await prompt.format({});
          
          // Create a temporary assistant message to stream into
          const tempMessageId = `temp-${Date.now()}`;
          let fullContent = "";
          let documentReferences = new Set<string>();
          
          // Stream the response
          const responseStream = await chatModel.stream(formattedPrompt);
          
          for await (const chunk of responseStream) {
            const textContent = chunk.content.toString();
            fullContent += textContent;
            
            // Send the text delta to the client
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'delta',
                  conversationId: conversation.id,
                  messageId: tempMessageId,
                  content: textContent,
                }) + '\n'
              )
            );
            
            // Check for document references during streaming
            if (settings.citeSources && relevantContent) {
              for (const doc of documentObjects) {
                if (fullContent.includes(doc.metadata.title)) {
                  documentReferences.add(doc.metadata.documentId);
                }
              }
            }
          }

          // Format the final content
          const formattedContent = formatAIMessage(fullContent);
          
          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          }).catch(console.error);
          
          // Save the AI message to the database
          const assistantMessage = await prisma.message.create({
            data: {
              content: formattedContent,
              role: "assistant",
              conversationId,
              metadata: webSearchResults ? 
                JSON.stringify({ webSearchResults: true }) : 
                undefined
            }
          });
          
          // Save references if needed
          if (settings.citeSources && documentReferences.size > 0) {
            const refPromises = Array.from(documentReferences).map(docId => {
              const doc = conversationDocuments.find(d => d.document.id === docId);
              if (!doc) return null;
              
              return prisma.messageReference.create({
                data: {
                  messageId: assistantMessage.id,
                  documentId: docId,
                  text: doc.document.content?.content.substring(0, 200) + "..." || "",
                }
              });
            });
            
            await Promise.all(refPromises.filter(Boolean));
          }
          // Fetch the complete message with references
          const completeMessage = await prisma.message.findUnique({
            where: { id: assistantMessage.id },
            include: {
              references: {
                include: {
                  document: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          });
          
          // Send the final message with references
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'final',
                conversationId: conversation.id,
                messageId: assistantMessage.id,
                tempMessageId,
                content: formattedContent,
                webSearchResults: webSearchResults && settings.webSearch ? webSearchResults : undefined,
                references: completeMessage?.references.map((ref) => ({
                  id: ref.id,
                  documentId: ref.documentId,
                  documentName: ref.document?.title || "Unknown Document",
                  text: ref.text,
                  page: ref.page,
                })) || [],
              }) + '\n'
            )
          );
          
          // Signal completion
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'status',
                status: 'completed',
                conversationId: conversation.id,
              }) + '\n'
            )
          );
        } catch (error) {
          console.error('Error in stream processing:', error);
          
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              }) + '\n'
            )
          );
        } finally {
          controller.close();
        }
      }
    });

    // Return the stream response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error("Error processing message:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { status: 400, message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { status: 500, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Break document content into smaller chunks for better retrieval
 */
function chunkDocumentContent(content: string, title: string, documentId: string): Document[] {
  // Simple chunking by paragraphs - in production you'd want smarter chunking
  const paragraphs = content.split(/\n\s*\n/);
  const chunks: Document[] = [];
  
  // Create chunks with some overlap
  let currentChunk = "";
  let chunkIndex = 0;
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) continue;
    
    // If adding this paragraph would make chunk too large, create a new chunk
    if (currentChunk.length + paragraph.length > MAX_DOCUMENT_CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(new Document({
        pageContent: currentChunk,
        metadata: {
          documentId,
          title,
          chunkIndex: chunkIndex++
        }
      }));
      
      currentChunk = "";
      
      // Limit chunks per document
      if (chunks.length >= MAX_CHUNKS_PER_DOC) {
        break;
      }
    }
    
    // Add paragraph to current chunk
    currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
  }
  
  // Add the final chunk if not empty
  if (currentChunk.trim().length > 0) {
    chunks.push(new Document({
      pageContent: currentChunk,
      metadata: {
        documentId,
        title,
        chunkIndex: chunkIndex
      }
    }));
  }
  
  return chunks;
}

/**
 * Format AI message for better readability
 */
function formatAIMessage(content: string): string {
  // Remove "System:" prefix if it exists at the beginning
  let formattedContent = content.replace(/^System:\s*/i, '');
  
  // Ensure there's a language specified for code blocks
  formattedContent = formattedContent.replace(/```\s*\n/g, '```text\n');
  
  // Add proper spacing for readability
  formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');
  
  return formattedContent;
}

/**
 * Sanitize web search results for inclusion in the prompt
 */
function sanitizeSearchResults(rawResults: string): string {
  try {
    // Basic sanitization to remove problematic characters and format nicely
    let cleanedResult = rawResults.replace(/\[\\\{/g, "");
    cleanedResult = cleanedResult.replace(/\\\}\]/g, "");
    cleanedResult = cleanedResult.replace(/\\"/g, '"');
    cleanedResult = cleanedResult.replace(/{[^}]*}/g, "");
    cleanedResult = cleanedResult.replace(/\\n/g, "\n");
    
    // Keep only essential information - truncate for speed
    return cleanedResult.substring(0, 1000);
  } catch (error) {
    return "Web search results unavailable";
  }
}


