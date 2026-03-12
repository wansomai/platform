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

<<<<<<< HEAD
=======
  // User must own the folder
>>>>>>> 61516a69d78cceaedd2df1249c6350be293a3c16
  const folder = await prisma.folder.findUnique({
    where: {
      id: folderId,
      organizationId,
<<<<<<< HEAD
=======
      createdBy: userId
>>>>>>> 61516a69d78cceaedd2df1249c6350be293a3c16
    },
    include: {
      documents: {
        where: { created_by: userId },
        include: {
          createdByUser: {
            select: { id: true, fullName: true }
          }
        },
        orderBy: { created_at: 'desc' }
      },
      children: {
        where: { createdBy: userId },
        include: {
          _count: { select: { documents: true } }
        }
      }
    }
  });

  if (!folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
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
        (doc.content_extracted as any).Bool : false) : false
  }));

<<<<<<< HEAD
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

=======
>>>>>>> 61516a69d78cceaedd2df1249c6350be293a3c16
  return NextResponse.json({
    status: 200,
    message: 'Folder retrieved successfully',
    data: {
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
    }
  });
}));

export const PUT = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const folderId = (await params).id;
  const organizationId = await getActiveOrganizationId(userId);

<<<<<<< HEAD
  const folder = await prisma.folder.findUnique({
    where: {
      id: folderId,
      organizationId,
    }
=======
  // User must own the folder
  const folder = await prisma.folder.findUnique({
    where: { id: folderId, organizationId, createdBy: userId }
>>>>>>> 61516a69d78cceaedd2df1249c6350be293a3c16
  });

  if (!folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  const { name, parentId } = await request.json();
<<<<<<< HEAD

=======
>>>>>>> 61516a69d78cceaedd2df1249c6350be293a3c16
  const updateData: any = {};

  if (name && name.trim() !== '') {
    updateData.name = name.trim();
  }

  if (parentId !== undefined) {
    if (parentId) {
      // Parent must also be owned by the user
      const parentFolder = await prisma.folder.findUnique({
<<<<<<< HEAD
        where: {
          id: parentId,
          organizationId,
        }
=======
        where: { id: parentId, organizationId, createdBy: userId }
>>>>>>> 61516a69d78cceaedd2df1249c6350be293a3c16
      });

      if (!parentFolder) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
      }

      if (parentId === folderId) {
        return NextResponse.json({ error: 'A folder cannot be its own parent' }, { status: 400 });
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

<<<<<<< HEAD
  const folder = await prisma.folder.findUnique({
    where: {
      id: folderId,
      organizationId,
    },
=======
  // User must own the folder
  const folder = await prisma.folder.findUnique({
    where: { id: folderId, organizationId, createdBy: userId },
>>>>>>> 61516a69d78cceaedd2df1249c6350be293a3c16
    include: {
      children: true,
      documents: { select: { id: true } }
    }
  });

  if (!folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

<<<<<<< HEAD
  if (folder.documents.length > 0) {
    await prisma.document.updateMany({
      where: { folderId },
=======
  // Unlink documents from this folder (only the user's own documents)
  if (folder.documents.length > 0) {
    await prisma.document.updateMany({
      where: { folderId, created_by: userId },
>>>>>>> 61516a69d78cceaedd2df1249c6350be293a3c16
      data: { folderId: null }
    });
  }

<<<<<<< HEAD
  if (folder.children.length > 0) {
    await prisma.folder.updateMany({
      where: { parentId: folderId },
=======
  // Move subfolders to parent (only the user's own subfolders)
  if (folder.children.length > 0) {
    await prisma.folder.updateMany({
      where: { parentId: folderId, createdBy: userId },
>>>>>>> 61516a69d78cceaedd2df1249c6350be293a3c16
      data: { parentId: folder.parentId }
    });
  }

<<<<<<< HEAD
  await prisma.folder.delete({
    where: { id: folderId }
  });

  return NextResponse.json({
    status: 200,
    message: 'Folder deleted successfully'
  });
=======
  await prisma.folder.delete({ where: { id: folderId } });

  return NextResponse.json({ status: 200, message: 'Folder deleted successfully' });
>>>>>>> 61516a69d78cceaedd2df1249c6350be293a3c16
}));
