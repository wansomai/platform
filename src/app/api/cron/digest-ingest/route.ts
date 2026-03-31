// src/app/api/cron/digest-ingest/route.ts
//
// Background ingestion cron — polls RSS feeds, the LII scraper, and Tavily
// fallback and stores fresh legal items in the DigestItem table.
//
// Two staggered cron jobs keep each run well inside the 300 s window:
//   Tier 1  0:00, 4:00, 8:00 … UTC — primary markets + pre-synthesis
//   Tier 2  0:30, 4:30, 8:30 … UTC — expanded Africa, no pre-synthesis
//
// Schedule (vercel.json):
//   { "path": "/api/cron/digest-ingest?tier=1", "schedule": "0 */4 * * *" }
//   { "path": "/api/cron/digest-ingest?tier=2", "schedule": "30 */4 * * *" }
//
// Ingestion is SUBSCRIBER-DRIVEN: on each run we look up all active
// DigestSubscription rows and ingest only the jurisdictions those subscribers
// have chosen, filtered to the relevant tier.
//
// Override via query param for dev/testing:
//   GET /api/cron/digest-ingest?jurisdictions=KE,ZA,NG

import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import { ingestJurisdictions } from '@/services/digestIngestService';
import {
  generateLegalDigestFromDB,
  buildDigestFingerprint,
  setCachedDigest,
} from '@/services/legalDigestService';
import { PRACTICE_AREA_LABELS } from '@/types/associates';
import prisma from '@/lib/prisma';

// Maximum concurrent Gemini synthesis calls during pre-synthesis phase.
const SYNTH_CONCURRENCY = 3;

export const maxDuration = 300;

// ── Jurisdiction tiers ────────────────────────────────────────────────────────
//
// Two staggered cron jobs keep each run well inside the 300 s window:
//   Tier 1  0:00, 4:00, 8:00 … UTC — primary markets, rich sources, pre-synthesis
//   Tier 2  0:30, 4:30, 8:30 … UTC — expanded Africa, AllAfrica-primary, no pre-synthesis
//
// Pre-synthesis runs only in Tier 1: at that point, Tier 1 items are freshly
// ingested and Tier 2 items from the previous run are already in the DB, so
// synthesis covers all subscriber jurisdictions with at most 4-hour-old Tier 2 data.

const TIER_1_JURISDICTIONS = new Set([
  'KE', 'ZA', 'NG', 'GH', 'TZ', 'UG', 'RW', 'ET',
  'GB', 'US', 'IN', 'AU', 'CA', 'EU',
]);

const TIER_2_JURISDICTIONS = new Set([
  'MW', 'ZM', 'ZW', 'BW', 'LS', 'MZ', 'NA', 'SS', 'SD',
  'SN', 'CI', 'CM', 'SL', 'GM', 'LR', 'GN', 'BI', 'DJ',
  'SO', 'MG', 'MU', 'SC', 'AO', 'CG', 'CD', 'NE', 'ML',
  'BF', 'TG', 'BJ',
]);

const CONFIGURED_JURISDICTIONS = new Set([
  ...TIER_1_JURISDICTIONS,
  ...TIER_2_JURISDICTIONS,
]);

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

  const { searchParams } = new URL(req.url);
  const rawJ    = searchParams.get('jurisdictions');
  const rawTier = searchParams.get('tier');

  // Tier filter: tier=1 → Tier 1 only, tier=2 → Tier 2 only, omitted → all
  const tierFilter: Set<string> | null =
    rawTier === '1' ? TIER_1_JURISDICTIONS :
    rawTier === '2' ? TIER_2_JURISDICTIONS :
    null;

  // Pre-synthesis only runs on Tier 1 (or un-tiered manual runs),
  // by which point Tier 2 items from the previous run are already in the DB.
  const runPreSynthesis = rawTier !== '2';

  let jurisdictions: string[];

  if (rawJ) {
    // Manual override — honour exactly what was passed (filtered to configured)
    jurisdictions = rawJ
      .split(',')
      .map((j) => j.trim().toUpperCase())
      .filter((j) => CONFIGURED_JURISDICTIONS.has(j));
  } else {
    // Subscriber-driven: collect every jurisdiction any active subscriber wants,
    // filtered to this tier's allowed set.
    const activeSubscriptions = await prisma.digestSubscription.findMany({
      where:  { isActive: true },
      select: { jurisdictions: true },
    });

    const uniqueCodes = new Set<string>();
    for (const sub of activeSubscriptions) {
      for (const code of sub.jurisdictions) {
        const upper = code.toUpperCase();
        if (CONFIGURED_JURISDICTIONS.has(upper) && (!tierFilter || tierFilter.has(upper))) {
          uniqueCodes.add(upper);
        }
      }
    }

    jurisdictions = Array.from(uniqueCodes);

    if (jurisdictions.length === 0) {
      const tierLabel = rawTier ? `tier ${rawTier}` : 'any tier';
      console.log(`[digest-ingest] No active subscribers for ${tierLabel} — skipping ingestion`);
      return createApiResponse(
        { results: [], totalStored: 0, totalSkipped: 0, elapsed_ms: 0 },
        `No active subscribers for ${tierLabel} — nothing to ingest`,
      );
    }
  }

  const tierLabel = rawTier ? `tier ${rawTier}` : 'all tiers';
  console.log(`[digest-ingest] Ingesting ${jurisdictions.length} jurisdiction(s) (${tierLabel}): ${jurisdictions.join(', ')}`);
  const t0 = Date.now();

  const results = await ingestJurisdictions(jurisdictions);

  const totalStored  = results.reduce((n, r) => n + r.stored,  0);
  const totalSkipped = results.reduce((n, r) => n + r.skipped, 0);
  const elapsed      = Date.now() - t0;

  console.log(`[digest-ingest] Done: ${totalStored} stored, ${totalSkipped} skipped in ${elapsed}ms`);

  // ── Phase 2: pre-synthesize digests for all active subscriber fingerprints ──
  // Runs on Tier 1 and un-tiered runs only.  Tier 2 skips this so its shorter
  // window stays within budget.  Manual ?jurisdictions= overrides also skip
  // to avoid unnecessary Gemini calls during dev/testing.
  let synthCached = 0;
  let synthFailed = 0;

  if (!rawJ && runPreSynthesis) {
    const t1 = Date.now();

    const allSubs = await prisma.digestSubscription.findMany({
      where:  { isActive: true },
      select: { frequency: true, jurisdictions: true, topics: true },
    });

    // Build the set of unique fingerprints across all active subscriptions.
    const fingerprintMap = new Map<string, {
      frequency:     string;
      jurisdictions: string[];
      topicLabels:   string[];
    }>();

    for (const sub of allSubs) {
      const topicLabels = sub.topics.map(
        (t) => PRACTICE_AREA_LABELS[t as keyof typeof PRACTICE_AREA_LABELS] || t,
      );
      const fp = buildDigestFingerprint(sub.frequency, sub.jurisdictions, topicLabels);
      if (!fingerprintMap.has(fp)) {
        fingerprintMap.set(fp, {
          frequency:     sub.frequency,
          jurisdictions: sub.jurisdictions,
          topicLabels,
        });
      }
    }

    const fpEntries = Array.from(fingerprintMap.entries());
    console.log(`[digest-ingest] Pre-synthesizing ${fpEntries.length} unique fingerprint(s)`);

    for (let i = 0; i < fpEntries.length; i += SYNTH_CONCURRENCY) {
      const batch = fpEntries.slice(i, i + SYNTH_CONCURRENCY);
      const batchResults = await Promise.allSettled(
        batch.map(async ([fp, { frequency, jurisdictions: jurs, topicLabels }]) => {
          const { digest } = await generateLegalDigestFromDB(
            topicLabels,
            jurs,
            frequency as 'daily' | 'weekly',
          );
          await setCachedDigest(fp, frequency, jurs, topicLabels, digest);
          console.log(`[digest-ingest] Cached synthesis: ${fp.slice(0, 60)}`);
        }),
      );

      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          synthCached++;
        } else {
          synthFailed++;
          console.error('[digest-ingest] Pre-synthesis failed:', r.reason?.message ?? r.reason);
        }
      }
    }

    console.log(
      `[digest-ingest] Pre-synthesis done: ${synthCached} cached, ${synthFailed} failed` +
      ` in ${Date.now() - t1}ms`,
    );
  }

  const synthesisStatus =
    rawJ             ? 'skipped (manual override)' :
    !runPreSynthesis ? 'skipped (tier 2)' :
    { cached: synthCached, failed: synthFailed };

  return createApiResponse(
    {
      results,
      totalStored,
      totalSkipped,
      elapsed_ms: elapsed,
      tier:       rawTier ?? 'all',
      synthesis:  synthesisStatus,
    },
    `Ingestion complete (${tierLabel}): ${totalStored} new items stored` +
      (runPreSynthesis && !rawJ ? `, ${synthCached} digest(s) pre-synthesized` : ''),
  );
}
