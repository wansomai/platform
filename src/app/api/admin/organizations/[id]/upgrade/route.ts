import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { AccountType } from '@/lib/constants/roles';
import type { ActionResponse } from '@/types/admin';
import { AppError } from '@/types/error';

/**
 * POST /api/admin/organizations/[id]/upgrade
 * Manually upgrade an organization to enterprise (bypass request workflow)
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
      },
    });

    if (!org) {
      throw new AppError('Organization not found', 'NOT_FOUND', 404);
    }

    if (org.accountType === AccountType.ENTERPRISE) {
      throw new AppError('Organization is already upgraded to Enterprise', 'BAD_REQUEST', 400);
    }

    // Manually upgrade to enterprise
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        accountType: AccountType.ENTERPRISE,
        upgradeRequestToken: null, // Clear any pending request
        upgradeRequestedAt: null,
      },
    });

    const response: ActionResponse = {
      success: true,
      message: `${org.name} has been manually upgraded to Enterprise account`,
    };

    return NextResponse.json(response);
  })
);
