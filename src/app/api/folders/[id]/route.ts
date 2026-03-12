// app/api/folders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';

export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const folderId = (await params).id;
  const organizationId = await getActiveOrganizationId(userId);

  const folder = await prisma.folder.findUnique({
    where: {
      id: folderId,
      organizationId,
    },
    include: {
      documents: {
        include: {
          createdByUser: {
            select: {
              id: true,
              fullName: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      },
      children: {
        include: {
          _count: {
            select: { documents: true }
          }
        }
      }
    }
  });

  if (!folder) {
    return NextResponse.json(
      { error: 'Folder not found' },
      { status: 404 }
    );
  }

  const formattedDocuments = folder.documents.map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    description: doc.description || '',
    fileUrl: doc.file_url,
    fileType: doc.file_type,
    fileSize: doc.file_size,
    createdBy: doc.createdByUser?.fullName || 'Unknown',
    createdById: doc.created_by,
    createdAt: doc.created_at.toISOString(),
    updatedAt: doc.updated_at.toISOString(),
    contentExtracted: doc.content_extracted ?
      (typeof doc.content_extracted === 'object' && 'Bool' in doc.content_extracted ?
        (doc.content_extracted as any).Bool :
        false) :
      false
  }));

  const formattedFolder = {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    documents: formattedDocuments,
    subfolders: folder.children.map((child: any) => ({
      id: child.id,
      name: child.name,
      documentCount: child._count.documents
    })),
    createdBy: folder.createdBy,
    createdAt: folder.createdAt.toISOString()
  };

  return NextResponse.json({
    status: 200,
    message: 'Folder retrieved successfully',
    data: formattedFolder
  });
}));

export const PUT = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const folderId = (await params).id;
  const organizationId = await getActiveOrganizationId(userId);

  const folder = await prisma.folder.findUnique({
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

  const { name, parentId } = await request.json();

  const updateData: any = {};

  if (name && name.trim() !== '') {
    updateData.name = name.trim();
  }

  if (parentId !== undefined) {
    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: {
          id: parentId,
          organizationId,
        }
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 }
        );
      }

      if (parentId === folderId) {
        return NextResponse.json(
          { error: 'A folder cannot be its own parent' },
          { status: 400 }
        );
      }
    }

    updateData.parentId = parentId || null;
  }

  const updatedFolder = await prisma.folder.update({
    where: { id: folderId },
    data: updateData
  });

  return NextResponse.json({
    status: 200,
    message: 'Folder updated successfully',
    data: updatedFolder
  });
}));

export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const folderId = (await params).id;
  const organizationId = await getActiveOrganizationId(userId);

  const folder = await prisma.folder.findUnique({
    where: {
      id: folderId,
      organizationId,
    },
    include: {
      children: true,
      documents: {
        select: { id: true }
      }
    }
  });

  if (!folder) {
    return NextResponse.json(
      { error: 'Folder not found' },
      { status: 404 }
    );
  }

  if (folder.documents.length > 0) {
    await prisma.document.updateMany({
      where: { folderId },
      data: { folderId: null }
    });
  }

  if (folder.children.length > 0) {
    await prisma.folder.updateMany({
      where: { parentId: folderId },
      data: { parentId: folder.parentId }
    });
  }

  await prisma.folder.delete({
    where: { id: folderId }
  });

  return NextResponse.json({
    status: 200,
    message: 'Folder deleted successfully'
  });
}));
