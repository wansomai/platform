import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/prisma/client';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { AccountType } from '@/lib/constants/roles';
import type { ActionResponse } from '@/types/admin';
import { AppError } from '@/types/error';

const prisma = new PrismaClient();

/**
 * POST /api/admin/organizations/[id]/downgrade
 * Manually downgrade an organization to personal
 * This will:
 * - Change accountType to personal
 * - Remove all non-owner members
 * - Cancel pending invitations
 */
export const POST = withErrorHandler(
  withAdminAuth(async (request: NextRequest, userId: string, context: { params: Promise<{ id: string }> }) => {
    const { id: organizationId } = await context.params;

    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        accountType: true,
        ownerId: true,
      },
    });

    if (!org) {
      throw new AppError('Organization not found', 'NOT_FOUND', 404);
    }

    if (org.accountType === AccountType.PERSONAL) {
      throw new AppError('Organization is already a Personal account', 'BAD_REQUEST', 400);
    }

    // Downgrade to personal account in a transaction
    await prisma.$transaction(async (tx) => {
      // Update account type
      await tx.organization.update({
        where: { id: organizationId },
        data: {
          accountType: AccountType.PERSONAL,
          upgradeRequestToken: null,
          upgradeRequestedAt: null,
        },
      });

      // Remove all non-owner members
      if (org.ownerId) {
        await tx.userOrganization.deleteMany({
          where: {
            organizationId,
            userId: { not: org.ownerId },
          },
        });
      }

      // Cancel all pending invitations
      await tx.organizationInvitation.deleteMany({
        where: { organizationId },
      });
    });

    const response: ActionResponse = {
      success: true,
      message: `${org.name} has been downgraded to Personal account. All non-owner members have been removed.`,
    };

    return NextResponse.json(response);
  })
);
