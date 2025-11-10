// src/app/api/projects/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/prisma/client';
import { blobStorageService } from '@/lib/storage';
import { extractTextFromFile } from '@/lib/documentParser';
import { checkProjectAccess } from '@/lib/auth/authorization';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

const prisma = new PrismaClient();

// Set a longer timeout for file uploads
export const maxDuration = 60;


// GET handler - List all documents for a project
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  // Get category filter
  const searchParams = request.nextUrl.searchParams;
  const projectDocuments = await prisma.projectDocument.findMany({
    where: { project_id: projectId },
    include: {
      document: true
    }
  });

  const formattedDocuments = projectDocuments.map((pd:any) => ({
    id: pd.document.id,
    title: pd.document.title,
    description: pd.document.description || '',
    fileUrl: pd.document.file_url,
    fileType: pd.document.file_type,
    fileSize: pd.document.file_size,
    createdBy: pd.document.created_by || 'Unknown User',
    createdAt: pd.document.created_at.toISOString(),
    addedAt: pd.added_at.toISOString(),
    contentExtracted: Boolean(pd.document.content_extracted),
    processingStatus: pd.document.content_extracted ? 'complete' : (
      pd.document.content_extracted &&
      typeof pd.document.content_extracted === 'object' &&
      'Bool' in pd.document.content_extracted &&
      (pd.document.content_extracted as any).Bool ? 'processing' : 'pending'
    )
  }));

  return NextResponse.json({
    status: 200,
    message: 'Documents retrieved successfully',
    data: formattedDocuments
  });
}));

// POST handler - Upload a new document
export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // Get document IDs from request body
  const { documentIds } = await request.json();

  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    return NextResponse.json(
      { error: 'Document IDs array is required' },
      { status: 400 }
    );
  }

  // Verify project access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      organizationId: true,
      members: {
        where: { userId }
      }
    }
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  // Get user's organization
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });

  // Check if user has access
  const hasAccess = project.members.length > 0 ||
    (project.organizationId === user?.organizationId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this project' },
      { status: 403 }
    );
  }

  // Create conversation-document associations
  const createOperations = documentIds.map(docId => ({
    project_id: projectId,
    document_id: docId,
    added_by: userId
  }));

  // Add documents to conversation (ignore if already attached)
  await prisma.$transaction(
    createOperations.map(data =>
      prisma.projectDocument.upsert({
        where: {
          project_id_document_id: {
            project_id: data.project_id,
            document_id: data.document_id
          }
        },
        update: {}, // No updates if exists
        create: data
      })
    )
  );

  // Start content extraction process in the background
  // Extract content for all newly attached documents
  const extractionPromises = documentIds.map(async (docId) => {
    try {
      // First check if content already exists
      const documentContent = await prisma.documentContent.findUnique({
        where: { documentId: docId }
      });

      if (!documentContent) {
        // Only extract if content doesn't exist
        // Update the document status to indicate processing
        await prisma.document.update({
          where: { id: docId },
          data: {
            content_extracted: {
              Bool: false,
              Valid: true
            }
          }
        });

        // Schedule extraction (don't wait for it to complete)
        extractDocumentContent(docId).catch(err => {
          console.error(`Background extraction failed for document ${docId}:`, err);
        });

        return false; // Content not yet available
      }

      return true; // Content already available
    } catch (error) {
      console.error(`Error checking content for document ${docId}:`, error);
      return false;
    }
  });

  // Check current content status but don't wait for extraction to complete
  const contentStatus = await Promise.all(extractionPromises);
  const availableCount = contentStatus.filter(Boolean).length;
  const processingCount = documentIds.length - availableCount;

  return NextResponse.json({
    status: 200,
    message: 'Documents attached to project successfully',
    data: {
      attached: documentIds.length,
      content_available: availableCount,
      content_processing: processingCount
    }
  });
}));
/**
 * Robustly extracts content from a document and stores it
 * @param documentId Document ID to extract
 * @returns Promise resolving to true on success, false on failure
 */
async function extractDocumentContent(documentId: string): Promise<boolean> {
  try {
    // Check if document content already exists
    const existingContent = await prisma.documentContent.findUnique({
      where: { documentId }
    });
    
    if (existingContent) {
      return true; // Content already exists
    }
    
    // Get document details
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      console.error(`Document ${documentId} not found for extraction`);
      return false;
    }
    
    // Download file from storage
    const fileBuffer = await blobStorageService.downloadFile(document.file_url);
    
    // Determine the MIME type
    let mimeType = 'application/octet-stream';
    
    if (document.metadata) {
      try {
        let metadata: any;
        
        // Handle both object and string metadata
        if (typeof document.metadata === 'string') {
          metadata = JSON.parse(document.metadata);
        } else if (typeof document.metadata === 'object') {
          metadata = document.metadata;
        } else {
          // If it's neither string nor object, convert to string and parse
          metadata = JSON.parse(document.metadata.toString());
        }
        
        mimeType = metadata.mimeType || mimeType;
      } catch (error) {
        console.warn(`Could not parse metadata for document ${documentId}:`, error);
        // Continue with default mime type inference from file extension
      }
    }
    
    // If no mime type in metadata, infer from file extension
    if (mimeType === 'application/octet-stream') {
      const fileExt = document.file_type.toLowerCase();
      switch (fileExt) {
        case 'pdf': mimeType = 'application/pdf'; break;
        case 'docx': mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
        case 'doc': mimeType = 'application/msword'; break;
        case 'xlsx': mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; break;
        case 'xls': mimeType = 'application/vnd.ms-excel'; break;
        case 'csv': mimeType = 'text/csv'; break;
        case 'txt': mimeType = 'text/plain'; break;
        case 'jpg': case 'jpeg': mimeType = 'image/jpeg'; break;
        case 'png': mimeType = 'image/png'; break;
      }
    }
    
    // Extract text content from file
    const extractedText = await extractTextFromFile(fileBuffer, mimeType);
    
    // Store the extracted content
    await prisma.documentContent.create({
      data: {
        documentId,
        content: extractedText
      }
    });
    
    // Update document extraction status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        content_extracted: {
          Bool: true,
          Valid: true
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error(`Error extracting content for document ${documentId}:`, error);
    return false;
  }
}