// app/api/projects/[id]/conversations/[conversationId]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  getUserIdFromRequest,
  checkProjectAccess,
} from "@/lib/auth/authorization";
import { blobStorageService } from "@/lib/storage";
import { extractTextFromFile } from "@/lib/documentParser";

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
// Set a longer timeout for complex operations with document processing
export const maxDuration = 60;

// Initialize Prisma with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});
// Default settings if none exist
const DEFAULT_SETTINGS = {
  citeSources: true,
  suggestActions: true,
  webSearch: false,
  model: 'gpt-3.5-turbo',
  temperature: 0.7
};

// Initialize the chat model with OpenAI API key
const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
  temperature: 0.7,
});

// Initialize embeddings for semantic search
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Schema validation
const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
});

/**
 * Helper function to escape special characters in a string for use in a regular expression
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Helper function to determine if a message is a simple greeting
 * that doesn't need full document context
 */
function isSimpleGreeting(text: string): boolean {
  // Convert to lowercase and trim for consistent matching
  const normalizedText = text.toLowerCase().trim();

  // List of common greetings and simple queries
  const simplePatterns = [
    // Greetings
    /^hi+\b/,
    /^hello\b/,
    /^hey\b/,
    /^howdy\b/,
    /^greetings\b/,
    /^good\s(morning|afternoon|evening|day)\b/,

    // Simple questions
    /^how are you/,
    /^what can you do/,
    /^who are you/,
    /^what is your name/,
    /^what are you/,
    /^can you help me/,

    // Short acknowledgments
    /^thanks/,
    /^thank you/,
    /^great/,
    /^awesome/,
    /^cool/,
    /^nice/,
    /^ok\b/,
    /^okay\b/,
    /^\?{1,3}$/,
  ];

  // Check if the text matches any of the patterns
  return (
    simplePatterns.some((pattern) => pattern.test(normalizedText)) ||
    normalizedText.length < 20
  ); // Also consider very short messages as simple
}

/**
 * Extracts document content on the fly if not already extracted
 * Production implementation should extract content when documents are added, not during conversation
 */
async function extractDocumentContentIfNeeded(
  documentId: string
): Promise<string | null> {
  try {
    // First check if content exists
    const documentContent = await prisma.documentContent.findUnique({
      where: { documentId },
    });

    if (documentContent) {
      return documentContent.content;
    }

    // Get document details
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return null;
    }

    // Extract content on the fly
    const fileBuffer = await blobStorageService.downloadFile(document.file_url);

    // Determine mime type
    let mimeType = "application/octet-stream";
    if (document.metadata) {
      try {
        const metadata = JSON.parse(document.metadata.toString());
        mimeType = metadata.mimeType || mimeType;
      } catch {
        // Fallback to inferring from file extension
        const fileExt = document.file_type.toLowerCase();
        switch (fileExt) {
          case "pdf":
            mimeType = "application/pdf";
            break;
          case "docx":
            mimeType =
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            break;
          case "doc":
            mimeType = "application/msword";
            break;
          case "xlsx":
            mimeType =
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            break;
          case "xls":
            mimeType = "application/vnd.ms-excel";
            break;
          case "csv":
            mimeType = "text/csv";
            break;
          case "txt":
            mimeType = "text/plain";
            break;
        }
      }
    }

    // Extract text content
    const extractedText = await extractTextFromFile(fileBuffer, mimeType);

    // Store extracted content
    await prisma.documentContent.create({
      data: {
        documentId,
        content: extractedText,
      },
    });

    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        content_extracted: {
          Bool: true,
          Valid: true,
        },
      },
    });

    return extractedText;
  } catch (error) {
    console.error(
      `Error extracting content for document ${documentId}:`,
      error
    );
    return null;
  }
}

/**
 * Formats AI messages for better readability and presentation
 * @param content The original AI message content
 * @returns Formatted message content
 */
function formatAIMessage(content: string): string {
  // Remove "System:" prefix if it exists at the beginning of the message
  let formattedContent = content.replace(/^System:\s*/i, '');
  
  // Better formatting for code blocks
  // Ensure there's a language specified for code blocks (defaulting to 'text' if none)
  formattedContent = formattedContent.replace(/```\s*\n/g, '```text\n');
  
  // Add extra line breaks where useful for readability
  
  // 1. Ensure proper spacing before and after lists
  // For bullet point lists
  formattedContent = formattedContent.replace(/([^\n])\n([\s]*[-•*][\s]+)/g, '$1\n\n$2');
  formattedContent = formattedContent.replace(/([\s]*[-•*][\s]+[^\n]+)\n([^\s-•*])/g, '$1\n\n$2');
  
  // For numbered lists
  formattedContent = formattedContent.replace(/([^\n])\n([\s]*\d+\.[\s]+)/g, '$1\n\n$2');
  formattedContent = formattedContent.replace(/([\s]*\d+\.[\s]+[^\n]+)\n([^\s\d\.])/g, '$1\n\n$2');
  
  // 2. Ensure proper spacing before and after headings
  formattedContent = formattedContent.replace(/([^\n])\n(#+[\s]+[^\n]+)/g, '$1\n\n$2');
  formattedContent = formattedContent.replace(/(#+[\s]+[^\n]+)\n([^#\n])/g, '$1\n\n$2');
  
  // 3. Ensure proper spacing before and after code blocks
  formattedContent = formattedContent.replace(/([^\n])\n(```)/g, '$1\n\n$2');
  formattedContent = formattedContent.replace(/(```[^`]*```)\n([^\n])/g, '$1\n\n$2');
  
  // 4. Format list items to ensure consistent spacing
  // For bullet points
  formattedContent = formattedContent.replace(/^([\s]*)[-•*]([\s]*)/gm, '$1• ');
  
  // For numbered lists - ensure proper spacing after the number
  formattedContent = formattedContent.replace(/^([\s]*)(\d+)\.([\s]*)/gm, '$1$2. ');
  
  // 5. Improve paragraph spacing (but avoid creating too many empty lines)
  formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');
  
  // Normalize line endings
  formattedContent = formattedContent.replace(/\r\n/g, '\n');
  
  return formattedContent;
}

// GET handler - Get messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: projectId, conversationId } = (await params);

    // Get user ID from request headers
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        {
          status: 401,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, userId);

    if (!hasAccess) {
      return NextResponse.json(
        {
          status: 403,
          message:
            "You do not have permission to access messages in this conversation",
        },
        { status: 403 }
      );
    }

    // Check if conversation exists and belongs to the project
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        projectId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        {
          status: 404,
          message: "Conversation not found",
        },
        { status: 404 }
      );
    }

    // Get messages with references
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
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

    // Format messages
    const formattedMessages = messages.map((message) => ({
      id: message.id,
      content: message.content,
      role: message.role,
      timestamp: message.createdAt.toISOString(),
      references: message.references.map((ref) => ({
        id: ref.id,
        documentId: ref.documentId,
        documentName: ref.document?.title || "Unknown Document",
        text: ref.text,
        page: ref.page,
      })),
    }));

    return NextResponse.json({
      status: 200,
      message: "Messages retrieved successfully",
      data: formattedMessages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);

    return NextResponse.json(
      {
        status: 500,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST handler - Send a message to the conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id, conversationId } = (await params);

    // Get user ID from request headers
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        {
          status: 401,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(id, userId);

    if (!hasAccess) {
      return NextResponse.json(
        {
          status: 403,
          message:
            "You do not have permission to send messages in this conversation",
        },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { content } = createMessageSchema.parse(body);

    // Verify the conversation exists
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        projectId: id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        {
          status: 404,
          message: "Conversation not found",
        },
        { status: 404 }
      );
    }

    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        role: "user",
        conversationId,
        userId, // Track which user sent the message
      },
    });

    // Fetch project details, message history, conversation documents, and settings in parallel
    const [project, messageHistory, conversationDocuments, conversationMeta] = await Promise.all([
      prisma.project.findUnique({
        where: { id },
        select: {
          title: true,
          description: true,
          knowledgeBase: {
            select: {
              instructions: true,
            },
          },
        }
      }),
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        take: 10,
        select: {
          role: true,
          content: true,
        }
      }),
      // Fetch documents attached to this conversation
      prisma.conversationDocument.findMany({
        where: { conversation_id: conversationId },
        include: {
          document: {
            include: {
              content: true,
            }
          }
        }
      }),
      // Get conversation metadata for settings and instructions
      prisma.conversationMeta.findUnique({
        where: { conversationId }
      })
    ]);

    try {
      // Parse settings from conversation meta
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

      // Create document objects from conversation documents
      const documentObjects: Document[] = [];
      const documentExtractionPromises: Promise<void>[] = [];

      // Process each attached document
      for (const docRef of conversationDocuments) {
        let documentContent = null;

        // Check if content is already available
        if (docRef.document.content && docRef.document.content.content) {
          documentContent = docRef.document.content.content;
        } else {
          // Schedule content extraction - don't wait for it to complete
          documentExtractionPromises.push(
            (async () => {
              try {
                // This will extract and save content for future use
                await extractDocumentContentIfNeeded(docRef.document.id);
              } catch (error) {
                console.error(
                  `Failed to extract content for document ${docRef.document.id}:`,
                  error
                );
              }
            })()
          );

          // Skip this document for the current message
          continue;
        }

        // Create a Document object for vector storage
        documentObjects.push(
          new Document({
            pageContent: documentContent,
            metadata: {
              documentId: docRef.document.id,
              title: docRef.document.title,
              source: "conversation document",
            },
          })
        );
      }

      // Start content extraction in the background
      if (documentExtractionPromises.length > 0) {
        // Don't wait for completion
        Promise.all(documentExtractionPromises).catch((error) => {
          console.error("Error in background document extraction:", error);
        });
      }

      // Create the vector store with available documents
      let relevantContent = "";
      let vectorStore: MemoryVectorStore | null = null;

      if (documentObjects.length > 0) {
        try {
          // Use settings to configure the embeddings
          const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
          });

          // Initialize vector store and add documents
          vectorStore = await MemoryVectorStore.fromDocuments(
            documentObjects,
            embeddings
          );

          // Check if query requires document context
          if (!isSimpleGreeting(content)) {
            // Try to find relevant documents based on the query
            const queryResults = await vectorStore.similaritySearch(content, 3);

            // Format relevant content from top matching documents
            if (queryResults.length > 0) {
              relevantContent = queryResults
                .map(
                  (doc) =>
                    `### Document: ${doc.metadata.title} ###\n${doc.pageContent}\n`
                )
                .join("\n\n");
            }
          }
        } catch (vectorError) {
          console.error("Error in vector search:", vectorError);
          // Fallback to using all documents if vector search fails
          relevantContent = documentObjects
            .map(
              (doc) =>
                `### Document: ${
                  doc.metadata.title
                } ###\n${doc.pageContent.substring(0, 1000)}\n`
            )
            .join("\n\n");
        }
      }

      // Use all documents if no specific relevant content was found
      if (!relevantContent && documentObjects.length > 0) {
        relevantContent = documentObjects
          .map(
            (doc) =>
              `### Document: ${
                doc.metadata.title
              } ###\n${doc.pageContent.substring(0, 1000)}\n`
          )
          .join("\n\n");
      }

      // Log document processing stats
      console.log(
        `Processed ${conversationDocuments.length} documents, found content for ${documentObjects.length}`
      );
      if (documentObjects.length > 0) {
        console.log(`Using ${documentObjects.length} documents for context`);
      } else if (conversationDocuments.length > 0) {
        console.log(
          `No document content available yet, extraction scheduled for ${documentExtractionPromises.length} documents`
        );
      }

      // If web search is enabled, perform a web search for relevant information
      let webSearchResults = "";
      if (settings.webSearch && !isSimpleGreeting(content) && isWebSearchConfigured()) {
        try {
          // Use the LangChain-based web search implementation
          const rawSearchResults = await performWebSearch(content);
          
          // Apply thorough sanitization to make it safe for the prompt
          webSearchResults = sanitizeSearchResults(rawSearchResults);
          
          console.log('Web search results sanitized and processed.');
        } catch (searchError) {
          console.error('Error performing web search:', searchError);
          // Continue without web search results
        }
      }

      // Format message history for AI
      const aiMessages = messageHistory.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }));

      // Check if this is a simple greeting or conversation starter
      const isSimpleMessage = isSimpleGreeting(content);

      // Use conversation-specific instructions if available, otherwise fall back to project instructions
      const customInstructions =
        conversationMeta?.instructions ||
        project?.knowledgeBase?.instructions ||
        "";

      // Use settings to configure the model
      const chatModel = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: settings.model || process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        temperature: settings.temperature || 0.7,
      });

      // Create an appropriate system message based on message complexity and settings
      let systemMessage;

      if (isSimpleMessage) {
        // Simple system message for greetings and basic interactions
        systemMessage = `You are a helpful AI legal assistant for professionals working on a project titled "${
          project?.title || "Project"
        }".
          Provide helpful, accurate, and concise responses.
          ${customInstructions ? `Special instructions: ${customInstructions}` : ""}`;
      } else {
        // Full context for substantive questions
        systemMessage = `You are a helpful AI legal assistant for professionals working on a project titled "${
          project?.title || "Project"
        }".
          ${project?.description ? `Project description: ${project.description}` : ""}
          ${customInstructions ? `Special instructions: ${customInstructions}` : ""}
          
          ${documentObjects.length > 0 ?
            `
          ${settings.citeSources ? 
            "IMPORTANT: I'm providing you with documents that are relevant to this conversation. " +
            "ALWAYS use information from these documents to answer questions when possible. " +
            "ALWAYS cite document names when you reference information from them."
            : 
            "I'm providing you with documents that are relevant to this conversation. " +
            "Use information from these documents to answer questions when possible."
          }
          
          Here are the documents provided for context:
          ${relevantContent}
          
          ${settings.citeSources ? 
            "Remember to actively search through these documents for relevant information before responding. " +
            "If you find information in the documents, tell the user which document it came from."
            : 
            "Remember to actively search through these documents for relevant information before responding."
          }
          If you don't find relevant information in the documents, let the user know you don't have that specific information.
          `
          : 
          conversationDocuments.length > 0
            ? `Note: There are ${conversationDocuments.length} documents attached to this conversation, but their content is still being processed and will be available for future messages.`
            : "No documents are currently attached to this conversation."
          }
          
          ${webSearchResults ? 
            `I've also searched the web for relevant information and found the following: 
            ${webSearchResults}
            
            Use this information if it's relevant to the query.`
            : 
            ""
          }
          
          ${settings.suggestActions ? 
            "If appropriate, suggest actions the user might want to take based on their query, such as creating a document, summarizing information, or conducting research."
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

      // Generate the response
      const formattedPrompt = await prompt.format({});
      const response = await chatModel.invoke(formattedPrompt);
      const aiContent = response.content.toString();
      const formattedAiContent = formatAIMessage(aiContent);

      // Create AI response message
      const assistantMessage = await prisma.message.create({
        data: {
          content: formattedAiContent,
          role: "assistant",
          conversationId,
          // Store web search results in metadata for display
          metadata: webSearchResults ? 
            JSON.stringify({ webSearchResults: true }) : 
            undefined
        }
      });
      
      // Extract and store document references if citation is enabled
      if (settings.citeSources && documentObjects.length > 0) {
        // List of possible reference patterns the AI might use
        const referencePatterns = [
          // Standard format: "According to [Document Name]", "As stated in [Document Name]", etc.
          new RegExp(
            `(according to|as stated in|as mentioned in|as per|in|from)\\s+"?([^".,]+)"?`,
            "gi"
          ),
          // Document name in quotes: "Document Name"
          new RegExp(`"([^"]+)"`, "g"),
          // Document name after ### markers that we included in the context
          new RegExp(`document: ([^#]+) ###`, "gi"),
          // Direct mention of document name without quotes
          ...documentObjects.map(
            (doc) =>
              new RegExp(`\\b${escapeRegExp(doc.metadata.title)}\\b`, "gi")
          ),
        ];

        // Track which documents have been referenced
        const referencedDocs = new Set<string>();

        // Check for references using all patterns
        for (const pattern of referencePatterns) {
          let match;
          while ((match = pattern.exec(aiContent)) !== null) {
            const potentialDocName = match[match.length - 1].trim();

            // Check if this matches any document title
            for (const doc of documentObjects) {
              const docTitle = doc.metadata.title;

              // Check for exact match or if the potential name contains the document title
              if (
                potentialDocName === docTitle ||
                potentialDocName.includes(docTitle) ||
                docTitle.includes(potentialDocName)
              ) {
                referencedDocs.add(doc.metadata.documentId);
              }
            }
          }
        }

        // Create references in the database for all detected documents
        if (referencedDocs.size > 0) {
          const referencePromises = [...referencedDocs].map((docId) => {
            const doc = documentObjects.find(
              (d) => d.metadata.documentId === docId
            );
            if (!doc) return null;

            return prisma.messageReference.create({
              data: {
                messageId: assistantMessage.id,
                documentId: docId,
                text: doc.pageContent.substring(0, 200) + "...",
                page: doc.metadata.page,
              },
            });
          });

          await Promise.all(referencePromises.filter(Boolean));
        }
      }

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

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

      // Format response
      const responseMessage = {
        id: completeMessage?.id,
        content: completeMessage?.content,
        role: completeMessage?.role,
        timestamp: completeMessage?.createdAt.toISOString(),
        // Include web search results if available
        webSearchResults: webSearchResults && settings.webSearch ? webSearchResults : undefined,
        references:
          completeMessage?.references.map((ref) => ({
            id: ref.id,
            documentId: ref.documentId,
            documentName: ref.document?.title || "Unknown Document",
            text: ref.text,
            page: ref.page,
          })) || [],
      };
      

      return NextResponse.json(
        {
          status: 201,
          message: "Message sent successfully",
          data: responseMessage,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error in AI processing:", error);

      // Even if AI processing fails, we still want to return the user message
      return NextResponse.json(
        {
          status: 201,
          message: "Message received but AI processing failed",
          data: {
            id: userMessage.id,
            content: userMessage.content,
            role: userMessage.role,
            timestamp: userMessage.createdAt.toISOString(),
            references: [],
          },
          error:
            process.env.NODE_ENV === "development"
              ? String(error)
              : "AI processing failed",
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error sending message:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: 400,
          message: "Validation failed",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        status: 500,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}


function sanitizeSearchResults(rawResults: any) {
  try {
    // First, clean any JSON brackets and syntax that might remain in the string
    let cleanedResult = rawResults.replace(/\[\\\{/g, "");
    cleanedResult = cleanedResult.replace(/\\\}\]/g, "");
    cleanedResult = cleanedResult.replace(/\\"/g, '"');
    
    // Remove any remaining JSON object notations
    cleanedResult = cleanedResult.replace(/{[^}]*}/g, "");
    
    // Replace any escape sequences with their actual characters
    cleanedResult = cleanedResult.replace(/\\n/g, "\n");
    cleanedResult = cleanedResult.replace(/\\t/g, "\t");
    
    // Format the results in a clean, readable way
    // Extract actual content from the raw search results
    let formattedResults = "Web Search Results:\n\n";
    
    // If we can parse out title/link/snippet patterns, do so
    const titleMatches = cleanedResult.match(/"title":"([^"]+)"/g);
    const linkMatches = cleanedResult.match(/"link":"([^"]+)"/g);
    const snippetMatches = cleanedResult.match(/"snippet":"([^"]+)"/g);
    
    if (titleMatches && linkMatches && snippetMatches) {
      // We can extract structured results
      for (let i = 0; i < Math.min(titleMatches.length, linkMatches.length, snippetMatches.length); i++) {
        const title = titleMatches[i].replace(/"title":"/, "").replace(/"$/, "");
        const link = linkMatches[i].replace(/"link":"/, "").replace(/"$/, "");
        const snippet = snippetMatches[i].replace(/"snippet":"/, "").replace(/"$/, "");
        
        formattedResults += `Result ${i+1}:\n`;
        formattedResults += `Title: ${title}\n`;
        formattedResults += `Link: ${link}\n`;
        formattedResults += `Summary: ${snippet}\n\n`;
      }
    } else {
      // Fall back to just using the cleaned text
      formattedResults += cleanedResult;
    }
    
    return formattedResults;
  } catch (error) {
    console.error("Error sanitizing search results:", error);
    // If all else fails, return a generic message
    return "Web search was performed but results could not be processed.";
  }
}
