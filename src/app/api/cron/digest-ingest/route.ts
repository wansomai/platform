// src/app/api/cron/digest-ingest/route.ts
//
// Background ingestion cron — polls RSS feeds, the LII scraper, and Tavily
// fallback and stores fresh legal items in the DigestItem table.
//
// Two staggered cron jobs keep each run well inside the 300 s window:
//   Tier 1  0:00, 4:00, 8:00 … UTC — primary markets (always-on baseline)
//   Tier 2  0:30, 4:30, 8:30 … UTC — expanded Africa (subscriber-driven)
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
import { TIER_1_CODES, TIER_2_CODES } from '@/lib/briefly-jurisdictions';
import prisma from '@/lib/prisma';

export const maxDuration = 300;

// ── Jurisdiction tiers ────────────────────────────────────────────────────────
//
// Two staggered cron jobs keep each run well inside the 300 s window:
//   Tier 1  0:00, 4:00, 8:00 … UTC — primary markets, rich sources, always-on baseline
//   Tier 2  0:30, 4:30, 8:30 … UTC — expanded Africa, AllAfrica-primary, subscriber-driven

// Aliases so existing logic below is unchanged
const TIER_1_JURISDICTIONS   = TIER_1_CODES;
const TIER_2_JURISDICTIONS   = TIER_2_CODES;
const CONFIGURED_JURISDICTIONS = new Set([...TIER_1_CODES, ...TIER_2_CODES]);

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

  let jurisdictions: string[];

  if (rawJ) {
    // Manual override — honour exactly what was passed (filtered to configured)
    jurisdictions = rawJ
      .split(',')
      .map((j) => j.trim().toUpperCase())
      .filter((j) => CONFIGURED_JURISDICTIONS.has(j));
  } else {
    // ── Jurisdiction resolution ──────────────────────────────────────────────
    //
    // Tier 1 always ingests ALL Tier 1 jurisdictions as a baseline, regardless
    // of whether there are active subscribers.  This eliminates the chicken-and-egg
    // problem where a new subscriber's first preview or digest would hit an empty DB
    // because the ingest had never run for their jurisdiction.
    //
    // Tier 2 remains subscriber-driven: it covers 30 mostly thin jurisdictions and
    // running all of them every 4 hours would consume too much of the 300 s budget.
    //
    // In both cases, any subscriber jurisdictions not already in the baseline are
    // merged in so no subscriber is ever left without fresh content.

    const baseline: Set<string> =
      rawTier === '2' ? new Set() : new Set(TIER_1_JURISDICTIONS);

    const activeSubscriptions = await prisma.digestSubscription.findMany({
      where:  { isActive: true },
      select: { jurisdictions: true },
    });

    const uniqueCodes = new Set<string>(baseline);
    for (const sub of activeSubscriptions) {
      for (const code of sub.jurisdictions) {
        const upper = code.toUpperCase();
        if (CONFIGURED_JURISDICTIONS.has(upper) && (!tierFilter || tierFilter.has(upper))) {
          uniqueCodes.add(upper);
        }
      }
    }

    jurisdictions = Array.from(uniqueCodes);

    // After merging baseline + subscribers, Tier 2 with zero subscribers and no
    // baseline is the only scenario that produces an empty list — skip cleanly.
    if (jurisdictions.length === 0) {
      const tierLabel = rawTier ? `tier ${rawTier}` : 'any tier';
      console.log(`[digest-ingest] No jurisdictions to ingest for ${tierLabel} — skipping`);
      return createApiResponse(
        { results: [], totalStored: 0, totalSkipped: 0, elapsed_ms: 0 },
        `No jurisdictions to ingest for ${tierLabel}`,
      );
    }

    const subscriberExtra = Array.from(uniqueCodes).filter((j) => !baseline.has(j));
    console.log(
      `[digest-ingest] Baseline: ${baseline.size} jurisdiction(s)` +
      (subscriberExtra.length ? ` + ${subscriberExtra.length} subscriber-only: ${subscriberExtra.join(', ')}` : ''),
    );
  }

  // Tier 1 jurisdictions can have up to 2 AllAfrica feeds each → cap at 4 concurrent
  // (= max 8 simultaneous AllAfrica requests).  Tier 2 jurisdictions have a single
  // AllAfrica feed each, so concurrency 8 keeps the same 8-request ceiling while
  // cutting batch count from 8 → 4 for 30 jurisdictions (fits in 300 s budget).
  const concurrency = rawTier === '2' ? 8 : 4;

  const tierLabel = rawTier ? `tier ${rawTier}` : 'all tiers';
  console.log(`[digest-ingest] Ingesting ${jurisdictions.length} jurisdiction(s) (${tierLabel}): ${jurisdictions.join(', ')}`);
  const t0 = Date.now();

  const results = await ingestJurisdictions(jurisdictions, concurrency);

  const totalStored  = results.reduce((n, r) => n + r.stored,  0);
  const totalSkipped = results.reduce((n, r) => n + r.skipped, 0);
  const elapsed      = Date.now() - t0;

  console.log(`[digest-ingest] Done: ${totalStored} stored, ${totalSkipped} skipped in ${elapsed}ms`);

  return createApiResponse(
    {
      results,
      totalStored,
      totalSkipped,
      elapsed_ms: elapsed,
      tier:       rawTier ?? 'all',
    },
    `Ingestion complete (${tierLabel}): ${totalStored} new items stored`,
  );
}
