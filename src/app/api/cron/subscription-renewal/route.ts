// src/app/api/cron/subscription-renewal/route.ts
//
// Runs daily. Handles three lifecycle events for direct-payment subscriptions
// (those charged by currency/amount rather than a Paystack plan code):
//
//  Phase 1 — Charge subscriptions due for renewal
//  Phase 2 — Retry failed charges (attempt 2 at day +3, attempt 3 at day +7)
//  Phase 3 — Downgrade accounts after exhausted retries or manual cancellation grace period
//
// Retry schedule (confirmed):
//   Day 0  : first charge attempt (period expired)
//   Day +3 : retry 2
//   Day +7 : retry 3 — if this fails, downgrade immediately
//
// Grace period (confirmed):
//   non_renewing (user-cancelled): downgrade 7 days after currentPeriodEnd
//   attention (failed payment): same 7-day window (days +3 and +7 retries happen within it)

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';

export const maxDuration = 120;

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// Charge a stored authorization code and return the Paystack response data.
async function chargeAuthorization(params: {
  authCode: string;
  email: string;
  amount: number;
  currency: string;
  reference: string;
  subscriptionId: string;
  organizationId: string;
  attempt: number;
}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/charge_authorization`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authorization_code: params.authCode,
      email: params.email,
      amount: params.amount,
      currency: params.currency,
      reference: params.reference,
      metadata: {
        subscriptionId: params.subscriptionId,
        organizationId: params.organizationId,
        renewalSource: 'subscription-renewal-cron',
        attempt: params.attempt,
      },
    }),
  });
  return res.json();
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && !cronSecret) {
    return createErrorResponse(new AppError('CRON_SECRET is not configured', 'AUTH_REQUIRED', 401));
  }
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return createErrorResponse(new AppError('Unauthorized', 'AUTH_REQUIRED', 401));
  }

  if (!PAYSTACK_SECRET_KEY) {
    return createErrorResponse(new AppError('Payment service not configured', 'PAYMENT_NOT_CONFIGURED', 500));
  }

  const now = new Date();
  const results = { renewed: 0, retried: 0, downgraded: 0, errors: 0 };

  // ── Phase 1: Charge subscriptions due for renewal ─────────────────────────
  // active + period expired + has a stored auth code (direct-payment subscriptions)
  const dueForRenewal = await prisma.subscription.findMany({
    where: {
      status: 'active',
      planName: { not: 'explorer' },
      paystackAuthCode: { not: null },
      currentPeriodEnd: { lte: now },
    },
    include: {
      organization: {
        include: { owner: { select: { id: true, email: true, fullName: true } } },
      },
    },
  });

  for (const sub of dueForRenewal) {
    const owner = sub.organization.owner;
    if (!owner?.email || !sub.paystackAuthCode) continue;

    // Get currency from the last successful payment
    const lastPayment = await prisma.payment.findFirst({
      where: { subscriptionId: sub.id, status: 'success' },
      orderBy: { createdAt: 'desc' },
    });
    const currency = lastPayment?.currency || 'USD';
    const seatMultiplier = sub.planType === 'teams' ? Math.max(1, sub.seatCount ?? 1) : 1;
    const amount = Math.round(parseFloat(sub.planPrice || '0') * 100) * seatMultiplier;
    if (amount <= 0) continue;

    const reference = `RENEW-${sub.id.slice(0, 8)}-${Date.now()}`;

    try {
      const chargeData = await chargeAuthorization({
        authCode: sub.paystackAuthCode,
        email: owner.email,
        amount,
        currency,
        reference,
        subscriptionId: sub.id,
        organizationId: sub.organizationId,
        attempt: 1,
      });

      if (chargeData.data?.status === 'success') {
        // Extend subscription period anchored to the original billing date
        const newPeriodStart = now;
        const newPeriodEnd = addMonths(sub.currentPeriodEnd ?? now, 1);

        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: sub.id },
            data: { status: 'active', currentPeriodStart: newPeriodStart, currentPeriodEnd: newPeriodEnd },
          });
          await tx.payment.create({
            data: {
              subscriptionId: sub.id,
              paystackReference: reference,
              amount,
              currency,
              status: 'success',
              paymentMethod: chargeData.data.channel || 'card',
              paidAt: new Date(),
              metadata: { source: 'renewal-cron', attempt: 1 },
            },
          });
          await tx.notification.create({
            data: {
              userId: owner.id,
              title: 'Subscription renewed',
              message: `Your ${sub.planName} plan has been renewed. Next billing date: ${newPeriodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
              type: 'success',
            },
          });
        });

        results.renewed++;
        console.log(`[subscription-renewal] Renewed sub ${sub.id} for org ${sub.organizationId}`);
      } else {
        // Charge failed — mark attention, record failure, start grace period
        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: sub.id },
            data: { status: 'attention' },
          });
          await tx.payment.create({
            data: {
              subscriptionId: sub.id,
              paystackReference: reference,
              amount,
              currency,
              status: 'failed',
              metadata: { source: 'renewal-cron', attempt: 1, reason: chargeData.data?.gateway_response },
            },
          });
          await tx.notification.create({
            data: {
              userId: owner.id,
              title: 'Payment failed — retry in 3 days',
              message: `We could not renew your ${sub.planName} plan. We will retry in 3 days. Please ensure your payment method is valid.`,
              type: 'error',
            },
          });
        });

        console.log(`[subscription-renewal] Initial charge failed for sub ${sub.id}`);
      }
    } catch (err) {
      results.errors++;
      console.error(`[subscription-renewal] Error charging sub ${sub.id}:`, err);
    }
  }

  // ── Phase 2 & 3: Retry failed charges ────────────────────────────────────
  // attention + period expired + has auth code
  const attentionSubs = await prisma.subscription.findMany({
    where: {
      status: 'attention',
      planName: { not: 'explorer' },
      paystackAuthCode: { not: null },
      currentPeriodEnd: { not: null },
    },
    include: {
      organization: {
        include: { owner: { select: { id: true, email: true, fullName: true } } },
      },
    },
  });

  for (const sub of attentionSubs) {
    const owner = sub.organization.owner;
    if (!owner?.email || !sub.paystackAuthCode || !sub.currentPeriodEnd) continue;

    // Count failed payment attempts since the period ended
    const failedAttempts = await prisma.payment.count({
      where: {
        subscriptionId: sub.id,
        status: 'failed',
        createdAt: { gte: sub.currentPeriodEnd },
      },
    });

    // Find the most recent failed attempt to check timing
    const lastFailed = await prisma.payment.findFirst({
      where: { subscriptionId: sub.id, status: 'failed', createdAt: { gte: sub.currentPeriodEnd } },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastFailed) continue;

    const daysSinceLastFail = daysSince(lastFailed.createdAt);
    const daysSincePeriodEnd = daysSince(sub.currentPeriodEnd);

    // Downgrade if past 7-day grace window with no resolution
    if (daysSincePeriodEnd > 7) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: sub.id },
            data: { status: 'cancelled' },
          });
          await tx.organization.update({
            where: { id: sub.organizationId },
            data: { accountType: 'personal' },
          });
          await tx.notification.create({
            data: {
              userId: owner.id,
              title: 'Subscription cancelled — account downgraded',
              message: `Your ${sub.planName} subscription has been cancelled after failed payment attempts. You have been moved to the free plan. All your data is safe.`,
              type: 'warning',
            },
          });
          await tx.adminLog.create({
            data: {
              organizationId: sub.organizationId,
              event: 'subscription_downgraded_nonpayment',
              details: { subscriptionId: sub.id, failedAttempts, downgradedAt: now.toISOString() },
            },
          });
        });

        results.downgraded++;
        console.log(`[subscription-renewal] Downgraded org ${sub.organizationId} — grace period exceeded`);
      } catch (err) {
        results.errors++;
        console.error(`[subscription-renewal] Error downgrading sub ${sub.id}:`, err);
      }
      continue;
    }

    // Retry attempt 2: 3+ days after first failure, only 1 attempt so far
    // Retry attempt 3: 4+ days after attempt 2 (= ~7 days total), only 2 attempts so far
    const shouldRetry =
      (failedAttempts === 1 && daysSinceLastFail >= 3) ||
      (failedAttempts === 2 && daysSinceLastFail >= 4);

    if (!shouldRetry) continue;

    const attempt = failedAttempts + 1;
    const lastPayment = await prisma.payment.findFirst({
      where: { subscriptionId: sub.id, status: 'success' },
      orderBy: { createdAt: 'desc' },
    });
    const currency = lastPayment?.currency || 'USD';
    const seatMultiplier = sub.planType === 'teams' ? Math.max(1, sub.seatCount ?? 1) : 1;
    const amount = Math.round(parseFloat(sub.planPrice || '0') * 100) * seatMultiplier;
    if (amount <= 0) continue;

    const reference = `RETRY${attempt}-${sub.id.slice(0, 8)}-${Date.now()}`;

    try {
      const chargeData = await chargeAuthorization({
        authCode: sub.paystackAuthCode,
        email: owner.email,
        amount,
        currency,
        reference,
        subscriptionId: sub.id,
        organizationId: sub.organizationId,
        attempt,
      });

      if (chargeData.data?.status === 'success') {
        const newPeriodStart = now;
        const newPeriodEnd = addMonths(sub.currentPeriodEnd ?? now, 1);

        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: sub.id },
            data: { status: 'active', currentPeriodStart: newPeriodStart, currentPeriodEnd: newPeriodEnd },
          });
          await tx.payment.create({
            data: {
              subscriptionId: sub.id,
              paystackReference: reference,
              amount,
              currency,
              status: 'success',
              paymentMethod: chargeData.data.channel || 'card',
              paidAt: new Date(),
              metadata: { source: 'renewal-cron', attempt },
            },
          });
          await tx.notification.create({
            data: {
              userId: owner.id,
              title: 'Payment successful — subscription renewed',
              message: `Your ${sub.planName} plan has been renewed. Next billing date: ${newPeriodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
              type: 'success',
            },
          });
        });

        results.retried++;
        console.log(`[subscription-renewal] Retry ${attempt} succeeded for sub ${sub.id}`);
      } else {
        // Record the failed retry
        await prisma.$transaction(async (tx) => {
          await tx.payment.create({
            data: {
              subscriptionId: sub.id,
              paystackReference: reference,
              amount,
              currency,
              status: 'failed',
              metadata: { source: 'renewal-cron', attempt, reason: chargeData.data?.gateway_response },
            },
          });

          const isLastAttempt = attempt >= 3;
          await tx.notification.create({
            data: {
              userId: owner.id,
              title: isLastAttempt ? 'Final payment attempt failed' : `Payment retry failed — one more attempt`,
              message: isLastAttempt
                ? `All payment attempts for your ${sub.planName} plan have failed. Your account will be downgraded to the free plan shortly.`
                : `Payment retry for your ${sub.planName} plan failed. We will make one final attempt in ${attempt === 2 ? '4' : '3'} days.`,
              type: 'error',
            },
          });
        });

        console.log(`[subscription-renewal] Retry ${attempt} failed for sub ${sub.id}`);
      }
    } catch (err) {
      results.errors++;
      console.error(`[subscription-renewal] Error retrying sub ${sub.id}:`, err);
    }
  }

  // ── Phase 4: Downgrade non_renewing subscriptions past grace period ────────
  // User cancelled → keep active for 7 days → downgrade
  const gracePeriodDays = 7;
  const graceCutoff = new Date(now.getTime() - gracePeriodDays * 24 * 60 * 60 * 1000);

  const expiredCancellations = await prisma.subscription.findMany({
    where: {
      status: 'non_renewing',
      currentPeriodEnd: { lte: graceCutoff },
    },
    include: {
      organization: {
        include: { owner: { select: { id: true, email: true, fullName: true } } },
      },
    },
  });

  for (const sub of expiredCancellations) {
    const owner = sub.organization.owner;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: 'cancelled' },
        });
        await tx.organization.update({
          where: { id: sub.organizationId },
          data: { accountType: 'personal' },
        });
        if (owner) {
          await tx.notification.create({
            data: {
              userId: owner.id,
              title: 'Plan access ended',
              message: `Your ${sub.planName} plan access has ended. You have been moved to the free plan. All your data is safe. You can resubscribe anytime.`,
              type: 'info',
            },
          });
        }
        await tx.adminLog.create({
          data: {
            organizationId: sub.organizationId,
            event: 'subscription_grace_period_expired',
            details: { subscriptionId: sub.id, downgradedAt: now.toISOString() },
          },
        });
      });

      results.downgraded++;
      console.log(`[subscription-renewal] Downgraded org ${sub.organizationId} — cancellation grace period ended`);
    } catch (err) {
      results.errors++;
      console.error(`[subscription-renewal] Error downgrading cancelled sub ${sub.id}:`, err);
    }
  }

  console.log('[subscription-renewal] Run complete:', results);

  return createApiResponse(
    { ...results, ranAt: now.toISOString() },
    `Renewal cron complete. Renewed: ${results.renewed}, Retried: ${results.retried}, Downgraded: ${results.downgraded}, Errors: ${results.errors}`
  );
}
