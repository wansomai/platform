// src/app/api/projects/[id]/documents/route.ts
import { NextRequest } from 'next/server';
import { after } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler, withProjectAccess, ProjectContext } from '@/lib/api/middleware';
import {
  createApiResponse,
  createNotFoundResponse,
  createBadRequestResponse,
} from '@/lib/api/response';

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

    const { documentIds } = await request.json();

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return createBadRequestResponse('Document IDs array is required');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project) {
      return createNotFoundResponse('Project');
    }

    // Bulk-insert all attachments in one query; duplicates are silently skipped.
    // Content extraction is intentionally deferred — it runs on-demand in the messages
    // route (tryExtractDocumentContentOnDemand) the first time a message references
    // these documents. Extracting here would block the response for minutes with many
    // or large documents and risks hitting the 60-second Vercel function timeout.
    await prisma.projectDocument.createMany({
      data: documentIds.map((docId: string) => ({
        project_id: projectId,
        document_id: docId,
        added_by: userId,
      })),
      skipDuplicates: true,
    });

    return createApiResponse(
      { attached: documentIds.length },
      'Documents attached to project successfully'
    );
  })
);
