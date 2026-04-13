// src/app/api/cron/trial-expiry/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import { sendTrialExpiryEmail } from '@/lib/email-service';

export const maxDuration = 120;

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

  const now = new Date();
  const TRIAL_DAYS = 15;
  const results = { backfilled: 0, notified: 0, expired: 0, errors: 0 };

  // ── Phase 1: Backfill existing manually-upgraded accounts ──────────────────
  // Orgs that are enterprise, have no Paystack subscription, and have no
  // trialUpgradedAt yet — upgraded before this feature existed.
  // Start their 15-day window from today and immediately notify the owner.
  const needsBackfill = await prisma.organization.findMany({
    where: {
      accountType: 'enterprise',
      trialUpgradedAt: null,
      subscription: null,
    },
    include: {
      owner: {
        select: { id: true, email: true, fullName: true },
      },
    },
  });

  if (needsBackfill.length > 0) {
    const trialExpiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const expiryDateStr = trialExpiresAt.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

    for (const org of needsBackfill) {
      try {
        await prisma.$transaction(async (tx) => {
          // Stamp the trial window
          await tx.organization.update({
            where: { id: org.id },
            data: {
              trialUpgradedAt: now,
              trialExpiresAt,
              trialExpired: false,
            },
          });

          // Admin log
          await tx.adminLog.create({
            data: {
              organizationId: org.id,
              event: 'manual_trial_backfill',
              details: {
                trialUpgradedAt: now.toISOString(),
                trialExpiresAt: trialExpiresAt.toISOString(),
                reason: 'Backfilled on feature implementation',
              },
            },
          });

          // In-app notification for the owner
          if (org.owner) {
            await tx.notification.create({
              data: {
                userId: org.owner.id,
                title: 'Your Pro trial is active',
                message: `You have been granted 15-day Pro access for ${org.name}. Your trial expires on ${expiryDateStr}. Upgrade to a paid plan before then to keep full access.`,
                type: 'info',
              },
            });
          }
        });

        results.backfilled++;
        results.notified++;
        console.log(`[trial-expiry] Backfilled org ${org.id} (${org.name}), expires ${expiryDateStr}`);
      } catch (err) {
        results.errors++;
        console.error(`[trial-expiry] Error backfilling org ${org.id}:`, err);
      }
    }
  }

  // ── Phase 2: Notify accounts expiring within 3 days (reminder) ────────────
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const soonExpiring = await prisma.organization.findMany({
    where: {
      trialExpired: false,
      trialExpiresAt: { gt: now, lte: threeDaysFromNow },
      trialUpgradedAt: { not: null },
      // Only notify once — check no 'trial_expiry_reminder' log exists today
    },
    include: {
      owner: { select: { id: true, email: true, fullName: true } },
      adminLogs: {
        where: {
          event: 'trial_expiry_reminder',
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
        take: 1,
      },
    },
  });

  for (const org of soonExpiring) {
    if (org.adminLogs.length > 0) continue; // already reminded today

    if (!org.owner) continue;

    const daysLeft = Math.ceil(
      (org.trialExpiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const expiryDateStr = org.trialExpiresAt!.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

    try {
      await prisma.$transaction(async (tx) => {
        await tx.notification.create({
          data: {
            userId: org.owner!.id,
            title: `Your Pro trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
            message: `Your Pro trial for ${org.name} ends on ${expiryDateStr}. Upgrade now to avoid losing access.`,
            type: 'warning',
          },
        });

        await tx.adminLog.create({
          data: {
            organizationId: org.id,
            event: 'trial_expiry_reminder',
            details: { daysLeft, expiryDateStr, sentAt: now.toISOString() },
          },
        });
      });

      results.notified++;
      console.log(`[trial-expiry] Reminder sent for org ${org.id} (${daysLeft} days left)`);
    } catch (err) {
      results.errors++;
      console.error(`[trial-expiry] Error sending reminder for org ${org.id}:`, err);
    }
  }

  // ── Phase 3: Expire trials that have passed their deadline ────────────────
  const expiredOrgs = await prisma.organization.findMany({
    where: {
      trialExpired: false,
      trialExpiresAt: { lte: now },
      trialUpgradedAt: { not: null },
      // Skip orgs that converted to a paid subscription during the trial
      NOT: { subscription: { is: { status: { in: ['active', 'non_renewing'] } } } },
    },
    include: {
      owner: { select: { id: true, email: true, fullName: true } },
    },
  });

  for (const org of expiredOrgs) {
    try {
      await prisma.$transaction(async (tx) => {
        // Downgrade back to personal
        await tx.organization.update({
          where: { id: org.id },
          data: { accountType: 'personal', trialExpired: true },
        });

        // Admin log
        await tx.adminLog.create({
          data: {
            organizationId: org.id,
            event: 'manual_trial_expired',
            details: {
              expiredAt: now.toISOString(),
              trialUpgradedAt: org.trialUpgradedAt?.toISOString(),
              trialExpiresAt: org.trialExpiresAt?.toISOString(),
              downgradedTo: 'personal',
            },
          },
        });

        // In-app notification
        if (org.owner) {
          await tx.notification.create({
            data: {
              userId: org.owner.id,
              title: 'Your Pro trial has ended',
              message:
                'Your 15-day Pro trial has expired. All your data is safe. Upgrade to a paid plan to restore full Pro access.',
              type: 'warning',
            },
          });
        }
      });

      // Expiry email — outside transaction so a send failure doesn't rollback the downgrade
      if (org.owner) {
        await sendTrialExpiryEmail(org.owner, org.name);
      }

      results.expired++;
      console.log(`[trial-expiry] Expired trial for org ${org.id} (${org.name})`);
    } catch (err) {
      results.errors++;
      console.error(`[trial-expiry] Error expiring org ${org.id}:`, err);
    }
  }

  // ── Phase 4: Stamp trialExpired on paying subscribers whose trial date passed ─
  // These orgs were excluded from Phase 3 (active subscription), but trialExpired
  // is still false — mark it silently so they don't appear in Phase 3 every day.
  await prisma.organization.updateMany({
    where: {
      trialExpired: false,
      trialExpiresAt: { lte: now },
      trialUpgradedAt: { not: null },
      subscription: { is: { status: { in: ['active', 'non_renewing'] } } },
    },
    data: { trialExpired: true },
  });

  console.log('[trial-expiry] Run complete:', results);

  return createApiResponse(
    { ...results, ranAt: now.toISOString() },
    `Trial expiry cron complete. Backfilled: ${results.backfilled}, Notified: ${results.notified}, Expired: ${results.expired}, Errors: ${results.errors}`
  );
}
