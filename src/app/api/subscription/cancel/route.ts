// src/app/api/subscription/cancel/route.ts
import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, createBadRequestResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';
import { AppError } from '@/types/error';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string) => {
    if (!PAYSTACK_SECRET_KEY) {
      return createErrorResponse(
        new AppError('Payment service not configured', 'PAYMENT_NOT_CONFIGURED', 500)
      );
    }

    // Get user with organization and subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user || !user.organization) {
      return createErrorResponse(
        new AppError('Organization not found', 'NOT_FOUND', 404)
      );
    }

    // Only organization owner can cancel
    if (user.organization.ownerId !== userId) {
      return createErrorResponse(
        new AppError('Only organization owners can cancel subscriptions', 'FORBIDDEN', 403)
      );
    }

    const subscription = user.organization.subscription;

    if (!subscription) {
      return createBadRequestResponse('No active subscription found');
    }

    if (!['active', 'attention'].includes(subscription.status)) {
      return createBadRequestResponse(`Cannot cancel subscription with status: ${subscription.status}`);
    }

    if (!subscription.paystackSubscriptionId) {
      return createBadRequestResponse('Subscription not linked to Paystack');
    }

    // First, get the subscription details from Paystack to get the email token
    const fetchResponse = await fetch(
      `${PAYSTACK_BASE_URL}/subscription/${subscription.paystackSubscriptionId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const fetchData = await fetchResponse.json();

    if (!fetchData.status) {
      console.error('Failed to fetch subscription from Paystack:', fetchData);
      return createErrorResponse(
        new AppError('Failed to fetch subscription details', 'PAYSTACK_ERROR', 500)
      );
    }

    const emailToken = fetchData.data.email_token;

    if (!emailToken) {
      return createErrorResponse(
        new AppError('Unable to get cancellation token', 'PAYSTACK_ERROR', 500)
      );
    }

    // Disable the subscription on Paystack
    const disableResponse = await fetch(
      `${PAYSTACK_BASE_URL}/subscription/disable`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: subscription.paystackSubscriptionId,
          token: emailToken,
        }),
      }
    );

    const disableData = await disableResponse.json();

    if (!disableData.status) {
      console.error('Failed to disable subscription on Paystack:', disableData);
      return createErrorResponse(
        new AppError(
          disableData.message || 'Failed to cancel subscription',
          'PAYSTACK_ERROR',
          500
        )
      );
    }

    // Update local subscription status
    // Note: Webhook will also update this, but we update immediately for better UX
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'non_renewing' }, // Will become 'cancelled' after period ends
    });

    return createApiResponse(
      {
        message: 'Subscription cancelled successfully',
        effectiveUntil: subscription.currentPeriodEnd,
        status: 'non_renewing',
      },
      'Your subscription has been cancelled. You will have access until the end of your current billing period.'
    );
  })
);
