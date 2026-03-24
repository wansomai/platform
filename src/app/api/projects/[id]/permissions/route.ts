// app/api/projects/[id]/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';

// GET /api/projects/[id]/permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id;

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const organizationId = await getActiveOrganizationId(userId);

    // Load project + its members + org members in parallel
    const [project, org] = await Promise.all([
      prisma.project.findFirst({
        where: { id: projectId, organizationId },
        select: {
          id: true,
          visibility: true,
          members: { select: { userId: true, role: true, createdAt: true } }
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

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // The workspace owner is the admin member who was added first (the creator).
    // Only this person can manage sharing — not other admins if any exist.
    const adminMembers = project.members
      .filter((m) => m.role === 'admin')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const ownerUserId = adminMembers[0]?.userId ?? null;
    const isOwner = ownerUserId === userId;

    const currentMember = project.members.find((m) => m.userId === userId);

    // Non-members can view (read-only) if they're an org member
    if (!currentMember) {
      const isOrgMember =
        org?.ownerId === userId ||
        (org?.members ?? []).some((m) => m.user.id === userId);
      if (!isOrgMember) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      // isOwner stays false — they can see but not edit
    }

    // Build deduplicated org member map sorted by name
    const memberMap = new Map<string, { id: string; name: string; email: string; role: string }>();

    for (const m of (org?.members ?? [])) {
      memberMap.set(m.user.id, {
        id: m.user.id,
        name: m.user.fullName || m.user.email,
        email: m.user.email,
        role: m.role
      });
    }
    if (org?.owner && !memberMap.has(org.owner.id)) {
      memberMap.set(org.owner.id, {
        id: org.owner.id,
        name: org.owner.fullName || org.owner.email,
        email: org.owner.email,
        role: 'owner'
      });
    }

    const orgMembers = Array.from(memberMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Owner is pinned (always selected, cannot be removed); regular members are editable
    const adminIds = ownerUserId ? [ownerUserId] : [];
    const memberIds = project.members.filter((m) => m.role === 'member').map((m) => m.userId);

    return NextResponse.json({
      status: 200,
      message: 'Project permissions retrieved successfully',
      data: {
        projectId: project.id,
        currentUserId: userId,
        isAdmin: isOwner,   // kept as isAdmin for modal compatibility — true only for the owner
        visibility: project.visibility ?? 'restricted',
        orgMembers,
        adminIds,
        memberIds
      }
    });
  } catch (error) {
    console.error('[project permissions GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id;

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const organizationId = await getActiveOrganizationId(userId);

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: {
        id: true,
        members: { select: { userId: true, role: true, createdAt: true } }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only the workspace owner (the first admin = creator) can change sharing settings
    const ownerMember = project.members
      .filter((m) => m.role === 'admin')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

    if (ownerMember?.userId !== userId) {
      return NextResponse.json(
        { error: 'Only the workspace owner can change sharing settings' },
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

    // The owner's ProjectMember row is always preserved
    const ownerUserId = ownerMember.userId;

    await prisma.$transaction(async (tx: any) => {
      // Update visibility
      await tx.project.update({
        where: { id: projectId },
        data: { visibility }
      });

      if (visibility === 'organization') {
        // Add every current org member as a 'member' (skip the owner)
        const orgMembers = await tx.userOrganization.findMany({
          where: { organizationId },
          select: { userId: true }
        });
        const org = await tx.organization.findUnique({
          where: { id: organizationId },
          select: { ownerId: true }
        });
        const allOrgUserIds = Array.from(new Set([
          ...orgMembers.map((m: any) => m.userId),
          ...(org?.ownerId ? [org.ownerId] : [])
        ]));

        for (const uid of allOrgUserIds) {
          if (uid === ownerUserId) continue; // owner row is untouched
          await tx.projectMember.upsert({
            where: { userId_projectId: { userId: uid, projectId } },
            update: {},
            create: { userId: uid, projectId, role: 'member' }
          });
        }
      } else {
        // restricted: remove all non-owner members then re-add selected ones
        await tx.projectMember.deleteMany({
          where: { projectId, role: 'member' }
        });

        const validatedIds = (userIds as string[]).filter((id) => id !== ownerUserId);
        if (validatedIds.length > 0) {
          await tx.projectMember.createMany({
            data: validatedIds.map((uid: string) => ({ userId: uid, projectId, role: 'member' })),
            skipDuplicates: true
          });
        }
      }
    });

    return NextResponse.json({
      status: 200,
      message: 'Project permissions updated successfully'
    });
  } catch (error) {
    console.error('[project permissions PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
