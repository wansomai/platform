import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import type { ActionResponse } from '@/types/admin';
import { AppError } from '@/types/error';

/**
 * POST /api/admin/organizations/[id]/reject
 * Reject a pending upgrade request (clear token fields)
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
        upgradeRequestToken: true,
      },
    });

    if (!org) {
      throw new AppError('Organization not found', 'NOT_FOUND', 404);
    }

    if (!org.upgradeRequestToken) {
      throw new AppError('No pending upgrade request to reject', 'BAD_REQUEST', 400);
    }

    // Reject the upgrade by clearing token fields
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        upgradeRequestToken: null,
        upgradeRequestedAt: null,
      },
    });

    const response: ActionResponse = {
      success: true,
      message: `Upgrade request for ${org.name} has been rejected`,
    };

    return NextResponse.json(response);
  })
);
