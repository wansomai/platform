// app/api/documents/[id]/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';

// GET /api/documents/[id]/permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const documentId = (await params).id;

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const organizationId = await getActiveOrganizationId(userId);

    // Two parallel queries instead of three:
    //  1. Document + its current permissions
    //  2. Org with members + owner in one shot (avoids JOIN sort in SQL — sorted in JS)
    const [document, org] = await Promise.all([
      prisma.document.findFirst({
        where: { id: documentId, organization_id: organizationId },
        select: {
          id: true,
          created_by: true,
          visibility: true,
          permissions: {
            select: { userId: true }
          }
        }
      }),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          ownerId: true,
          owner: { select: { id: true, fullName: true, email: true } },
          members: {
            select: {
              role: true,
              user: { select: { id: true, fullName: true, email: true } }
            }
          }
        }
      })
    ]);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Access check
    const isOwner = document.created_by === userId;
    const isOrgVisible = document.visibility === 'organization';
    const hasPermission = document.permissions.some((p: any) => p.userId === userId);

    if (!isOwner && !isOrgVisible && !hasPermission) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Build deduplicated org members list (sort in JS — no JOIN sort in DB)
    const memberMap = new Map<string, { id: string; name: string; email: string; role: string }>();

    for (const m of (org?.members ?? [])) {
      memberMap.set(m.user.id, {
        id: m.user.id,
        name: m.user.fullName || m.user.email,
        email: m.user.email,
        role: m.role
      });
    }

    // Ensure org owner is in the list even if not in UserOrganization
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

    // Enrich permittedUsers from the member map
    const permittedUsers = document.permissions
      .map((p: any) => memberMap.get(p.userId))
      .filter(Boolean)
      .map((m: any) => ({ id: m.id, fullName: m.name, email: m.email }));

    return NextResponse.json({
      status: 200,
      message: 'Document permissions retrieved successfully',
      data: {
        documentId: document.id,
        createdBy: document.created_by,
        currentUserId: userId,
        isOwner,
        visibility: document.visibility ?? 'private',
        permittedUsers,
        orgMembers
      }
    });
  } catch (error) {
    console.error('[document permissions GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/documents/[id]/permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const documentId = (await params).id;

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const organizationId = await getActiveOrganizationId(userId);

    const document = await prisma.document.findFirst({
      where: { id: documentId, organization_id: organizationId }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.created_by !== userId) {
      return NextResponse.json(
        { error: 'Only the document owner can change its permissions' },
        { status: 403 }
      );
    }

    const { visibility, userIds = [] } = await request.json();

    if (!['private', 'organization', 'restricted'].includes(visibility)) {
      return NextResponse.json(
        { error: 'visibility must be "private", "organization", or "restricted"' },
        { status: 400 }
      );
    }

    // Validate all provided userIds are org members
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
      validIds.add(document.created_by);

      const invalid = (userIds as string[]).filter((id) => !validIds.has(id));
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: 'Some users are not members of this organization' },
          { status: 400 }
        );
      }
    }

    // Update visibility and replace permitted users atomically
    await prisma.$transaction(async (tx: any) => {
      await tx.document.update({
        where: { id: documentId },
        data: { visibility }
      });

      await tx.documentPermission.deleteMany({ where: { documentId } });

      if (visibility === 'restricted' && (userIds as string[]).length > 0) {
        const allUserIds = Array.from(new Set([document.created_by, ...(userIds as string[])]));
        await tx.documentPermission.createMany({
          data: allUserIds.map((uid: string) => ({ documentId, userId: uid }))
        });
      }
    });

    return NextResponse.json({
      status: 200,
      message: 'Document permissions updated successfully'
    });
  } catch (error) {
    console.error('[document permissions PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
