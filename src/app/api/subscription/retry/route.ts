// src/app/api/subscription/retry/route.ts
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

    // Only organization owner can retry payments
    if (user.organization.ownerId !== userId) {
      return createErrorResponse(
        new AppError('Only organization owners can retry payments', 'FORBIDDEN', 403)
      );
    }

    const subscription = user.organization.subscription;

    if (!subscription) {
      return createBadRequestResponse('No subscription found');
    }

    // Can only retry if subscription is in 'attention' status (failed payment)
    if (subscription.status !== 'attention') {
      return createBadRequestResponse(
        'Payment retry is only available for subscriptions with failed payments'
      );
    }

    // Resolve authorization code — prefer the one stored directly on the subscription
    // (set by verify route for direct/localized payments), fall back to Paystack customer lookup
    // for legacy plan-based subscriptions.
    let authorizationCode: string | null = subscription.paystackAuthCode || null;
    let authChannel = 'card';

    if (!authorizationCode) {
      if (!subscription.paystackCustomerId) {
        return createBadRequestResponse('No payment method on file');
      }

      const customerResponse = await fetch(
        `${PAYSTACK_BASE_URL}/customer/${subscription.paystackCustomerId}`,
        { method: 'GET', headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );
      const customerData = await customerResponse.json();

      if (!customerData.status || !customerData.data.authorizations?.length) {
        return createBadRequestResponse('No valid payment method found. Please update your card details.');
      }

      const authorization = customerData.data.authorizations.find(
        (auth: any) => auth.reusable && !auth.expired
      );

      if (!authorization) {
        return createBadRequestResponse('Your payment method has expired. Please update your card details.');
      }

      authorizationCode = authorization.authorization_code;
      authChannel = authorization.channel || 'card';
    }

    // Resolve amount and currency from the last successful payment record
    const lastPayment = await prisma.payment.findFirst({
      where: { subscriptionId: subscription.id, status: 'success' },
      orderBy: { createdAt: 'desc' },
    });

    const amount = parseFloat(subscription.planPrice || '0') * 100; // major unit → kobo/cents
    const currency = lastPayment?.currency || 'USD';

    if (amount <= 0) {
      return createBadRequestResponse('Invalid subscription amount');
    }

    const reference = `RETRY-${subscription.id.slice(0, 8)}-${Date.now()}`;

    const chargeResponse = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/charge_authorization`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorization_code: authorizationCode,
          email: user.email,
          amount,
          currency,
          reference,
          metadata: {
            userId: user.id,
            organizationId: user.organization.id,
            subscriptionId: subscription.id,
            isRetry: true,
          },
        }),
      }
    );

    const chargeData = await chargeResponse.json();

    if (!chargeData.status) {
      console.error('Retry charge failed:', chargeData);
      return createErrorResponse(
        new AppError(
          chargeData.message || 'Payment retry failed',
          'PAYMENT_FAILED',
          400
        )
      );
    }

    // Check if charge was successful
    if (chargeData.data.status === 'success') {
      // Calculate new period end
      const now = new Date();
      const periodEnd = new Date(now);

      switch (subscription.billingCycle) {
        case 'daily':
          periodEnd.setDate(periodEnd.getDate() + 1);
          break;
        case 'weekly':
          periodEnd.setDate(periodEnd.getDate() + 7);
          break;
        case 'quarterly':
          periodEnd.setMonth(periodEnd.getMonth() + 3);
          break;
        case 'biannually':
          periodEnd.setMonth(periodEnd.getMonth() + 6);
          break;
        case 'annually':
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          break;
        default: // monthly
          periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Update subscription and create payment record
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        }),
        prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            paystackReference: reference,
            amount: amount,
            currency,
            status: 'success',
            paymentMethod: authChannel,
            paidAt: new Date(),
            metadata: {
              isRetry: true,
              authorizationCode: authorizationCode,
            },
          },
        }),
      ]);

      return createApiResponse(
        {
          status: 'success',
          message: 'Payment successful',
          newPeriodEnd: periodEnd,
        },
        'Payment retry successful. Your subscription is now active.'
      );
    } else {
      // Payment pending or failed
      return createApiResponse(
        {
          status: chargeData.data.status,
          message: chargeData.data.gateway_response || 'Payment processing',
        },
        'Payment is being processed. Please check back shortly.'
      );
    }
  })
);
