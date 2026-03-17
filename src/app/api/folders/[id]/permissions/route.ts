// app/api/folders/[id]/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';

// GET /api/folders/[id]/permissions
// Returns folder visibility, permitted users, AND all org members (for the UI picker).
// Accessible to any org member.
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const folderId = (await params).id;
  const organizationId = await getActiveOrganizationId(userId);

  // Fetch folder + permissions + all org members in parallel
  const [folder, orgMemberships, org] = await Promise.all([
    prisma.folder.findUnique({
      where: { id: folderId, organizationId },
      include: {
        permissions: {
          include: {
            user: { select: { id: true, fullName: true, email: true } }
          }
        }
      }
    }),
    // Invited members (UserOrganization table)
    prisma.userOrganization.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, fullName: true, email: true } }
      },
      orderBy: { user: { fullName: 'asc' } }
    }),
    // Org owner details (may not have a UserOrganization row)
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        ownerId: true,
        owner: { select: { id: true, fullName: true, email: true } }
      }
    })
  ]);

  if (!folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  // Build a deduplicated members list: invited members + org owner
  const memberMap = new Map<string, { id: string; name: string; email: string; role: string }>();

  for (const m of orgMemberships) {
    memberMap.set(m.user.id, {
      id: m.user.id,
      name: m.user.fullName || m.user.email,
      email: m.user.email,
      role: m.role
    });
  }

  // Ensure the org owner is in the list even if not in UserOrganization
  if (org?.owner && !memberMap.has(org.owner.id)) {
    memberMap.set(org.owner.id, {
      id: org.owner.id,
      name: org.owner.fullName || org.owner.email,
      email: org.owner.email,
      role: 'owner'
    });
  }

  const orgMembers = Array.from(memberMap.values())
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({
    status: 200,
    message: 'Folder permissions retrieved successfully',
    data: {
      folderId: folder.id,
      createdBy: folder.createdBy,
      currentUserId: userId,           // so the UI knows who "you" are
      isCreator: folder.createdBy === userId,  // authoritative server-side check
      visibility: folder.visibility,
      permittedUsers: folder.permissions.map((p: any) => ({
        id: p.user.id,
        fullName: p.user.fullName,
        email: p.user.email
      })),
      orgMembers
    }
  });
}));

// PUT /api/folders/[id]/permissions
// Update folder visibility and permitted users.
// Only the folder creator can change permissions.
export const PUT = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const folderId = (await params).id;
  const organizationId = await getActiveOrganizationId(userId);

  const folder = await prisma.folder.findUnique({
    where: { id: folderId, organizationId }
  });

  if (!folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  // Only the folder creator can change permissions
  if (folder.createdBy !== userId) {
    return NextResponse.json(
      { error: 'Only the folder creator can change its permissions' },
      { status: 403 }
    );
  }

  const { visibility, userIds = [] } = await request.json();

  if (!['organization', 'restricted'].includes(visibility)) {
    return NextResponse.json(
      { error: 'visibility must be "organization" or "restricted"' },
      { status: 400 }
    );
  }

  // Validate all provided userIds are org members (via UserOrganization or org owner)
  if (visibility === 'restricted' && (userIds as string[]).length > 0) {
    const [members, org] = await Promise.all([
      prisma.userOrganization.findMany({
        where: { organizationId, userId: { in: userIds as string[] } },
        select: { userId: true }
      }),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { ownerId: true }
      })
    ]);

    const validIds = new Set(members.map((m: any) => m.userId));
    if (org?.ownerId) validIds.add(org.ownerId);
    // The creator is always valid
    validIds.add(folder.createdBy);

    const invalid = (userIds as string[]).filter((id) => !validIds.has(id));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: 'Some users are not members of this organization' },
        { status: 400 }
      );
    }
  }

  // Update visibility + replace permitted users atomically
  await prisma.$transaction(async (tx: any) => {
    await tx.folder.update({
      where: { id: folderId },
      data: { visibility }
    });

    await tx.folderPermission.deleteMany({ where: { folderId } });

    if (visibility === 'restricted' && (userIds as string[]).length > 0) {
      // Always ensure the creator is included
      const allUserIds = Array.from(new Set([folder.createdBy, ...(userIds as string[])]));
      await tx.folderPermission.createMany({
        data: allUserIds.map((uid: string) => ({ folderId, userId: uid }))
      });
    }
  });

  return NextResponse.json({
    status: 200,
    message: 'Folder permissions updated successfully'
  });
}));
