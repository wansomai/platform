// src/app/api/subscription/status/route.ts
import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';
import { AppError } from '@/types/error';

export const GET = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string) => {
    // Get user with organization and subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          include: {
            subscription: {
              include: {
                payments: {
                  orderBy: { createdAt: 'desc' },
                  take: 5, // Last 5 payments
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.organization) {
      return createErrorResponse(
        new AppError('Organization not found', 'NOT_FOUND', 404)
      );
    }

    const subscription = user.organization.subscription;
    const isOwner = user.organization.ownerId === userId;

    // Determine effective plan status
    type EffectiveStatus = 'free' | 'active' | 'attention' | 'cancelled' | 'non_renewing';
    let effectiveStatus: EffectiveStatus = 'free';
    let canUpgrade = true;
    let canCancel = false;
    let hasActiveSubscription = false;

    if (subscription) {
      effectiveStatus = subscription.status as EffectiveStatus;
      hasActiveSubscription = ['active', 'non_renewing'].includes(subscription.status);
      canUpgrade = !hasActiveSubscription;
      canCancel = ['active', 'attention'].includes(subscription.status) && isOwner;
    }

    // Also check if organization is enterprise (could be from team upgrade flow)
    const isEnterprise = user.organization.accountType === 'enterprise';

    return createApiResponse({
      subscription: subscription ? {
        id: subscription.id,
        planName: subscription.planName,
        planPrice: subscription.planPrice,
        planType: subscription.planType,
        billingCycle: subscription.billingCycle,
        status: subscription.status,
        seatCount: subscription.seatCount,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        paystackSubscriptionId: subscription.paystackSubscriptionId,
        recentPayments: subscription.payments.map(p => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })),
      } : null,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        accountType: user.organization.accountType,
      },
      effectiveStatus,
      isEnterprise,
      isOwner,
      canUpgrade,
      canCancel,
      hasProAccess: hasActiveSubscription || isEnterprise,
    });
  })
);
