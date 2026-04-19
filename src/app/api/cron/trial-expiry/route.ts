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
            message: `Your Pro trial for ${org.name} ends on ${expiryDateStr}. Upgrade to Pro for full monthly access, or pick up the Explorer plan ($5 · 2 weeks) to keep going.`,
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
                'Your 15-day Pro trial has expired. All your data is safe. Try the Explorer plan ($5 · 2 weeks) to keep exploring, or subscribe to Pro for full monthly access.',
              type: 'warning',
            },
          });
        }
      });

      results.expired++;
      console.log(`[trial-expiry] Expired trial for org ${org.id} (${org.name})`);

      // Email outside transaction — a send failure must not affect the expired count
      if (org.owner) {
        try {
          await sendTrialExpiryEmail(org.owner, org.name);
        } catch (emailErr) {
          console.error(`[trial-expiry] Failed to send expiry email for org ${org.id}:`, emailErr);
        }
      };
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

  // ── Phase 5: Remind Explorer users expiring within 3 days ────────────────
  const threeDaysFromNowExplorer = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const soonExpiringExplorer = await prisma.subscription.findMany({
    where: {
      planName: 'explorer',
      status: 'active',
      currentPeriodEnd: { gt: now, lte: threeDaysFromNowExplorer },
    },
    include: {
      organization: {
        include: {
          adminLogs: {
            where: {
              event: 'explorer_expiry_reminder',
              createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
            },
            take: 1,
          },
        },
      },
    },
  });

  for (const sub of soonExpiringExplorer) {
    if (sub.organization.adminLogs.length > 0) continue; // already reminded today

    const daysLeft = Math.ceil(
      (sub.currentPeriodEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const expiryDateStr = sub.currentPeriodEnd!.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

    try {
      await prisma.$transaction(async (tx) => {
        if (sub.organization.ownerId) {
          await tx.notification.create({
            data: {
              userId: sub.organization.ownerId,
              title: `Your Explorer access expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
              message: `Your 14-day Explorer access for ${sub.organization.name} ends on ${expiryDateStr}. Subscribe to Pro for full monthly access, or pick up another Explorer pass ($5 · 2 weeks) to keep going.`,
              type: 'warning',
            },
          });
        }

        await tx.adminLog.create({
          data: {
            organizationId: sub.organizationId,
            event: 'explorer_expiry_reminder',
            details: { daysLeft, expiryDateStr, sentAt: now.toISOString() },
          },
        });
      });

      results.notified++;
      console.log(`[trial-expiry] Explorer reminder sent for sub ${sub.id} (${daysLeft} days left)`);
    } catch (err) {
      results.errors++;
      console.error(`[trial-expiry] Error sending Explorer reminder for sub ${sub.id}:`, err);
    }
  }

  // ── Phase 6: Expire ended Explorer subscriptions ─────────────────────────
  // Explorer is a one-time 14-day charge. No renewal cron handles it, so we
  // mark the subscription 'cancelled' and notify the owner once the window closes.
  const expiredExplorerSubs = await prisma.subscription.findMany({
    where: {
      planName: 'explorer',
      status: 'active',
      currentPeriodEnd: { lte: now },
    },
    include: {
      organization: {
        select: { id: true, name: true, ownerId: true },
      },
    },
  });

  let explorerExpired = 0;
  for (const sub of expiredExplorerSubs) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: 'cancelled' },
        });

        if (sub.organization.ownerId) {
          await tx.notification.create({
            data: {
              userId: sub.organization.ownerId,
              title: 'Your Explorer access has ended',
              message:
                'Your 14-day Explorer access has expired. All your work is safe. ' +
                'Pick up another Explorer pass ($5 · 2 weeks) or subscribe to Pro for full monthly access.',
              type: 'warning',
            },
          });
        }
      });

      explorerExpired++;
      console.log(`[trial-expiry] Explorer expired for sub ${sub.id} (org ${sub.organizationId})`);
;
    } catch (err) {
      results.errors++;
      console.error(`[trial-expiry] Error expiring explorer sub ${sub.id}:`, err);
    }
  }

  console.log('[trial-expiry] Run complete:', { ...results, explorerExpired });

  return createApiResponse(
    { ...results, explorerExpired, ranAt: now.toISOString() },
    `Trial expiry cron complete. Backfilled: ${results.backfilled}, Notified: ${results.notified}, Expired: ${results.expired}, Explorer expired: ${explorerExpired}, Errors: ${results.errors}`
  );
}
