// src/lib/auth/associateSharing.ts
// Helpers that keep document permissions in sync when an AI Associate is
// shared/unshared with another user, or when its knowledge base changes.
//
// When an associate is shared with a user, every document in its knowledge
// base must become accessible to that user. Since vault documents default to
// `private`, we promote them to `restricted` and add explicit DocumentPermission
// rows for every shared user. Removing a user or a KB document reverses the
// grant — but ONLY if that same (doc, user) pair is not kept alive by another
// shared associate owned by the same creator.

import prisma from '@/lib/prisma';

interface SyncAssociateSharesArgs {
  associateId: string;
  ownerId: string;
  organizationId: string;
  kbDocumentIds: string[];
  addedUserIds: string[];
  removedUserIds: string[];
}

/**
 * Cascade-grant / revoke access on the associate's KB documents when the set of
 * users that the associate is shared with changes.
 *
 * - `addedUserIds` gain DocumentPermission on every KB document.
 * - `removedUserIds` lose DocumentPermission on every KB document, unless the
 *   same (doc, user) pair is preserved by another associate the owner shared
 *   with that user (prevents cross-associate collateral removal).
 */
export async function syncAssociateShareCascade({
  associateId,
  ownerId,
  organizationId,
  kbDocumentIds,
  addedUserIds,
  removedUserIds,
}: SyncAssociateSharesArgs): Promise<void> {
  if (kbDocumentIds.length === 0) return;

  // Only cascade on docs the owner actually created in this organization.
  // Documents owned by someone else are not managed here.
  const ownedDocs = await prisma.document.findMany({
    where: {
      id: { in: kbDocumentIds },
      organization_id: organizationId,
      created_by: ownerId,
    },
    select: { id: true, visibility: true },
  });

  const docIds = ownedDocs.map((d: any) => d.id);
  if (docIds.length === 0) return;

  await prisma.$transaction(async (tx: any) => {
    if (addedUserIds.length > 0) {
      // Promote private docs to `restricted` so their permission rows take effect
      await tx.document.updateMany({
        where: {
          id: { in: docIds },
          visibility: 'private',
        },
        data: { visibility: 'restricted' },
      });

      const rows = docIds.flatMap((documentId: string) =>
        addedUserIds.map((userId) => ({ documentId, userId }))
      );

      if (rows.length > 0) {
        await tx.documentPermission.createMany({
          data: rows,
          skipDuplicates: true,
        });
      }
    }

    if (removedUserIds.length > 0) {
      // For each (doc, removedUser) pair, only delete the permission if no
      // OTHER associate (owned by the same user, still shared with that user)
      // keeps it alive.
      const otherShares = await tx.aIAssociateShare.findMany({
        where: {
          userId: { in: removedUserIds },
          associateId: { not: associateId },
          associate: { createdById: ownerId },
        },
        select: {
          userId: true,
          associate: { select: { knowledgeBase: true } },
        },
      });

      const keepMap = new Map<string, Set<string>>();
      for (const share of otherShares) {
        const set = keepMap.get(share.userId) ?? new Set<string>();
        for (const d of share.associate.knowledgeBase || []) set.add(d);
        keepMap.set(share.userId, set);
      }

      for (const userId of removedUserIds) {
        const keepDocs = keepMap.get(userId) ?? new Set<string>();
        const deletable = docIds.filter((d: string) => !keepDocs.has(d));
        if (deletable.length > 0) {
          await tx.documentPermission.deleteMany({
            where: {
              userId,
              documentId: { in: deletable },
            },
          });
        }
      }
    }
  });
}

interface SyncKBDeltaArgs {
  ownerId: string;
  organizationId: string;
  addedDocIds: string[];
  removedDocIds: string[];
  sharedUserIds: string[];
}

/**
 * Cascade when an associate's KB changes while already shared with some users.
 * New KB docs → grant every shared user permission (and promote visibility).
 * Removed KB docs → revoke from every shared user (if not kept by another share).
 */
export async function syncAssociateKBDocumentPermissions({
  ownerId,
  organizationId,
  addedDocIds,
  removedDocIds,
  sharedUserIds,
}: SyncKBDeltaArgs): Promise<void> {
  if (sharedUserIds.length === 0) return;

  if (addedDocIds.length > 0) {
    await syncAssociateShareCascade({
      associateId: '__kb_add__',
      ownerId,
      organizationId,
      kbDocumentIds: addedDocIds,
      addedUserIds: sharedUserIds,
      removedUserIds: [],
    });
  }

  if (removedDocIds.length > 0) {
    // Compute which removed docs remain reachable for each user via other
    // associates the same owner shared with them.
    const otherShares = await prisma.aIAssociateShare.findMany({
      where: {
        userId: { in: sharedUserIds },
        associate: { createdById: ownerId },
      },
      select: {
        userId: true,
        associate: { select: { knowledgeBase: true } },
      },
    });

    const keepMap = new Map<string, Set<string>>();
    for (const share of otherShares) {
      const set = keepMap.get(share.userId) ?? new Set<string>();
      for (const d of share.associate.knowledgeBase || []) set.add(d);
      keepMap.set(share.userId, set);
    }

    const ownedDocs = await prisma.document.findMany({
      where: {
        id: { in: removedDocIds },
        organization_id: organizationId,
        created_by: ownerId,
      },
      select: { id: true },
    });
    const docIds = ownedDocs.map((d: any) => d.id);
    if (docIds.length === 0) return;

    await prisma.$transaction(async (tx: any) => {
      for (const userId of sharedUserIds) {
        const keep = keepMap.get(userId) ?? new Set<string>();
        const toRevoke = docIds.filter((d: string) => !keep.has(d));
        if (toRevoke.length > 0) {
          await tx.documentPermission.deleteMany({
            where: { userId, documentId: { in: toRevoke } },
          });
        }
      }
    });
  }
}
