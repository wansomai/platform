// src/app/api/projects/[id]/documents/[documentId]/embeddings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";

const prisma = new PrismaClient();

// Set a longer timeout for embedding generation
export const maxDuration = 120;

// Helper function to check project access
async function checkProjectAccess(projectId: string, userId: string) {
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });
  
  if (!projectMember) {
    // Check if user belongs to the organization that owns the project
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!user) {
      return false;
    }
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });
    
    if (!project || project.organizationId !== user.organizationId) {
      return false;
    }
  }
  
  return true;
}

// POST handler - Generate embeddings for a document
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string, documentId: string } }
) {
  try {
    const projectId = params.id;
    const documentId = params.documentId;
    
    // Get user ID from request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Unauthorized' 
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
          message: 'Forbidden' 
        },
        { status: 403 }
      );
    }
    
    // Get document with content
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        project_id: projectId
      },
      include: {
        content: true,
        embeddings: true
      }
    });
    
    if (!document) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Document not found' 
        },
        { status: 404 }
      );
    }
    
    // Check if document content is extracted
    const isContentExtracted = document.content_extracted && 
      typeof document.content_extracted === 'object' && 
      'Bool' in document.content_extracted && 
      (document.content_extracted as any).Bool;
      
    if (!isContentExtracted || !document.content) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'Document content is not extracted yet. Please extract content first.' 
        },
        { status: 400 }
      );
    }
    
    // Check if embeddings already exist
    if (document.embeddings && document.embeddings.length > 0) {
      // If force flag is not set, return existing embeddings
      const forceRebuild = request.nextUrl.searchParams.get('force') === 'true';
      
      if (!forceRebuild) {
        return NextResponse.json({
          status: 200,
          message: 'Document embeddings already exist',
          data: {
            id: document.id,
            embeddings_count: document.embeddings.length
          }
        });
      }
      
      // Otherwise, delete existing embeddings to rebuild them
      await prisma.embedding.deleteMany({
        where: { documentId }
      });
    }
    
    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const textChunks = await textSplitter.splitText(document.content.content);
    
    // Initialize OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY || '',
      batchSize: 5  // Process 5 embeddings at a time to avoid rate limits
    });
    
    // Generate embeddings for each chunk
    const embeddingVectors = await embeddings.embedDocuments(textChunks);
    
    // Store embeddings in database
    const embeddingCreatePromises = textChunks.map((chunk, index) => 
      prisma.embedding.create({
        data: {
          documentId,
          vector: JSON.stringify(embeddingVectors[index]),
          chunkText: chunk,
          chunkIndex: index
        }
      })
    );
    
    // Execute in batches to avoid overwhelming the database
    const batchSize = 10;
    const embeddingResults = [];
    
    for (let i = 0; i < embeddingCreatePromises.length; i += batchSize) {
      const batch = embeddingCreatePromises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      embeddingResults.push(...batchResults);
    }
    
    return NextResponse.json({
      status: 200,
      message: 'Document embeddings generated successfully',
      data: {
        id: document.id,
        embeddings_count: embeddingResults.length,
        chunks: textChunks.length
      }
    });
  } catch (error) {
    console.error('Error generating document embeddings:', error);
    
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

// GET handler - Get document embeddings info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, documentId: string } }
) {
  try {
    const projectId = params.id;
    const documentId = params.documentId;
    
    // Get user ID from request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Unauthorized' 
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
          message: 'Forbidden' 
        },
        { status: 403 }
      );
    }
    
    // Get document embeddings count
    const embeddings = await prisma.embedding.findMany({
      where: { documentId },
      select: {
        id: true,
        chunkIndex: true,
        createdAt: true
      },
      orderBy: {
        chunkIndex: 'asc'
      }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Document embeddings info retrieved successfully',
      data: {
        id: documentId,
        embeddings_count: embeddings.length,
        embeddings: embeddings.map(e => ({
          id: e.id,
          chunkIndex: e.chunkIndex,
          createdAt: e.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error retrieving document embeddings info:', error);
    
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

// DELETE handler - Delete document embeddings
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, documentId: string } }
) {
  try {
    const projectId = params.id;
    const documentId = params.documentId;
    
    // Get user ID from request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Unauthorized' 
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
          message: 'Forbidden' 
        },
        { status: 403 }
      );
    }
    
    // Delete embeddings
    const { count } = await prisma.embedding.deleteMany({
      where: { documentId }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Document embeddings deleted successfully',
      data: {
        id: documentId,
        deleted_count: count
      }
    });
  } catch (error) {
    console.error('Error deleting document embeddings:', error);
    
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