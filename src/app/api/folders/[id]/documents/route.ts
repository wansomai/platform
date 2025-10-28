// app/api/folders/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const folderId = (await params).id;

  // Get user's organization
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Verify folder exists and belongs to organization
  let folder = null;
  if (folderId !== 'root') {
    folder = await prisma.folder.findUnique({
      where: {
        id: folderId,
        organizationId: user.organizationId
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

  // Verify documents exist and belong to organization
  const documents = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      organization_id: user.organizationId
    }
  });

  if (documents.length !== documentIds.length) {
    return NextResponse.json(
      { error: 'One or more documents not found' },
      { status: 404 }
    );
  }

  // Update documents to move to folder
  await prisma.document.updateMany({
    where: {
      id: { in: documentIds },
      organization_id: user.organizationId
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