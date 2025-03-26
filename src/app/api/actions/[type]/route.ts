// src/app/api/actions/[type]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest, checkProjectAccess } from '@/lib/auth/authorization';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { blobStorageService } from '@/lib/storage';
import { extractTextFromFile } from '@/lib/documentParser';
import { performWebSearch } from '@/lib/web-search';
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";

// Set a longer timeout for complex operations with document processing
export const maxDuration = 60;

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize the chat model for AI responses
const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
  temperature: 0.7,
});

// Add the ConversationAction model to Prisma if it doesn't exist
// This would be defined in the schema.prisma file in a real implementation

/**
 * Main route handler for action requests
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const actionType = (await params).type;
    
    // Get user ID from request headers
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true },
        { status: 401 }
      );
    }
    
    // Call the appropriate handler based on action type
    switch (actionType) {
      case 'generate-document':
        return handleDocumentGeneration(request, userId);
      case 'research-question':
        return handleResearchQuestion(request, userId);
      case 'summarize-document':
        return handleDocumentSummarization(request, userId);
      default:
        return NextResponse.json(
          { message: `Unknown action type: ${actionType}`, error: true },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing action:', error);
    return NextResponse.json(
      { message: 'Error processing action', error: true },
      { status: 500 }
    );
  }
}

/**
 * Handler for document generation action
 */
async function handleDocumentGeneration(request: NextRequest, userId: string) {
  const body = await request.json();
  const { conversationId, parameters } = body;
  
  // Validate parameters
  if (!conversationId || !parameters?.documentType) {
    return NextResponse.json(
      { message: 'Missing required parameters', error: true },
      { status: 400 }
    );
  }
  
  // Get conversation data and messages
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 100  // Limit to prevent extremely large contexts
      },
      documentReferences: {
        include: {
          document: {
            include: {
              content: true
            }
          }
        }
      }
    }
  });
  
  if (!conversation) {
    return NextResponse.json(
      { message: 'Conversation not found', error: true },
      { status: 404 }
    );
  }
  
  // Format conversation history for document generation
  const conversationHistory = conversation.messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
  
  // Create document title from parameters or generate a default
  const documentTitle = parameters.title || `${parameters.documentType.charAt(0).toUpperCase() + parameters.documentType.slice(1)} - ${new Date().toLocaleDateString()}`;
  
  // Prepare document generation prompt
  const prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are a legal document generator. You will generate a complete ${parameters.documentType} based on the conversation history provided. 
      Format the document professionally, using appropriate legal language and structure for a ${parameters.documentType}.
      Include all necessary sections, clauses, and formatting.`
    ),
    HumanMessagePromptTemplate.fromTemplate(
      `Generate a complete ${parameters.documentType} with the title "${documentTitle}" based on the following conversation:
      
      ${conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}
      
      Additional instructions:
      - Format: ${parameters.format || 'docx'}
      - Template style: ${parameters.templateId || 'standard'}
      - Include all necessary legal language, clauses, and sections
      - Ensure the document is professionally formatted and ready for use
      `
    )
  ]);
  
  // Generate document content using LLM
  const formattedPrompt = await prompt.format({});
  const response = await chatModel.invoke(formattedPrompt);
  const documentContent = response.content.toString();
  
  // Record action in database (this would be expanded in production)
  const actionRecord = await prisma.conversationAction.create({
    data: {
      conversationId,
      userId,
      actionType: 'generate-document',
      parameters: JSON.stringify(parameters),
      title: documentTitle,
      status: 'completed',
      resultContent: documentContent
    }
  });
  
  // Return success response with document content
  return NextResponse.json({
    status: 200,
    message: 'Document generated successfully',
    data: {
      id: actionRecord.id,
      title: documentTitle,
      content: documentContent,
      format: parameters.format || 'docx',
      createdAt: actionRecord.createdAt.toISOString()
    }
  });
}

/**
 * Handler for research question action
 */
async function handleResearchQuestion(request: NextRequest, userId: string) {
  const body = await request.json();
  const { conversationId, parameters } = body;
  
  // Validate parameters
  if (!conversationId || !parameters?.question) {
    return NextResponse.json(
      { message: 'Missing required parameters', error: true },
      { status: 400 }
    );
  }
  
  // Get conversation data
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      project: true,
      documentReferences: {
        include: {
          document: {
            include: {
              content: true
            }
          }
        }
      }
    }
  });
  
  if (!conversation) {
    return NextResponse.json(
      { message: 'Conversation not found', error: true },
      { status: 404 }
    );
  }
  
  // Prepare for web search if enabled
  let webSearchResults = '';
  if (parameters.includeExternalSources) {
    try {
      webSearchResults = await performWebSearch(parameters.question);
    } catch (error) {
      console.error('Error performing web search:', error);
      // Continue without web search results rather than failing the entire action
    }
  }
  
  // Prepare document context if available and requested
  let documentContext = '';
  if (parameters.useCaseDocuments && conversation.documentReferences.length > 0) {
    // Create document objects from available documents
    const documentObjects = conversation.documentReferences
      .filter(ref => ref.document.content && ref.document.content.content)
      .map(ref => new Document({
        pageContent: ref.document.content!.content,
        metadata: {
          documentId: ref.document.id,
          title: ref.document.title,
          source: "conversation document",
        },
      }));
    
    if (documentObjects.length > 0) {
      try {
        // Use embeddings to find relevant document sections
        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
        
        const vectorStore = await MemoryVectorStore.fromDocuments(
          documentObjects,
          embeddings
        );
        
        // Search for relevant passages based on the research question
        const searchResults = await vectorStore.similaritySearch(
          parameters.question,
          5 // Get top 5 most relevant passages
        );
        
        // Format search results for context
        documentContext = searchResults
          .map(doc => `From document "${doc.metadata.title}":\n${doc.pageContent.substring(0, 1000)}`)
          .join('\n\n');
      } catch (error) {
        console.error('Error searching documents:', error);
      }
    }
  }
  
  // Create research depth instructions based on mode and depth
  let depthInstructions = '';
  if (parameters.mode === 'quick') {
    depthInstructions = 'Provide a brief, concise answer focusing only on the most essential information.';
  } else if (parameters.mode === 'comprehensive') {
    depthInstructions = 'Provide a detailed, comprehensive analysis with thorough explanations, multiple perspectives, and extensive citations.';
  } else {
    // Standard mode
    depthInstructions = 'Provide a balanced answer with appropriate detail and relevant citations.';
  }
  
  // Adjust depth further based on explicit depth parameter
  if (parameters.depth === 1) {
    depthInstructions += ' Keep the response brief and to the point.';
  } else if (parameters.depth === 3) {
    depthInstructions += ' Include extensive detail and thorough analysis.';
  }
  
  // Determine which sources to cite in instructions
  const sourceInstructions = [];
  if (parameters.includeRelevantCaseLaw) {
    sourceInstructions.push('relevant case law');
  }
  if (parameters.includeStatutes) {
    sourceInstructions.push('applicable statutes and regulations');
  }
  if (parameters.useCaseDocuments && documentContext) {
    sourceInstructions.push('case documents');
  }
  if (parameters.includeExternalSources && webSearchResults) {
    sourceInstructions.push('external legal sources');
  }
  
  // Prepare research prompt
  const prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are an expert legal researcher. You will thoroughly research the following legal question
      and provide a well-structured, properly cited response. ${depthInstructions}
      
      ${sourceInstructions.length > 0 
        ? `Include citations from ${sourceInstructions.join(', ')}.` 
        : 'Base your answer on general legal knowledge.'
      }
      
      Format your response with clear headings, proper citation format, and logical organization.`
    ),
    HumanMessagePromptTemplate.fromTemplate(
      `Research Question: ${parameters.question}
      
      ${documentContext ? `\nRelevant case documents:\n${documentContext}\n` : ''}
      ${webSearchResults ? `\nWeb search results:\n${webSearchResults}\n` : ''}
      
      Provide a ${parameters.mode} legal research response with appropriate citations.`
    )
  ]);
  
  // Generate research response using LLM
  const formattedPrompt = await prompt.format({});
  const response = await chatModel.invoke(formattedPrompt);
  const researchContent = response.content.toString();
  
  // Record action in database
  const actionRecord = await prisma.conversationAction.create({
    data: {
      conversationId,
      userId,
      actionType: 'research-question',
      parameters: JSON.stringify(parameters),
      title: `Research: ${parameters.question.substring(0, 100)}`,
      status: 'completed',
      resultContent: researchContent
    }
  });
  
  // Return success response with research content
  return NextResponse.json({
    status: 200,
    message: 'Research completed successfully',
    data: {
      id: actionRecord.id,
      title: `Research: ${parameters.question.substring(0, 100)}`,
      question: parameters.question,
      content: researchContent,
      summary: researchContent.split('\n\n')[0], // First paragraph as summary
      createdAt: actionRecord.createdAt.toISOString()
    }
  });
}

/**
 * Handler for document summarization action
 */
async function handleDocumentSummarization(request: NextRequest, userId: string) {
  const body = await request.json();
  const { conversationId, parameters } = body;
  
  // Validate parameters
  if (!conversationId || !parameters?.documentIds || parameters.documentIds.length === 0) {
    return NextResponse.json(
      { message: 'Missing required parameters', error: true },
      { status: 400 }
    );
  }
  
  // Get conversation data and the specified documents
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  });
  
  if (!conversation) {
    return NextResponse.json(
      { message: 'Conversation not found', error: true },
      { status: 404 }
    );
  }
  
  // Get all the specified documents
  const documents = await prisma.document.findMany({
    where: {
      id: { in: parameters.documentIds }
    },
    include: {
      content: true
    }
  });
  
  if (documents.length === 0) {
    return NextResponse.json(
      { message: 'No valid documents found', error: true },
      { status: 404 }
    );
  }
  
  // Filter to documents that have content
  const documentsWithContent = documents.filter(doc => doc.content && doc.content.content);
  
  if (documentsWithContent.length === 0) {
    return NextResponse.json(
      { message: 'No document content available for summarization', error: true },
      { status: 400 }
    );
  }
  
  // Prepare document contents for summarization
  const documentDetails = documentsWithContent.map(doc => ({
    title: doc.title,
    content: doc.content!.content,
    type: doc.file_type
  }));
  
  // Create summarization instructions based on type
  let summarizationInstructions = '';
  switch (parameters.summarizationType) {
    case 'brief':
      summarizationInstructions = 'Create a brief overview highlighting only the most important points.';
      break;
    case 'comprehensive':
      summarizationInstructions = 'Create a detailed summary that captures all significant aspects of the documents.';
      break;
    case 'extraction':
      summarizationInstructions = 'Extract and organize key information, facts, and data points from the documents.';
      break;
    default:
      summarizationInstructions = 'Create a balanced summary of the documents.';
  }
  
  // Adjust length based on parameter
  if (parameters.length === 1) {
    summarizationInstructions += ' Keep the summary very concise.';
  } else if (parameters.length === 3) {
    summarizationInstructions += ' Provide a comprehensive summary with appropriate detail.';
  }
  
  // Add focus areas if specified
  if (parameters.focusAreas && parameters.focusAreas.length > 0) {
    summarizationInstructions += ` Focus particularly on: ${parameters.focusAreas.join(', ')}.`;
  }
  
  // Add instruction for key points if requested
  if (parameters.includeKeypoints) {
    summarizationInstructions += ' Include a bullet-point list of key takeaways at the end.';
  }
  
  // Prepare summarization prompt
  const prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are a document summarization expert. Your task is to summarize the following document(s).
      ${summarizationInstructions}
      
      Format your response with clear headings, proper organization, and professional language.
      Reference specific documents where appropriate.`
    ),
    HumanMessagePromptTemplate.fromTemplate(
      `Summarize the following document(s):
      
      ${documentDetails.map((doc, i) => 
        `DOCUMENT ${i+1}: ${doc.title} (${doc.type.toUpperCase()})
        ${doc.content.substring(0, 5000)}${doc.content.length > 5000 ? '...' : ''}`
      ).join('\n\n')}
      
      ${parameters.title ? `Title for summary: ${parameters.title}` : ''}
      
      Provide a ${parameters.summarizationType} summary as instructed.`
    )
  ]);
  
  // Generate summary using LLM
  const formattedPrompt = await prompt.format({});
  const response = await chatModel.invoke(formattedPrompt);
  const summaryContent = response.content.toString();
  
  // Record action in database
  const actionRecord = await prisma.conversationAction.create({
    data: {
      conversationId,
      userId,
      actionType: 'summarize-document',
      parameters: JSON.stringify(parameters),
      title: parameters.title || 'Document Summary',
      status: 'completed',
      resultContent: summaryContent
    }
  });
  
  // Return success response with summary content
  return NextResponse.json({
    status: 200,
    message: 'Documents summarized successfully',
    data: {
      id: actionRecord.id,
      title: parameters.title || 'Document Summary',
      content: summaryContent,
      summary: summaryContent.split('\n\n')[0], // First paragraph as brief summary
      format: parameters.format || 'text',
      documentCount: documentsWithContent.length,
      createdAt: actionRecord.createdAt.toISOString()
    }
  });
}