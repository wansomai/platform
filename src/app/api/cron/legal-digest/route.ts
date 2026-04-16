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

type DigestLogStage =
  | 'run_start'
  | 'auth_ok'
  | 'auth_fail'
  | 'subs_loaded'
  | 'phase1_start'
  | 'phase1_complete'
  | 'phase2_start'
  | 'phase2_complete'
  | 'run_complete';

function logDigest(runId: string, stage: DigestLogStage, details: Record<string, unknown>) {
  console.log(`[digest][${runId}][${stage}] ${JSON.stringify(details)}`);
}

// Phase 1: resolve unique fingerprints (cache read + instant aiSummary build — no Gemini).
const FINGERPRINT_CONCURRENCY = 15;
// Phase 2: send emails.
const EMAIL_CONCURRENCY = 15;

export async function GET(req: NextRequest) {
  const runId = `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = Date.now();

  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production CRON_SECRET is mandatory — block all requests if not configured.
  // In development it is optional (allows local testing without setting the var).
  const isProduction = process.env.NODE_ENV === 'production';
  const { searchParams } = new URL(req.url);
  const testEmails = searchParams.get('email')
    ? searchParams.get('email')!.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : null;
  const noCache = searchParams.get('nocache') === '1';

  logDigest(runId, 'run_start', {
    isProduction,
    hasCronSecret: Boolean(cronSecret),
    hasAuthHeader: Boolean(authHeader),
    testMode: Boolean(testEmails),
    noCache,
    path: req.nextUrl.pathname,
    query: req.nextUrl.search,
  });

  if (isProduction && !cronSecret) {
    logDigest(runId, 'auth_fail', { reason: 'missing_cron_secret_in_production' });
    return createErrorResponse(
      new AppError('CRON_SECRET is not configured', 'AUTH_REQUIRED', 401)
    );
  }
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logDigest(runId, 'auth_fail', { reason: 'authorization_header_mismatch' });
    return createErrorResponse(
      new AppError('Unauthorized', 'AUTH_REQUIRED', 401)
    );
  }
  logDigest(runId, 'auth_ok', { mode: cronSecret ? 'secured' : 'dev_unsecured' });

  const now = new Date();
  const isMonday = now.getUTCDay() === 1;

  // ?email=a@b.com,c@d.com  — restrict run to specific addresses (dev/testing only).
  // The idempotency gate is bypassed for these addresses so you can re-test freely.
  // ?nocache=1 — skip the digest cache and force a fresh build (dev/testing only).
  if (testEmails) {
    console.log(`[digest] TEST MODE — limiting run to: ${testEmails.join(', ')}`);
  }
  if (noCache) {
    console.log('[digest] nocache=1 — bypassing digest cache, forcing fresh synthesis');
  }

  // Idempotency gate: skip subscribers already sent today.
  // If Vercel retries this cron after a partial failure, subscribers who
  // already received their digest are filtered out at the DB level.
  const todayUtcMidnight = new Date(now);
  todayUtcMidnight.setUTCHours(0, 0, 0, 0);

  const frequencyFilter = isMonday ? ['daily', 'weekly'] : ['daily'];
  const baseWhere = {
    isActive: true,
    frequency: { in: frequencyFilter },
  };

  // Count total eligible before the dedup filter (for reporting)
  const totalEligible = await prisma.digestSubscription.count({ where: baseWhere });

  // Fetch subscribers — in test mode, match by email and skip the idempotency gate.
  const subscriptions = await prisma.digestSubscription.findMany({
    where: testEmails
      ? { ...baseWhere, user: { email: { in: testEmails } } }
      : {
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

  const alreadySent = testEmails ? 0 : totalEligible - subscriptions.length;
  if (alreadySent > 0) {
    console.log(`[digest] Skipping ${alreadySent} subscriber(s) already sent today`);
  }
  logDigest(runId, 'subs_loaded', {
    weekdayUtc: now.getUTCDay(),
    isMonday,
    frequencyFilter,
    totalEligible,
    fetchedSubscriptions: subscriptions.length,
    alreadySent,
    testMode: Boolean(testEmails),
  });

  // Deduplicate by email — keep the most recently updated subscription per address.
  // A user in multiple organizations can have one DigestSubscription per org; we
  // must only send one email per address or they receive duplicate digests.
  const emailMap = new Map<string, typeof subscriptions[0]>();
  for (const sub of subscriptions) {
    const existing = emailMap.get(sub.user.email);
    if (!existing || sub.updatedAt > existing.updatedAt) {
      emailMap.set(sub.user.email, sub);
    }
  }
  const dedupedSubscriptions = Array.from(emailMap.values());
  const dedupedCount = subscriptions.length - dedupedSubscriptions.length;
  if (dedupedCount > 0) {
    console.log(`[digest] Deduplicated ${dedupedCount} subscription(s) — same email, multiple orgs`);
  }

  if (dedupedSubscriptions.length === 0) {
    logDigest(runId, 'run_complete', {
      outcome: alreadySent > 0 ? 'all_skipped_already_sent' : 'no_active_subscriptions',
      sent: 0,
      failed: 0,
      skipped: alreadySent,
      totalEligible,
      elapsedMs: Date.now() - startedAt,
    });
    return createApiResponse(
      { sent: 0, failed: 0, skipped: alreadySent, total: totalEligible },
      alreadySent > 0 ? 'All eligible subscribers already sent today' : 'No active subscriptions',
    );
  }

  // ── Phase 1: Resolve all unique fingerprints ──────────────────────────────
  // Build a map of fingerprint → DigestContent for every unique combination of
  // frequency + jurisdictions + topics across all pending subscribers.
  // Cache hits return the stored digest instantly. Misses call generateLegalDigestFromDB
  // which builds directly from aiSummary fields — no Gemini call, completes in milliseconds.

  // Map each subscriber to its fingerprint up front
  type SubWithMeta = typeof dedupedSubscriptions[0] & {
    fingerprint: string;
    topicLabels: string[];
  };
  const subsWithMeta: SubWithMeta[] = dedupedSubscriptions.map((sub) => {
    const topicLabels = sub.topics.map(
      (t) => PRACTICE_AREA_LABELS[t as keyof typeof PRACTICE_AREA_LABELS] || t
    );
    return { ...sub, fingerprint: buildDigestFingerprint(sub.frequency, sub.jurisdictions, topicLabels), topicLabels };
  });

  // Collect unique fingerprints
  const uniqueFingerprints = [
    ...new Map(subsWithMeta.map((s) => [s.fingerprint, s])).values(),
  ];

  console.log(`[digest] Phase 1: resolving ${uniqueFingerprints.length} unique fingerprint(s) for ${subsWithMeta.length} subscriber(s)`);
  logDigest(runId, 'phase1_start', {
    subscriberCount: subsWithMeta.length,
    uniqueFingerprints: uniqueFingerprints.length,
  });

  const digestMap = new Map<string, DigestContent>();

  // Resolve fingerprints in batches of FINGERPRINT_CONCURRENCY
  for (let i = 0; i < uniqueFingerprints.length; i += FINGERPRINT_CONCURRENCY) {
    const batch = uniqueFingerprints.slice(i, i + FINGERPRINT_CONCURRENCY);
    await Promise.all(
      batch.map(async (sub) => {
        // 1. Try persistent DB cache (pre-computed by digest-ingest), unless bypassed
        if (!noCache) {
          const cached = await getCachedDigest(sub.fingerprint);
          if (cached) {
            console.log(`[digest] cache hit: ${sub.fingerprint.slice(0, 60)}`);
            digestMap.set(sub.fingerprint, cached);
            return;
          }
        }

        // 2. Cache miss — build fresh from aiSummary fields and persist for next run
        console.log(`[digest] cache miss — building: ${sub.fingerprint.slice(0, 60)}`);
        const result = await generateLegalDigestFromDB(
          sub.topicLabels,
          sub.jurisdictions,
          sub.frequency as 'daily' | 'weekly',
        );
        try {
          await setCachedDigest(sub.fingerprint, sub.frequency, sub.jurisdictions, sub.topicLabels, result.digest);
        } catch (err) {
          console.error('[digest] failed to write cache:', err instanceof Error ? err.message : String(err));
        }
        digestMap.set(sub.fingerprint, result.digest);
      })
    );
  }

  console.log(`[digest] Phase 1 complete: ${digestMap.size} digest(s) resolved. Starting Phase 2: sending ${subsWithMeta.length} email(s)`);
  logDigest(runId, 'phase1_complete', {
    resolvedDigests: digestMap.size,
    expectedEmails: subsWithMeta.length,
  });
  logDigest(runId, 'phase2_start', { expectedEmails: subsWithMeta.length, emailConcurrency: EMAIL_CONCURRENCY });

  // ── Phase 2: Send all emails at high concurrency ───────────────────────────
  // All digests are resolved — no Gemini calls here. Pure email I/O.

  let sent = 0;
  let failed = 0;
  let missingDigest = 0;
  let sendRejected = 0;
  let sendException = 0;

  for (let i = 0; i < subsWithMeta.length; i += EMAIL_CONCURRENCY) {
    const batch = subsWithMeta.slice(i, i + EMAIL_CONCURRENCY);

    const batchResults = await Promise.allSettled(
      batch.map(async (sub) => {
        const digest = digestMap.get(sub.fingerprint);
        if (!digest) {
          console.error(`[digest] No resolved digest for ${sub.user.email} (fingerprint: ${sub.fingerprint.slice(0, 60)}) — skipping`);
          missingDigest++;
          return 'failed';
        }

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
          console.error(`[digest] Failed to send digest email (phase=send, email=${sub.user.email}, subscriptionId=${sub.id}, fingerprint=${sub.fingerprint.slice(0, 60)}):`, result.error);
          sendRejected++;
          return 'failed';
        }
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value === 'sent') {
        sent++;
      } else {
        if (result.status === 'rejected') {
          console.error('[digest] Unexpected error in send batch (phase=batch-send):', result.reason);
          sendException++;
        }
        failed++;
      }
    }
  }

  logDigest(runId, 'phase2_complete', {
    sent,
    failed,
    missingDigest,
    sendRejected,
    sendException,
  });
  logDigest(runId, 'run_complete', {
    outcome: failed > 0 ? 'partial_or_full_failure' : 'success',
    sent,
    failed,
    skipped: alreadySent,
    deduped: dedupedCount,
    totalEligible,
    elapsedMs: Date.now() - startedAt,
  });

  return createApiResponse(
    { sent, failed, skipped: alreadySent, deduped: dedupedCount, total: totalEligible },
    `Digest run complete: ${sent} sent, ${failed} failed, ${alreadySent} already sent today`,
  );
}
