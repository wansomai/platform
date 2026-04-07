// src/app/api/subscription/status/route.ts
import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';
import prisma from '@/lib/prisma';
import { AppError } from '@/types/error';

export const GET = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string) => {
    // Always resolve against the active org, not the primary org
    const activeOrgId = await getActiveOrganizationId(userId);

    const org = await prisma.organization.findUnique({
      where: { id: activeOrgId },
      include: {
        subscription: {
          include: {
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!org) {
      return createErrorResponse(
        new AppError('Organization not found', 'NOT_FOUND', 404)
      );
    }

    // Determine user's role in the active org
    const isOwner = org.ownerId === userId;

    // Check admin role via UserOrganization (for non-primary orgs)
    const membership = await prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: activeOrgId } },
      select: { role: true },
    });
    const isAdmin = isOwner || membership?.role === 'admin';

    // Regular members cannot view billing
    if (!isAdmin) {
      return createApiResponse({
        subscription: null,
        organization: { id: org.id, name: org.name, accountType: org.accountType },
        effectiveStatus: 'free' as const,
        isEnterprise: org.accountType === 'enterprise',
        isOwner: false,
        canUpgrade: false,
        canCancel: false,
        hasProAccess: org.accountType === 'enterprise',
        associateCount: 0,
        canViewBilling: false,
      });
    }

    const subscription = org.subscription;
    const isEnterprise = org.accountType === 'enterprise';

    // Detect active manual trial (enterprise with no Paystack subscription, trial window still open)
    const now = new Date();
    const isManualTrial =
      isEnterprise &&
      !subscription &&
      !org.trialExpired &&
      org.trialExpiresAt != null &&
      org.trialExpiresAt > now;

    const associateCount = await prisma.aIAssociate.count({
      where: { organizationId: activeOrgId },
    });

    // ── Effective status from DB ─────────────────────────────────────────────
    type EffectiveStatus = 'free' | 'active' | 'attention' | 'cancelled' | 'non_renewing';
    let effectiveStatus: EffectiveStatus = 'free';
    let canUpgrade = true;
    let canCancel = false;
    let hasActiveSubscription = false;

    if (subscription) {
      effectiveStatus = subscription.status as EffectiveStatus;
      hasActiveSubscription = ['active', 'non_renewing'].includes(effectiveStatus);
      canUpgrade = !hasActiveSubscription;
      canCancel = ['active', 'attention'].includes(effectiveStatus) && isOwner;
    }

    return createApiResponse({
      subscription: subscription
        ? {
            id: subscription.id,
            planName: subscription.planName,
            planPrice: subscription.planPrice,
            planType: subscription.planType,
            billingCycle: subscription.billingCycle,
            status: effectiveStatus,
            seatCount: subscription.seatCount,
            currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            paystackSubscriptionId: subscription.paystackSubscriptionId,
            recentPayments: subscription.payments.map((p) => ({
              id: p.id,
              amount: p.amount,
              currency: p.currency,
              status: p.status,
              paidAt: p.paidAt?.toISOString() ?? null,
              createdAt: p.createdAt.toISOString(),
            })),
          }
        : null,
      organization: {
        id: org.id,
        name: org.name,
        accountType: org.accountType,
      },
      effectiveStatus,
      isEnterprise,
      isOwner,
      canUpgrade,
      canCancel,
      hasProAccess: hasActiveSubscription || isEnterprise,
      isManualTrial,
      trialExpiresAt: org.trialExpiresAt?.toISOString() ?? null,
      associateCount,
      canViewBilling: !!subscription,
    });
  })
);
