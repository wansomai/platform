// app/api/cron/legal-digest/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import {
  generateLegalDigestFromDB,
  buildDigestFingerprint,
  getCachedDigest,
  setCachedDigest,
  DigestContent,
} from '@/services/legalDigestService';
import { sendLegalDigestEmail } from '@/lib/email-service';
import { PRACTICE_AREA_LABELS } from '@/types/associates';

export const maxDuration = 300;

// Maximum number of subscribers processed concurrently.
// Each subscriber may trigger a Gemini synthesis call; 5 parallel keeps
// Gemini rate limits comfortable while cutting wall-clock time by ~5×.
const SEND_CONCURRENCY = 5;

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production CRON_SECRET is mandatory — block all requests if not configured.
  // In development it is optional (allows local testing without setting the var).
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !cronSecret) {
    return createErrorResponse(
      new AppError('CRON_SECRET is not configured', 'AUTH_REQUIRED', 401)
    );
  }
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return createErrorResponse(
      new AppError('Unauthorized', 'AUTH_REQUIRED', 401)
    );
  }

  const now = new Date();
  const isMonday = now.getUTCDay() === 1;

  // Idempotency gate: skip subscribers already sent today.
  // If Vercel retries this cron after a partial failure, subscribers who
  // already received their digest are filtered out at the DB level.
  const todayUtcMidnight = new Date(now);
  todayUtcMidnight.setUTCHours(0, 0, 0, 0);

  const frequencyFilter = isMonday ? ['daily', 'weekly'] : ['daily'];
  const baseWhere = { isActive: true, frequency: { in: frequencyFilter } };

  // Count total eligible before the dedup filter (for reporting)
  const totalEligible = await prisma.digestSubscription.count({ where: baseWhere });

  // Fetch only subscribers not yet sent today
  const subscriptions = await prisma.digestSubscription.findMany({
    where: {
      ...baseWhere,
      OR: [
        { lastSentAt: null },
        { lastSentAt: { lt: todayUtcMidnight } },
      ],
    },
    include: {
      user: { select: { email: true, fullName: true } },
    },
  });

  const alreadySent = totalEligible - subscriptions.length;
  if (alreadySent > 0) {
    console.log(`[digest] Skipping ${alreadySent} subscriber(s) already sent today`);
  }

  if (subscriptions.length === 0) {
    return createApiResponse(
      { sent: 0, failed: 0, skipped: alreadySent, total: totalEligible },
      alreadySent > 0 ? 'All eligible subscribers already sent today' : 'No active subscriptions',
    );
  }

  // ── Cache-first digest resolver ────────────────────────────────────────────
  // Priority: persistent DigestCache (written by digest-ingest) → fresh synthesis.
  // A local Promise map deduplicates within-run: concurrent subscribers sharing
  // the same fingerprint resolve from one DB read rather than N parallel reads.
  const localCache = new Map<string, Promise<{ digest: DigestContent; source: string }>>();

  const getDigest = (sub: typeof subscriptions[0]) => {
    const topicLabels = sub.topics.map(
      (t) => PRACTICE_AREA_LABELS[t as keyof typeof PRACTICE_AREA_LABELS] || t
    );
    const fingerprint = buildDigestFingerprint(sub.frequency, sub.jurisdictions, topicLabels);

    let promise = localCache.get(fingerprint);
    if (!promise) {
      promise = (async () => {
        // 1. Try persistent DB cache (pre-computed by digest-ingest)
        const cached = await getCachedDigest(fingerprint);
        if (cached) {
          console.log(`[digest] cache hit: ${fingerprint.slice(0, 60)}`);
          return { digest: cached, source: 'cache' };
        }

        // 2. Cache miss — synthesize fresh and persist for next run
        console.log(`[digest] cache miss — synthesizing: ${fingerprint.slice(0, 60)}`);
        const result = await generateLegalDigestFromDB(
          topicLabels,
          sub.jurisdictions,
          sub.frequency as 'daily' | 'weekly',
        );
        // Fire-and-forget: don't let a cache write failure block email delivery
        setCachedDigest(fingerprint, sub.frequency, sub.jurisdictions, topicLabels, result.digest)
          .catch((err) => console.error('[digest] failed to write cache:', err.message));
        return { digest: result.digest, source: result.source };
      })();
      localCache.set(fingerprint, promise);
    }
    return promise;
  };

  let sent = 0;
  let failed = 0;

  // ── Process subscribers in parallel batches ────────────────────────────────
  for (let i = 0; i < subscriptions.length; i += SEND_CONCURRENCY) {
    const batch = subscriptions.slice(i, i + SEND_CONCURRENCY);

    const batchResults = await Promise.allSettled(
      batch.map(async (sub) => {
        const { digest, source } = await getDigest(sub);
        console.log(`[digest] ${sub.user.email}: source=${source}`);

        const result = await sendLegalDigestEmail({
          email: sub.user.email,
          fullName: sub.user.fullName || 'there',
          digest,
          frequency: sub.frequency,
        });

        if (result.success) {
          await prisma.$transaction([
            prisma.digestHistory.create({
              data: {
                subscriptionId: sub.id,
                subject: `Briefly by Wansom ${sub.frequency === 'daily' ? 'Daily' : 'Weekly'} Digest: ${digest.headline}`,
                contentSummary: digest.summary,
                sourceCount: digest.sources.length,
              },
            }),
            prisma.digestSubscription.update({
              where: { id: sub.id },
              data: { lastSentAt: now },
            }),
          ]);
          return 'sent';
        } else {
          console.error(`Failed to send digest to ${sub.user.email}:`, result.error);
          return 'failed';
        }
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value === 'sent') {
        sent++;
      } else {
        if (result.status === 'rejected') {
          console.error('Error processing digest for a subscription:', result.reason);
        }
        failed++;
      }
    }
  }

  return createApiResponse(
    { sent, failed, skipped: alreadySent, total: totalEligible },
    `Digest run complete: ${sent} sent, ${failed} failed, ${alreadySent} already sent today`,
  );
}
