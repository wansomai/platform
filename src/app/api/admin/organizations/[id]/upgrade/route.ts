import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { AccountType } from '@/lib/constants/roles';
import type { ActionResponse } from '@/types/admin';
import { AppError } from '@/types/error';
import { sendTrialStartEmail } from '@/lib/email-service';

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
        owner: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    if (!org) {
      throw new AppError('Organization not found', 'NOT_FOUND', 404);
    }

    if (org.accountType === AccountType.ENTERPRISE) {
      throw new AppError('Organization is already upgraded to Enterprise', 'BAD_REQUEST', 400);
    }

    // Block manual upgrade if the org already has an active paid subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { organizationId },
      select: { status: true, planName: true },
    });

    if (existingSubscription && ['active', 'non_renewing'].includes(existingSubscription.status)) {
      throw new AppError(
        `This organization already has an active ${existingSubscription.planName} subscription. Manual upgrade is not needed.`,
        'BAD_REQUEST',
        400
      );
    }

    const now = new Date();
    const trialExpiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const expiryDateStr = trialExpiresAt.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

    // Manually upgrade to enterprise with 15-day trial window
    await prisma.$transaction([
      prisma.organization.update({
        where: { id: organizationId },
        data: {
          accountType: AccountType.ENTERPRISE,
          upgradeRequestToken: null,
          upgradeRequestedAt: null,
          trialUpgradedAt: now,
          trialExpiresAt,
          trialExpired: false,
        },
      }),
      prisma.adminLog.create({
        data: {
          organizationId,
          event: 'manual_trial_upgrade',
          details: {
            upgradedBy: userId,
            trialUpgradedAt: now.toISOString(),
            trialExpiresAt: trialExpiresAt.toISOString(),
          },
        },
      }),
      // In-app notification for the owner
      ...(org.owner ? [
        prisma.notification.create({
          data: {
            userId: org.owner.id,
            title: 'Your Pro trial is active',
            message: `You have been granted 15-day Pro access for ${org.name}. Your trial expires on ${expiryDateStr}. Upgrade to a paid plan before then to keep full access.`,
            type: 'info',
          },
        }),
      ] : []),
    ]);

    // Send trial-start email — outside transaction so a send failure does not rollback the upgrade
    if (org.owner) {
      await sendTrialStartEmail(org.owner, org.name, trialExpiresAt);
    }

    const response: ActionResponse = {
      success: true,
      message: `${org.name} has been manually upgraded to Enterprise account. Trial expires on ${expiryDateStr}.`,
    };

    return NextResponse.json(response);
  })
);
