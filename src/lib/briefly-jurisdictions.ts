// src/lib/briefly-jurisdictions.ts
//
// Shared constants for Briefly's jurisdiction support tiers.
// Imported by both server-side services and client-side components.
//
// Tier 1: primary markets — always ingested as baseline every 4 hours.
// Tier 2: expanded Africa — subscriber-driven ingest.
// Supported: Tier 1 ∪ Tier 2 — jurisdictions backed by RSS/scraper/Tavily feeds.
// Any jurisdiction outside this set is handled via live Gemini grounding at synthesis time.

export const TIER_1_CODES = new Set([
  'KE', 'ZA', 'NG', 'GH', 'TZ', 'UG', 'RW', 'ET',
  'GB', 'US', 'IN', 'AU', 'CA', 'EU',
]);

export const TIER_2_CODES = new Set([
  'MW', 'ZM', 'ZW', 'BW', 'LS', 'MZ', 'NA', 'SS', 'SD',
  'SN', 'CI', 'CM', 'SL', 'GM', 'LR', 'GN', 'BI', 'DJ',
  'SO', 'MG', 'MU', 'SC', 'AO', 'CG', 'CD', 'NE', 'ML',
  'BF', 'TG', 'BJ',
]);

export const SUPPORTED_JURISDICTION_CODES = new Set([
  ...TIER_1_CODES,
  ...TIER_2_CODES,
]);
