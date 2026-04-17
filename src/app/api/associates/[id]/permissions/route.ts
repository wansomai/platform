// app/api/associates/[id]/permissions/route.ts
//
// Manage user-level sharing for an AI Associate. Associates are user-level
// by default: only the creator sees them. The creator can explicitly share
// an associate with other organization members here; doing so also cascades
// DocumentPermission for every document in the associate's knowledge base so
// the recipients can read those documents from their vault.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { syncAssociateShareCascade } from '@/lib/auth/associateSharing';
import { z } from 'zod';

const sharePutSchema = z.object({
  userIds: z.array(z.string().min(1)).default([]),
});

// GET /api/associates/[id]/permissions
// Returns the share list for the associate plus org members for picker UI.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: associateId } = await params;

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Associates are user-level — the creator and explicitly-shared users can
    // always access their associate, regardless of which organization they have
    // currently switched to. The associate's organizationId governs which
    // org members show up in the sharing picker.
    const associate = await prisma.aIAssociate.findUnique({
      where: { id: associateId },
      select: {
        id: true,
        name: true,
        createdById: true,
        organizationId: true,
        knowledgeBase: true,
        sharedWith: {
          select: { userId: true },
        },
      },
    });

    if (!associate) {
      return NextResponse.json({ error: 'Associate not found' }, { status: 404 });
    }

    const isOwner = associate.createdById === userId;
    const isSharedWith = associate.sharedWith.some((s: any) => s.userId === userId);

    if (!isOwner && !isSharedWith) {
      return NextResponse.json({ error: 'Associate not found' }, { status: 404 });
    }

    const organizationId = associate.organizationId;
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        ownerId: true,
        owner: { select: { id: true, fullName: true, email: true } },
        members: {
          select: {
            role: true,
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    const memberMap = new Map<
      string,
      { id: string; name: string; email: string; role: string }
    >();
    for (const m of org?.members ?? []) {
      memberMap.set(m.user.id, {
        id: m.user.id,
        name: m.user.fullName || m.user.email,
        email: m.user.email,
        role: m.role,
      });
    }
    if (org?.owner && !memberMap.has(org.owner.id)) {
      memberMap.set(org.owner.id, {
        id: org.owner.id,
        name: org.owner.fullName || org.owner.email,
        email: org.owner.email,
        role: 'owner',
      });
    }

    const orgMembers = Array.from(memberMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const sharedUserIds = associate.sharedWith.map((s: any) => s.userId);

    return NextResponse.json({
      status: 200,
      message: 'Associate permissions retrieved successfully',
      data: {
        associateId: associate.id,
        associateName: associate.name,
        createdById: associate.createdById,
        currentUserId: userId,
        isOwner,
        sharedUserIds,
        kbDocumentCount: associate.knowledgeBase.length,
        orgMembers,
      },
    });
  } catch (error) {
    console.error('[associate permissions GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/associates/[id]/permissions
// Replace the full share list. Only the associate owner may call this. The
// set of shared users is reconciled with AIAssociateShare rows and the change
// cascades to DocumentPermission for every KB document.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: associateId } = await params;

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ownership is checked against the creator, not the user's active org —
    // the owner must always be able to manage sharing for an associate they
    // created, even if they have switched into another organization.
    const associate = await prisma.aIAssociate.findUnique({
      where: { id: associateId },
      select: {
        id: true,
        createdById: true,
        organizationId: true,
        knowledgeBase: true,
        sharedWith: { select: { userId: true } },
      },
    });

    if (!associate) {
      return NextResponse.json({ error: 'Associate not found' }, { status: 404 });
    }

    if (associate.createdById !== userId) {
      return NextResponse.json(
        { error: 'Only the associate owner can manage sharing' },
        { status: 403 }
      );
    }

    const organizationId = associate.organizationId;

    const body = await request.json().catch(() => ({}));
    const { userIds } = sharePutSchema.parse(body);

    // Owner must never be in the share list.
    const cleanUserIds = Array.from(
      new Set(userIds.filter((uid) => uid && uid !== userId))
    );

    // Validate that every target user is a member of the active organization.
    if (cleanUserIds.length > 0) {
      const [members, org] = await Promise.all([
        prisma.userOrganization.findMany({
          where: { organizationId, userId: { in: cleanUserIds } },
          select: { userId: true },
        }),
        prisma.organization.findUnique({
          where: { id: organizationId },
          select: { ownerId: true },
        }),
      ]);
      const valid = new Set(members.map((m: any) => m.userId));
      if (org?.ownerId) valid.add(org.ownerId);
      const invalid = cleanUserIds.filter((uid) => !valid.has(uid));
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: 'Some users are not members of this organization' },
          { status: 400 }
        );
      }
    }

    const currentUserIds = new Set(
      associate.sharedWith.map((s: any) => s.userId)
    );
    const nextUserIds = new Set(cleanUserIds);

    const addedUserIds = cleanUserIds.filter((uid) => !currentUserIds.has(uid));
    const removedUserIds = [...currentUserIds].filter((uid) => !nextUserIds.has(uid));

    await prisma.$transaction(async (tx: any) => {
      if (removedUserIds.length > 0) {
        await tx.aIAssociateShare.deleteMany({
          where: { associateId, userId: { in: removedUserIds } },
        });
      }

      if (addedUserIds.length > 0) {
        await tx.aIAssociateShare.createMany({
          data: addedUserIds.map((uid) => ({
            associateId,
            userId: uid,
            grantedById: userId,
          })),
          skipDuplicates: true,
        });
      }
    });

    await syncAssociateShareCascade({
      associateId,
      ownerId: userId,
      organizationId,
      kbDocumentIds: associate.knowledgeBase || [],
      addedUserIds,
      removedUserIds,
    });

    return NextResponse.json({
      status: 200,
      message: 'Associate sharing updated successfully',
      data: {
        added: addedUserIds.length,
        removed: removedUserIds.length,
        sharedUserIds: cleanUserIds,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[associate permissions PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
