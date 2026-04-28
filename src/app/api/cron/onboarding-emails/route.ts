// src/app/api/cron/onboarding-emails/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import {
  sendOnboarding1hEmail,
  sendOnboarding10hEmail,
  sendOnboarding24hEmail,
  sendOnboarding3dEmail,
} from '@/lib/email-service';

export const maxDuration = 60;

// Returns true if the user's org already has active paid access (subscription, trial, or grant).
// We skip the onboarding sequence for these users — they've already converted.
function hasActivePaidAccess(
  org: {
    accountType: string;
    trialExpired: boolean;
    trialExpiresAt: Date | null;
    grantedExpired: boolean;
    grantedExpiresAt: Date | null;
    subscription: { status: string } | null;
  },
  now: Date
): boolean {
  if (org.accountType === 'enterprise') return true;
  if (org.subscription && ['active', 'non_renewing'].includes(org.subscription.status)) return true;
  if (!org.trialExpired && org.trialExpiresAt && org.trialExpiresAt > now) return true;
  if (!org.grantedExpired && org.grantedExpiresAt && org.grantedExpiresAt > now) return true;
  return false;
}

export async function GET(req: NextRequest) {
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
  const results = { sent1h: 0, sent10h: 0, sent24h: 0, sent3d: 0, skipped: 0, errors: 0 };

  const orgSelect = {
    accountType: true,
    trialExpired: true,
    trialExpiresAt: true,
    grantedExpired: true,
    grantedExpiresAt: true,
    subscription: { select: { status: true } },
  } as const;

  // ── Phase 1: 1-hour email ─────────────────────────────────────────────────
  const oneHourCutoff = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const candidates1h = await prisma.user.findMany({
    where: { createdAt: { lte: oneHourCutoff }, onboardingEmail1hSentAt: null },
    select: { id: true, email: true, fullName: true, organization: { select: orgSelect } },
    take: 100,
  });

  for (const user of candidates1h) {
    if (hasActivePaidAccess(user.organization, now)) {
      // Mark all emails as skipped so they're never retried
      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingEmail1hSentAt: now,
          onboardingEmail10hSentAt: now,
          onboardingEmail24hSentAt: now,
          onboardingEmail3dSentAt: now,
        },
      });
      results.skipped++;
      continue;
    }
    try {
      await sendOnboarding1hEmail(user);
      await prisma.user.update({ where: { id: user.id }, data: { onboardingEmail1hSentAt: now } });
      results.sent1h++;
      console.log(`[onboarding-emails] 1h email sent to ${user.email}`);
    } catch (err) {
      results.errors++;
      console.error(`[onboarding-emails] Failed 1h email for ${user.email}:`, err);
    }
  }

  // ── Phase 2: 10-hour email ────────────────────────────────────────────────
  const tenHourCutoff = new Date(now.getTime() - 10 * 60 * 60 * 1000);
  const candidates10h = await prisma.user.findMany({
    where: {
      createdAt: { lte: tenHourCutoff },
      onboardingEmail1hSentAt: { not: null },
      onboardingEmail10hSentAt: null,
    },
    select: { id: true, email: true, fullName: true, organization: { select: orgSelect } },
    take: 100,
  });

  for (const user of candidates10h) {
    if (hasActivePaidAccess(user.organization, now)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingEmail10hSentAt: now,
          onboardingEmail24hSentAt: now,
          onboardingEmail3dSentAt: now,
        },
      });
      results.skipped++;
      continue;
    }
    try {
      await sendOnboarding10hEmail(user);
      await prisma.user.update({ where: { id: user.id }, data: { onboardingEmail10hSentAt: now } });
      results.sent10h++;
      console.log(`[onboarding-emails] 10h email sent to ${user.email}`);
    } catch (err) {
      results.errors++;
      console.error(`[onboarding-emails] Failed 10h email for ${user.email}:`, err);
    }
  }

  // ── Phase 3: 24-hour email ────────────────────────────────────────────────
  const twentyFourHourCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const candidates24h = await prisma.user.findMany({
    where: {
      createdAt: { lte: twentyFourHourCutoff },
      onboardingEmail10hSentAt: { not: null },
      onboardingEmail24hSentAt: null,
    },
    select: { id: true, email: true, fullName: true, organization: { select: orgSelect } },
    take: 100,
  });

  for (const user of candidates24h) {
    if (hasActivePaidAccess(user.organization, now)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingEmail24hSentAt: now, onboardingEmail3dSentAt: now },
      });
      results.skipped++;
      continue;
    }
    try {
      await sendOnboarding24hEmail(user);
      await prisma.user.update({ where: { id: user.id }, data: { onboardingEmail24hSentAt: now } });
      results.sent24h++;
      console.log(`[onboarding-emails] 24h email sent to ${user.email}`);
    } catch (err) {
      results.errors++;
      console.error(`[onboarding-emails] Failed 24h email for ${user.email}:`, err);
    }
  }

  // ── Phase 4: 3-day email (Briefly) ───────────────────────────────────────
  const threeDayCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const candidates3d = await prisma.user.findMany({
    where: {
      createdAt: { lte: threeDayCutoff },
      onboardingEmail24hSentAt: { not: null },
      onboardingEmail3dSentAt: null,
    },
    select: { id: true, email: true, fullName: true, organization: { select: orgSelect } },
    take: 100,
  });

  for (const user of candidates3d) {
    if (hasActivePaidAccess(user.organization, now)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingEmail3dSentAt: now },
      });
      results.skipped++;
      continue;
    }
    try {
      await sendOnboarding3dEmail(user);
      await prisma.user.update({ where: { id: user.id }, data: { onboardingEmail3dSentAt: now } });
      results.sent3d++;
      console.log(`[onboarding-emails] 3d email sent to ${user.email}`);
    } catch (err) {
      results.errors++;
      console.error(`[onboarding-emails] Failed 3d email for ${user.email}:`, err);
    }
  }

  console.log('[onboarding-emails] Run complete:', results);

  return createApiResponse(
    { ...results, ranAt: now.toISOString() },
    `Onboarding emails complete. 1h: ${results.sent1h}, 10h: ${results.sent10h}, 24h: ${results.sent24h}, 3d: ${results.sent3d}, skipped: ${results.skipped}, errors: ${results.errors}`
  );
}
