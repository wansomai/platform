// src/app/api/projects/[id]/documents/route.ts
import { NextRequest } from 'next/server';
import { after } from 'next/server';
import prisma from '@/lib/prisma';
import { blobStorageService } from '@/lib/storage';
import { extractTextFromFile } from '@/lib/documentParser';
import { withErrorHandler, withProjectAccess, ProjectContext } from '@/lib/api/middleware';
import {
  createApiResponse,
  createNotFoundResponse,
  createBadRequestResponse,
  createForbiddenResponse,
} from '@/lib/api/response';

// Set a longer timeout for file uploads
export const maxDuration = 60;

// GET handler - List all documents for a project
export const GET = withErrorHandler(
  withProjectAccess(async (request: NextRequest, context: ProjectContext) => {
    const { projectId } = context;

    const projectDocuments = await prisma.projectDocument.findMany({
      where: { project_id: projectId },
      include: {
        document: true,
      },
    });

    const formattedDocuments = projectDocuments.map((pd: any) => ({
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
      processingStatus: pd.document.content_extracted
        ? 'complete'
        : pd.document.content_extracted &&
          typeof pd.document.content_extracted === 'object' &&
          'Bool' in pd.document.content_extracted &&
          (pd.document.content_extracted as any).Bool
        ? 'processing'
        : 'pending',
    }));

    return createApiResponse(formattedDocuments, 'Documents retrieved successfully');
  })
);

// POST handler - Attach documents to project
export const POST = withErrorHandler(
  withProjectAccess(async (request: NextRequest, context: ProjectContext) => {
    const { projectId, userId } = context;

    // Get document IDs from request body
    const { documentIds } = await request.json();

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return createBadRequestResponse('Document IDs array is required');
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project) {
      return createNotFoundResponse('Project');
    }

    // Create project-document associations
    const createOperations = documentIds.map((docId) => ({
      project_id: projectId,
      document_id: docId,
      added_by: userId,
    }));

    // Add documents to project (ignore if already attached)
    await prisma.$transaction(
      createOperations.map((data) =>
        prisma.projectDocument.upsert({
          where: {
            project_id_document_id: {
              project_id: data.project_id,
              document_id: data.document_id,
            },
          },
          update: {},
          create: data,
        })
      )
    );

    // Kick off extraction for any docs that don't have content yet — runs after the response
    // is sent so the request never times out regardless of document size or count.
    after(async () => {
      for (const docId of documentIds) {
        try {
          const existing = await prisma.documentContent.findUnique({
            where: { documentId: docId },
          });
          if (existing) continue; // Already extracted

          await extractDocumentContent(docId);
        } catch (err) {
          console.error(`[attach] Background extraction failed for document ${docId}:`, err);
        }
      }
    });

    return createApiResponse(
      { attached: documentIds.length },
      'Documents attached to project successfully'
    );
  })
);

/**
 * Robustly extracts content from a document and stores it
 * @param documentId Document ID to extract
 * @returns Promise resolving to true on success, false on failure
 */
async function extractDocumentContent(documentId: string): Promise<boolean> {
  try {
    // Check if document content already exists
    const existingContent = await prisma.documentContent.findUnique({
      where: { documentId },
    });

    if (existingContent) {
      return true; // Content already exists
    }

    // Get document details
    const document = await prisma.document.findUnique({
      where: { id: documentId },
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
          metadata = JSON.parse(document.metadata.toString());
        }

        mimeType = metadata.mimeType || mimeType;
      } catch (error) {
        // Continue with default mime type inference from file extension
      }
    }

    // If no mime type in metadata, infer from file extension
    if (mimeType === 'application/octet-stream') {
      const fileExt = document.file_type.toLowerCase();
      switch (fileExt) {
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'doc':
          mimeType = 'application/msword';
          break;
        case 'xlsx':
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'xls':
          mimeType = 'application/vnd.ms-excel';
          break;
        case 'csv':
          mimeType = 'text/csv';
          break;
        case 'txt':
          mimeType = 'text/plain';
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
      }
    }

    // Extract text content from file
    const extractedText = await extractTextFromFile(fileBuffer, mimeType);

    // Store the extracted content
    await prisma.documentContent.create({
      data: {
        documentId,
        content: extractedText,
      },
    });

    // Update document extraction status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        content_extracted: {
          Bool: true,
          Valid: true,
        },
      },
    });

    return true;
  } catch (error) {
    console.error(`Error extracting content for document ${documentId}:`, error);
    return false;
  }
}
