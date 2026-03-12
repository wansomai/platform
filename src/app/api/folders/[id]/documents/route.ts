// app/api/folders/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';

export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const folderId = (await params).id;

  // Use the active organization so invited members work correctly
  const organizationId = await getActiveOrganizationId(userId);

  // Verify folder exists and belongs to the active organization
  let folder = null;
  if (folderId !== 'root') {
    folder = await prisma.folder.findUnique({
      where: {
        id: folderId,
        organizationId,
      }
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }
  }

  // Parse request body
  const { documentIds } = await request.json();

  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    return NextResponse.json(
      { error: 'Document IDs are required' },
      { status: 400 }
    );
  }

  // Verify documents exist and belong to the active organization
  const documents = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      organization_id: organizationId,
    }
  });

  if (documents.length !== documentIds.length) {
    return NextResponse.json(
      { error: 'One or more documents not found' },
      { status: 404 }
    );
  }

  // Move documents to the target folder
  await prisma.document.updateMany({
    where: {
      id: { in: documentIds },
      organization_id: organizationId,
    },
    data: {
      folderId: folderId === 'root' ? null : folderId
    }
  });

  return NextResponse.json({
    status: 200,
    message: `Documents moved to ${folderId === 'root' ? 'root folder' : 'folder'} successfully`,
    data: { count: documents.length }
  });
}));
