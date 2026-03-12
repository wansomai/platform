// app/api/folders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';

export const GET = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  // ✅ Get user's active organization (supports org switching)
  const organizationId = await getActiveOrganizationId(userId);

  // Determine if user is org admin/owner (they see all folders regardless of visibility)
  const [orgMembership, org] = await Promise.all([
    prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      select: { role: true }
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true }
    })
  ]);
  const isAdminOrOwner =
    org?.ownerId === userId ||
    orgMembership?.role === 'admin' ||
    orgMembership?.role === 'owner';

  // Get all folders for the org, including permissions
  const folders = await prisma.folder.findMany({
    where: { organizationId },
    include: {
      _count: { select: { documents: true } },
      children: {
        include: {
          _count: { select: { documents: true } },
          permissions: { select: { userId: true } }
        }
      },
      permissions: { select: { userId: true } }
    },
    orderBy: { name: 'asc' }
  });

  // Filter helper: a folder is visible if:
  //   1. visibility === 'organization'  (everyone sees it)
  //   2. visibility === 'restricted' AND (user created it OR user is admin/owner OR user is in permissions list)
  const canSeeFolder = (folder: any) => {
    if (folder.visibility === 'organization') return true;
    if (isAdminOrOwner) return true;
    if (folder.createdBy === userId) return true;
    return folder.permissions.some((p: any) => p.userId === userId);
  };

  const formattedFolders = folders
    .filter(canSeeFolder)
    .map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      createdBy: folder.createdBy,
      visibility: folder.visibility,
      documentCount: folder._count.documents,
      children: folder.children
        .filter(canSeeFolder)
        .map((child: any) => ({
          id: child.id,
          name: child.name,
          parentId: child.parentId,
          createdBy: child.createdBy,
          visibility: child.visibility,
          documentCount: child._count.documents,
          createdAt: child.createdAt.toISOString()
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
  // Use the active organization so invited members work correctly
  const organizationId = await getActiveOrganizationId(userId);

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
        organizationId,
      }
    });

    if (!parentFolder) {
      return NextResponse.json(
        { error: 'Parent folder not found' },
        { status: 404 }
      );
    }
  }

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