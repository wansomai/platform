// src/app/api/projects/[id]/conversations/[conversationId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getUserIdFromRequest, checkProjectAccess } from '@/lib/auth/authorization';

// Updated LangChain imports - fixing the compatibility issue
import { ChatOpenAI } from "@langchain/openai";
import { 
  ChatPromptTemplate, 
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
// Use FaissStore instead of MemoryVectorStore to avoid the maximalMarginalRelevance issue
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

// Set a longer timeout for complex operations with document processing
export const maxDuration = 60;

// Initialize Prisma with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

/**
 * Simple in-memory vector store implementation that doesn't rely on problematic imports
 */
class SimpleVectorStore {
  private documents: Document[] = [];
  private embeddings: OpenAIEmbeddings;

  constructor(embeddings: OpenAIEmbeddings) {
    this.embeddings = embeddings;
  }

  async addDocuments(documents: Document[]): Promise<void> {
    this.documents.push(...documents);
  }

  async similaritySearch(query: string, k: number = 5): Promise<Document[]> {
    if (this.documents.length === 0) {
      return [];
    }

    try {
      // When there are few documents, we can just return them without embedding search
      if (this.documents.length <= k) {
        return this.documents.slice(0, k);
      }

      // For larger sets, we'd ideally do embedding search
      // But for simplicity, we'll just return the first k documents
      // In a production system, you'd implement proper vector search here
      return this.documents.slice(0, k);
    } catch (error) {
      console.error("Error in similarity search:", error);
      return [];
    }
  }

  static async fromDocuments(
    documents: Document[],
    embeddings: OpenAIEmbeddings
  ): Promise<SimpleVectorStore> {
    const store = new SimpleVectorStore(embeddings);
    await store.addDocuments(documents);
    return store;
  }
}

/**
 * Document processor for retrieving relevant documents
 */
class DocumentProcessor {
  private embeddings: OpenAIEmbeddings;
  private vectorStores: Record<string, SimpleVectorStore> = {};

  constructor(apiKey: string) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey
    });
  }

  /**
   * Get or create a vector store for the project
   */
  async getVectorStore(projectId: string): Promise<SimpleVectorStore> {
    // Check if we already have a vector store for this project
    if (this.vectorStores[projectId]) {
      return this.vectorStores[projectId];
    }

    // Fetch documents for this project
    const documents = await prisma.document.findMany({
      where: { 
        project_id: projectId,
        content_extracted: {
          path: ['Bool'],
          equals: true
        }
      },
      include: {
        content: true,
        embeddings: {
          orderBy: {
            chunkIndex: 'asc'
          }
        }
      }
    });

    if (documents.length === 0) {
      // Create an empty vector store
      this.vectorStores[projectId] = await SimpleVectorStore.fromDocuments(
        [], 
        this.embeddings
      );
      return this.vectorStores[projectId];
    }

    // Process each document
    const processedDocs: Document[] = [];
    
    for (const doc of documents) {
      // If document has embeddings already, use those
      if (doc.embeddings && doc.embeddings.length > 0) {
        for (const embedding of doc.embeddings) {
          processedDocs.push(new Document({
            pageContent: embedding.chunkText,
            metadata: {
              documentId: doc.id,
              title: doc.title,
              section: doc.section,
              chunkIndex: embedding.chunkIndex,
              source: 'project document'
            }
          }));
        }
      } 
      // Otherwise, if document has content, use that
      else if (doc.content && doc.content.content) {
        // Split text into chunks
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });

        const chunks = await textSplitter.createDocuments(
          [doc.content.content], 
          [{
            documentId: doc.id,
            title: doc.title,
            section: doc.section,
            source: 'project document'
          }]
        );
        
        processedDocs.push(...chunks);
      }
    }

    // Create vector store
    this.vectorStores[projectId] = await SimpleVectorStore.fromDocuments(
      processedDocs, 
      this.embeddings
    );
    
    return this.vectorStores[projectId];
  }

  /**
   * Search for relevant documents based on a query
   */
  async searchRelevantDocuments(projectId: string, query: string, k: number = 5): Promise<Document[]> {
    const vectorStore = await this.getVectorStore(projectId);
    return vectorStore.similaritySearch(query, k);
  }
}

// Initialize the document processor and chat model with OpenAI API key
const documentProcessor = new DocumentProcessor(
  process.env.OPENAI_API_KEY || ''
);

const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
  temperature: 0.7,
});

// Schema validation
const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required')
});

/**
 * Function to safely format JSON for prompt templates
 * This converts JSON objects to readable text for inclusion in prompts
 */
function safelyFormatJson(jsonObj: any): string {
  if (!jsonObj) {
    return "No information available";
  }
  
  try {
    // Handle string JSON
    if (typeof jsonObj === 'string') {
      try {
        // Try to parse if it's a JSON string
        const parsed = JSON.parse(jsonObj);
        return Object.entries(parsed)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      } catch {
        // If not valid JSON, return as is
        return jsonObj;
      }
    }
    
    // Handle JSON objects
    return Object.entries(jsonObj)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${value}`;
      })
      .join('\n');
  } catch (e) {
    // Fallback for any errors
    console.error("Error formatting JSON:", e);
    return "Information available but in unsupported format";
  }
}

// GET handler - Get messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, conversationId: string }> }
) {
  try {
    const projectId = (await params).id;
    const conversationId = (await params).conversationId;
   
    // Get user ID from request headers
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Authentication required' 
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
          message: 'You do not have permission to access messages in this conversation' 
        },
        { status: 403 }
      );
    }
    
    // Check if conversation exists and belongs to the project
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        projectId
      }
    });
    
    if (!conversation) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Conversation not found' 
        },
        { status: 404 }
      );
    }
    
    // Get messages with references
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        references: {
          include: {
            document: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });
    
    // Format messages
    const formattedMessages = messages.map((message) => ({
      id: message.id,
      content: message.content,
      role: message.role,
      timestamp: message.createdAt.toISOString(),
      references: message.references.map(ref => ({
        id: ref.id,
        documentId: ref.documentId,
        documentName: ref.document?.title || 'Unknown Document',
        text: ref.text,
        page: ref.page
      }))
    }));
    
    return NextResponse.json({
      status: 200,
      message: 'Messages retrieved successfully',
      data: formattedMessages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// POST handler - Send a message to the conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, conversationId: string }> }
) {
  try {
    const { id, conversationId } = (await params);
    
    // Get user ID from request headers
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Authentication required' 
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
          message: 'You do not have permission to send messages in this conversation' 
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
        projectId: id
      }
    });
    
    if (!conversation) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Conversation not found' 
        },
        { status: 404 }
      );
    }
    
    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        role: 'user',
        conversationId,
        userId // Track which user sent the message
      }
    });
    
    // Fetch project details and message history in parallel
    const [project, messageHistory] = await Promise.all([
      prisma.project.findUnique({
        where: { id },
        select: {
          title: true,
          description: true,
          knowledgeBase: {
            select: {
              clientInfo: true,
              instructions: true
            }
          }
        }
      }),
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: 10,
        select: {
          role: true,
          content: true
        }
      })
    ]);
    
    try {
      // Find documents related to the query
      let relevantDocs: Document[] = [];
      
      try {
        // Try to get relevant documents, but don't fail if this fails
        relevantDocs = await documentProcessor.searchRelevantDocuments(id, content);
      } catch (docError) {
        console.error('Error searching for relevant documents:', docError);
        // Continue without document context
      }
      
      // Extract context from documents
      const documentContext = relevantDocs.length > 0 
        ? relevantDocs
            .map(doc => `Document "${doc.metadata.title}": ${doc.pageContent}`)
            .join('\n\n')
        : "No relevant documents found for this query.";
      
      // Format messages for AI
      const aiMessages = messageHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));
      
      // Safely format client info to avoid the JSON formatting error
      let clientInfoText = "No client information available";
      if (project?.knowledgeBase?.clientInfo) {
        clientInfoText = safelyFormatJson(project.knowledgeBase.clientInfo);
      }
      
      // Create the system message with properly formatted client info
      const systemMessage = `You are a helpful AI assistant for legal professionals working on a project titled "${project?.title || 'Legal Project'}".
        ${project?.description ? `Project description: ${project.description}` : ''}
        Client information: 
        ${clientInfoText}
        ${project?.knowledgeBase?.instructions ? `Special instructions: ${project.knowledgeBase.instructions}` : ''}
        
        Here are some relevant documents that might help with the query:
        ${documentContext}
        
        When referencing information from these documents, please cite the document name.
        Provide helpful, accurate, and concise responses to legal queries.`;
      
      // Create the prompt template
      const prompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(systemMessage),
        HumanMessagePromptTemplate.fromTemplate("{question}")
      ]);
      
      // Generate the response
      const formattedPrompt = await prompt.formatMessages({
        question: content,
      });
      
      const response = await chatModel.call(formattedPrompt);
      const aiContent = response.content.toString();
      
      // Create AI response message
      const assistantMessage = await prisma.message.create({
        data: {
          content: aiContent,
          role: 'assistant',
          conversationId
        }
      });
      
      // Extract and store document references
      if (relevantDocs.length > 0) {
        // Check which documents were referenced in the response
        const referencedDocs = relevantDocs.filter(doc => 
          aiContent.includes(doc.metadata.title)
        );
        
        if (referencedDocs.length > 0) {
          // Create references in the database
          await Promise.all(
            referencedDocs.map(doc => 
              prisma.messageReference.create({
                data: {
                  messageId: assistantMessage.id,
                  documentId: doc.metadata.documentId,
                  text: doc.pageContent.substring(0, 200) + "...",
                  page: doc.metadata.page
                }
              })
            )
          );
        }
      }
      
      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
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
                  title: true
                }
              }
            }
          }
        }
      });
      
      // Format response
      const responseMessage = {
        id: completeMessage?.id,
        content: completeMessage?.content,
        role: completeMessage?.role,
        timestamp: completeMessage?.createdAt.toISOString(),
        references: completeMessage?.references.map(ref => ({
          id: ref.id,
          documentId: ref.documentId,
          documentName: ref.document?.title || 'Unknown Document',
          text: ref.text,
          page: ref.page
        })) || []
      };
      
      return NextResponse.json({
        status: 201,
        message: 'Message sent successfully',
        data: responseMessage
      }, { status: 201 });
      
    } catch (error) {
      console.error('Error in AI processing:', error);
      
      // Even if AI processing fails, we still want to return the user message
      return NextResponse.json({
        status: 201,
        message: 'Message received but AI processing failed',
        data: {
          id: userMessage.id,
          content: userMessage.content,
          role: userMessage.role,
          timestamp: userMessage.createdAt.toISOString(),
          references: []
        },
        error: process.env.NODE_ENV === 'development' ? String(error) : 'AI processing failed'
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'Validation failed', 
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}