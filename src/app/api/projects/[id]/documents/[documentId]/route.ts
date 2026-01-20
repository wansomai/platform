// src/app/api/projects/[id]/documents/[documentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkProjectAccess } from '@/lib/auth/authorization';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

// DELETE - Remove document from project (keeps in vault)
export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string, documentId: string }> }
) => {
  const { id: projectId, documentId } = (await params);

  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this project' },
      { status: 403 }
    );
  }

  // Check if the document is attached to the project
  const projectDocument = await prisma.projectDocument.findUnique({
    where: {
      project_id_document_id: {
        project_id: projectId,
        document_id: documentId
      }
    }
  });

  if (!projectDocument) {
    return NextResponse.json(
      { error: 'Document not attached to project' },
      { status: 404 }
    );
  }

  // Remove document from project (detach only - document remains in vault)
  await prisma.projectDocument.delete({
    where: {
      project_id_document_id: {
        project_id: projectId,
        document_id: documentId
      }
    }
  });

  return NextResponse.json({
    status: 200,
    message: 'Document detached from project successfully'
  });
}));