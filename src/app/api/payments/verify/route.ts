// src/app/api/payments/verify/route.ts
import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, createBadRequestResponse } from '@/lib/api/response';
import { withErrorHandler } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';
import { AppError } from '@/types/error';
import { sendTeamUpgradeConfirmedEmail } from '@/lib/email-service';

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

  // Read planType and payment mode from metadata
  const metadata = transaction.metadata || {};
  const planType: 'personal' | 'teams' = metadata.planType === 'teams' ? 'teams' : 'personal';
  const isDirectPayment: boolean = metadata.isDirectPayment === true;

  // For direct payments there is no Paystack plan object — use sensible defaults.
  // For plan-based payments, read plan details from the transaction as before.
  const plan = transaction.plan_object || transaction.plan || {};
  const planInterval = plan.interval || 'monthly';
  const planName = isDirectPayment
    ? (planType === 'teams' ? 'Teams' : 'Professional')
    : (plan.name || 'Professional');

  // Extract Paystack subscription code if available
  const paystackSubscriptionId = transaction.subscription_code
    || transaction.plan_object?.subscriptions?.[0]?.subscription_code
    || null;

  // Extract authorization code for future seat charges (teams plan)
  const paystackAuthCode: string | null = transaction.authorization?.authorization_code || null;

  // If no subscription code in transaction, try to fetch it from Paystack using customer code
  let resolvedSubscriptionId = paystackSubscriptionId;
  if (!resolvedSubscriptionId && transaction.customer?.customer_code && PAYSTACK_SECRET_KEY) {
    try {
      const customerResponse = await fetch(
        `${PAYSTACK_BASE_URL}/subscription?customer=${transaction.customer.customer_code}`,
        {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        }
      );
      const customerData = await customerResponse.json();
      if (customerData.status && customerData.data?.length > 0) {
        const activeSub = customerData.data.find(
          (s: any) => s.status === 'active' || s.status === 'non-renewing'
        ) || customerData.data[0];
        resolvedSubscriptionId = activeSub.subscription_code || null;
      }
    } catch (err) {
      console.error('Failed to fetch subscription code from Paystack:', err);
    }
  }

  // Calculate subscription period
  const now = new Date();
  const periodEnd = calculatePeriodEnd(planInterval);

  // Create or update subscription and payment in a transaction
  const subscription = await prisma.$transaction(async (tx) => {
    // Always save the authorization code — the renewal cron uses it for recurring charges
    // regardless of plan type (personal or teams).
    const planTypeFields = {
      planType,
      seatCount: 1,
      ...(paystackAuthCode ? { paystackAuthCode } : {}),
    };

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
        paystackSubscriptionId: resolvedSubscriptionId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        ...planTypeFields,
      },
      update: {
        planName: planName,
        planPrice: String(transaction.amount / 100),
        billingCycle: planInterval,
        status: 'active',
        paystackCustomerId: transaction.customer?.customer_code || null,
        ...(resolvedSubscriptionId ? { paystackSubscriptionId: resolvedSubscriptionId } : {}),
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        ...planTypeFields,
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
          planType,
        },
      },
    });

    // Upgrade organization to enterprise if teams plan
    if (planType === 'teams') {
      await tx.organization.update({
        where: { id: organizationId },
        data: { accountType: 'enterprise' },
      });
    }

    return sub;
  });

  // Send confirmation email for teams plan
  if (planType === 'teams') {
    try {
      const customerEmail = transaction.customer?.email;
      if (customerEmail) {
        const user = await prisma.user.findUnique({
          where: { email: customerEmail },
          select: { fullName: true },
        });
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true },
        });
        await sendTeamUpgradeConfirmedEmail({
          email: customerEmail,
          userName: user?.fullName || customerEmail,
          organizationName: org?.name || 'your organization',
          planPrice: '$15/seat/month',
          nextBillingDate: periodEnd.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        });
      }
    } catch (emailErr) {
      console.error('Failed to send team upgrade confirmation email:', emailErr);
    }
  }

  return createApiResponse(
    {
      status: 'success',
      message: 'Payment verified and subscription activated',
      subscription: {
        planName: subscription.planName,
        billingCycle: subscription.billingCycle,
        currentPeriodEnd: subscription.currentPeriodEnd,
        planType: subscription.planType,
      },
    },
    'Payment successful'
  );
}
