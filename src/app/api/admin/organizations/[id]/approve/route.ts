import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/prisma/client';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { AccountType } from '@/lib/constants/roles';
import type { ActionResponse } from '@/types/admin';
import { AppError } from '@/types/error';

const prisma = new PrismaClient();

/**
 * POST /api/admin/organizations/[id]/approve
 * Approve a pending upgrade request
 */
export const POST = withErrorHandler(
  withAdminAuth(async (request: NextRequest, userId: string, context: { params: Promise<{ id: string }> }) => {
    const { id: organizationId } = await context.params;

    // Verify organization exists and has pending upgrade request
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        accountType: true,
        upgradeRequestToken: true,
        owner: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!org) {
      throw new AppError('Organization not found', 'NOT_FOUND', 404);
    }

    if (!org.upgradeRequestToken) {
      throw new AppError('No pending upgrade request', 'BAD_REQUEST', 400);
    }

    if (org.accountType === AccountType.ENTERPRISE) {
      throw new AppError('Organization is already upgraded', 'BAD_REQUEST', 400);
    }

    // Approve the upgrade
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        accountType: AccountType.ENTERPRISE,
        upgradeRequestToken: null,
        upgradeRequestedAt: null,
      },
    });

    const response: ActionResponse = {
      success: true,
      message: `Successfully upgraded ${org.name} to Enterprise account`,
    };

    return NextResponse.json(response);
  })
);
