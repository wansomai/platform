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

    // If no Paystack subscription ID stored locally, try to resolve it
    let paystackSubId = subscription.paystackSubscriptionId;

    if (!paystackSubId) {
      try {
        // If we have a customer code, query subscriptions directly
        if (subscription.paystackCustomerId) {
          const listResponse = await fetch(
            `${PAYSTACK_BASE_URL}/subscription?customer=${subscription.paystackCustomerId}`,
            {
              headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
            }
          );
          const listData = await listResponse.json();
          if (listData.status && listData.data?.length > 0) {
            const activeSub = listData.data.find(
              (s: any) => s.status === 'active' || s.status === 'non-renewing'
            ) || listData.data[0];
            paystackSubId = activeSub.subscription_code || null;
          }
        }

        // If still no subscription ID, look up customer by email first
        if (!paystackSubId) {
          // Find customer on Paystack by email
          const customerListResponse = await fetch(
            `${PAYSTACK_BASE_URL}/customer/${encodeURIComponent(user.email)}`,
            {
              headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
            }
          );
          const customerData = await customerListResponse.json();

          if (customerData.status && customerData.data) {
            const customerCode = customerData.data.customer_code;

            // Now fetch subscriptions for this customer
            if (customerCode) {
              // Update the stored customer ID while we're at it
              if (!subscription.paystackCustomerId) {
                await prisma.subscription.update({
                  where: { id: subscription.id },
                  data: { paystackCustomerId: customerCode },
                });
              }
                console.log('Fetching subscriptions for customer code:', customerCode);
              const subListResponse = await fetch(
                `${PAYSTACK_BASE_URL}/subscription?customer=${customerCode}`,
                {
                  headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
                }
              );
              const subListData = await subListResponse.json();
              console.log('Subscription list data:', subListData);
              if (subListData.status && subListData.data?.length > 0) {
                const activeSub = subListData.data.find(
                  (s: any) => s.status === 'active' || s.status === 'non-renewing'
                ) || subListData.data[0];
                paystackSubId = activeSub.subscription_code || null;
              }
            }
          }
        }

        // Persist the subscription ID for future use
        if (paystackSubId) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { paystackSubscriptionId: paystackSubId },
          });
        }
      } catch (err) {
        console.error('Error cancelling subscription:', err);
      }
    }

    // No Paystack subscription found — direct-payment subscription (multi-currency flow).
    // Mark as non_renewing so the user keeps access until currentPeriodEnd.
    // The renewal cron will downgrade the account after the grace period.
    if (!paystackSubId) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'non_renewing' },
      });

      return createApiResponse(
        {
          message: 'Subscription cancelled successfully',
          effectiveUntil: subscription.currentPeriodEnd,
          status: 'non_renewing',
        },
        'Your subscription has been cancelled. You will have access until the end of your current billing period.'
      );
    }

    // First, get the subscription details from Paystack to get the email token
    const fetchResponse = await fetch(
      `${PAYSTACK_BASE_URL}/subscription/${paystackSubId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const fetchData = await fetchResponse.json();

    if (!fetchData.status) {
      console.error('Failed to fetch subscription:', fetchData);
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
          code: paystackSubId,
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
