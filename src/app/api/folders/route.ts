// app/api/folders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';

export const GET = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  // ✅ Get user's active organization (supports org switching)
  const organizationId = await getActiveOrganizationId(userId);

  // Get folders owned by this user in their active organization
  const folders = await prisma.folder.findMany({
    where: { organizationId, createdBy: userId },
    include: {
      _count: {
        select: { documents: true }
      },
      children: {
        include: {
          _count: {
            select: { documents: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Format response
  const formattedFolders = folders.map((folder:any) => ({
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    documentCount: folder._count.documents,
    children: folder.children.map((child:any) => ({
      id: child.id,
      name: child.name,
      documentCount: child._count.documents
    })),
    createdAt: folder.createdAt.toISOString()
  }));

  return NextResponse.json({
    status: 200,
    message: 'Folders retrieved successfully',
    data: formattedFolders
  });
}));

export const POST = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  // Use active organization (supports org switching)
  const organizationId = await getActiveOrganizationId(userId);

  // Parse request body
  const { name, parentId } = await request.json();

  if (!name || name.trim() === '') {
    return NextResponse.json(
      { error: 'Folder name is required' },
      { status: 400 }
    );
  }

  // If parentId is provided, verify it exists and belongs to the active organization
  if (parentId) {
    const parentFolder = await prisma.folder.findUnique({
      where: {
        id: parentId,
        organizationId
      }
    });

    if (!parentFolder) {
      return NextResponse.json(
        { error: 'Parent folder not found' },
        { status: 404 }
      );
    }
  }

  // Create folder
  const folder = await prisma.folder.create({
    data: {
      name: name.trim(),
      organizationId,
      parentId: parentId || null,
      createdBy: userId
    }
  });

  return NextResponse.json({
    status: 201,
    message: 'Folder created successfully',
    data: folder
  }, { status: 201 });
}));