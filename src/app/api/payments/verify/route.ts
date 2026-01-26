// src/app/api/payments/verify/route.ts
import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, createBadRequestResponse } from '@/lib/api/response';
import { withErrorHandler } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';
import { AppError } from '@/types/error';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Calculate subscription period end date based on plan interval
function calculatePeriodEnd(interval: string): Date {
  const now = new Date();
  const periodEnd = new Date(now);

  switch (interval) {
    case 'daily':
      periodEnd.setDate(periodEnd.getDate() + 1);
      break;
    case 'weekly':
      periodEnd.setDate(periodEnd.getDate() + 7);
      break;
    case 'monthly':
      periodEnd.setMonth(periodEnd.getMonth() + 1);
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
    default:
      periodEnd.setMonth(periodEnd.getMonth() + 1); // Default to monthly
  }

  return periodEnd;
}

// This endpoint doesn't require authentication - it verifies via Paystack reference
export const GET = withErrorHandler(
  async (request: NextRequest) => {
    if (!PAYSTACK_SECRET_KEY) {
      return createErrorResponse(
        new AppError('Payment service not configured', 'PAYMENT_NOT_CONFIGURED', 500)
      );
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return createBadRequestResponse('Payment reference is required');
    }

    // Verify transaction with Paystack
    const paystackResponse = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return createErrorResponse(
        new AppError(
          paystackData.message || 'Failed to verify payment',
          'VERIFICATION_FAILED',
          400
        )
      );
    }

    const transaction = paystackData.data;

    // Check if transaction was successful
    if (transaction.status !== 'success') {
      return createApiResponse(
        {
          status: transaction.status,
          message: transaction.gateway_response || 'Payment was not successful',
        },
        'Payment verification completed'
      );
    }

    // Extract metadata - this contains the organizationId we set during initialization
    const metadata = transaction.metadata || {};
    const organizationId = metadata.organizationId;

    if (!organizationId) {
      // Try to find organization by customer email
      const customerEmail = transaction.customer?.email;
      if (customerEmail) {
        const user = await prisma.user.findUnique({
          where: { email: customerEmail },
          include: { organization: true },
        });

        if (user?.organization) {
          // Use this organization
          return await processPayment(transaction, user.organization.id, reference);
        }
      }

      return createErrorResponse(
        new AppError('Could not identify organization for this payment', 'INVALID_METADATA', 400)
      );
    }

    return await processPayment(transaction, organizationId, reference);
  }
);

async function processPayment(transaction: any, organizationId: string, reference: string) {
  // Check if payment already processed
  const existingPayment = await prisma.payment.findUnique({
    where: { paystackReference: reference },
  });

  if (existingPayment) {
    // Payment already processed, return success
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    return createApiResponse(
      {
        status: 'success',
        message: 'Payment already processed',
        alreadyProcessed: true,
        subscription: subscription ? {
          planName: subscription.planName,
          billingCycle: subscription.billingCycle,
          currentPeriodEnd: subscription.currentPeriodEnd,
        } : null,
      },
      'Payment already processed'
    );
  }

  // Get plan details from transaction
  const plan = transaction.plan_object || transaction.plan || {};
  const planInterval = plan.interval || 'monthly';
  const planName = plan.name || 'Professional';

  // Calculate subscription period
  const now = new Date();
  const periodEnd = calculatePeriodEnd(planInterval);

  // Create or update subscription and payment in a transaction
  const subscription = await prisma.$transaction(async (tx) => {
    // Create or update subscription
    const sub = await tx.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        planName: planName,
        planPrice: String(transaction.amount / 100),
        billingCycle: planInterval,
        status: 'active',
        paystackCustomerId: transaction.customer?.customer_code || null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        planName: planName,
        planPrice: String(transaction.amount / 100),
        billingCycle: planInterval,
        status: 'active',
        paystackCustomerId: transaction.customer?.customer_code || null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // Create payment record
    await tx.payment.create({
      data: {
        subscriptionId: sub.id,
        paystackReference: reference,
        amount: transaction.amount,
        currency: transaction.currency || 'USD',
        status: 'success',
        paymentMethod: transaction.channel || 'card',
        paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
        metadata: {
          gatewayResponse: transaction.gateway_response,
          channel: transaction.channel,
          ipAddress: transaction.ip_address,
          source: 'verify',
        },
      },
    });

    return sub;
  });

  return createApiResponse(
    {
      status: 'success',
      message: 'Payment verified and subscription activated',
      subscription: {
        planName: subscription.planName,
        billingCycle: subscription.billingCycle,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    },
    'Payment successful'
  );
}
