// src/services/digestIngestService.ts
//
// Continuously ingests legal content from RSS feeds, the LII scraper, and
// Tavily fallback into the DigestItem table.  The synthesis step reads from
// this table instead of doing live searches, guaranteeing timestamped content.
//
// Ingestion sources per jurisdiction (in priority order):
//   1. RSS/Atom feeds  — explicitly timestamped by the publisher
//   2. LII Scraper     — AfricanLII/Peachjam (African jurisdictions only)
//   3. Tavily fallback — when RSS has fewer than MIN_RSS_ITEMS recent items
//
// Run via  GET /api/cron/digest-ingest  (every 2–4 hours via Vercel cron)
// or       GET /api/dev/digest-preview?output=ingest  (dev testing)

import prisma from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';
import { searchAfricanLegalSources } from '@/lib/legalScraper';

// rss-parser is a CommonJS module; use require() to avoid ESM issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Parser = require('rss-parser');

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '' });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IngestResult {
  jurisdiction:  string;
  name:          string;
  rss:           number;
  scraper:       number;
  tavily:        number;
  stored:        number;   // new items persisted to DB
  skipped:       number;   // already existed (URL unique constraint)
  dropped:       number;   // rejected as non-legal by classifier
  elapsed_ms:    number;
  errors:        string[];
}

interface RawItem {
  title:       string;
  url:         string;
  excerpt:     string;
  source:      string;
  publishedAt: Date;
  contentType: 'case_law' | 'legislation' | 'general';
}

// ─── RSS feed registry ────────────────────────────────────────────────────────
//
// Each entry maps a jurisdiction code to one or more RSS/Atom feed URLs.
// Feeds are chosen for:
//   - Explicit <pubDate> or <published> timestamps (critical for date filtering)
//   - High crawl frequency (daily or better)
//   - Legal relevance (court decisions, legislation, legal news)

interface FeedConfig {
  url:          string;
  source:       string;
  contentType:  'case_law' | 'legislation' | 'general';
  /**
   * When true (default), items with no parseable date are dropped.
   * Set to false for trusted newspaper feeds whose homepage RSS always serves
   * today's content — items without an explicit pubDate are treated as "now".
   */
  requireDate?: boolean;
}

const RSS_FEEDS: Record<string, FeedConfig[]> = {

  // ── Tier 1 LII countries (verified 200 direct sources + AllAfrica) ────────────
  // NOTE: requireDate:false on newspaper feeds so that items whose RSS omits
  //       <pubDate> are not silently dropped — they are treated as "now".
  // NOTE: AllAfrica Governance (/rdf/governance/) is pan-African and mixes in
  //       Nigeria, Somalia, South Sudan etc. — it is intentionally EXCLUDED from
  //       single-country feeds where AllAfrica country-specific feeds exist.

  KE: [
    // Standard Media — confirmed working
    { url: 'https://www.standardmedia.co.ke/rss/headlines.php',  source: 'Standard Media',         contentType: 'general', requireDate: false },
    { url: 'https://www.standardmedia.co.ke/rss/kenya.php',      source: 'Standard Media Kenya',   contentType: 'general', requireDate: false },
    // Law Society of Kenya — most relevant for legal digest
    { url: 'https://lsk.or.ke/feed/',                            source: 'Law Society of Kenya',   contentType: 'general', requireDate: false },
    // The Exchange — East Africa business & legal commentary
    { url: 'https://theexchange.africa/feed/',                   source: 'The Exchange Africa',    contentType: 'general', requireDate: false },
    // Capital FM & KBC confirmed reachable
    { url: 'https://www.capitalfm.co.ke/news/feed/',             source: 'Capital FM Kenya',       contentType: 'general', requireDate: false },
    { url: 'https://www.kbc.co.ke/feed/',                        source: 'KBC Kenya',              contentType: 'general', requireDate: false },
    // AllAfrica Kenya — confirmed working
    { url: 'https://allafrica.com/tools/headlines/rdf/kenya/headlines.rdf', source: 'AllAfrica Kenya', contentType: 'general' },
  ],

  ZA: [
    { url: 'https://www.dailymaverick.co.za/feed/',                                 source: 'Daily Maverick',          contentType: 'general'    },
    { url: 'https://mg.co.za/feed/',                                                source: 'Mail & Guardian',         contentType: 'general'    },
    { url: 'https://groundup.org.za/rss/',                                          source: 'GroundUp',                contentType: 'general'    },
    { url: 'https://legalbrief.co.za/feed/',                                        source: 'Legal Brief SA',          contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/southafrica/headlines.rdf',   source: 'AllAfrica SA',            contentType: 'general'    },
  ],

  NG: [
    { url: 'https://punchng.com/feed/',                                             source: 'Punch Nigeria',           contentType: 'general'    },
    { url: 'https://www.premiumtimesng.com/feed/',                                  source: 'Premium Times Nigeria',   contentType: 'general'    },
    { url: 'https://www.vanguardngr.com/feed/',                                     source: 'Vanguard Nigeria',        contentType: 'general'    },
    { url: 'https://businessdayng.com/feed/',                                       source: 'BusinessDay Nigeria',     contentType: 'general'    },
    { url: 'https://www.thisdaylive.com/index.php/feed/',                           source: 'This Day Nigeria',        contentType: 'general'    },
    { url: 'https://thenigerialawyer.com/feed/',                                    source: 'The Nigerian Lawyer',     contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/nigeria/headlines.rdf',       source: 'AllAfrica Nigeria',       contentType: 'general'    },
  ],

  GH: [
    { url: 'https://www.myjoyonline.com/feed/',                                     source: 'MyJoyOnline Ghana',       contentType: 'general'    },
    { url: 'https://www.ghanaweb.com/GhanaHomePage/rss/rss.xml',                    source: 'GhanaWeb',                contentType: 'general'    },
    { url: 'https://www.modernghana.com/rss/news.xml',                              source: 'Modern Ghana',            contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/ghana/headlines.rdf',         source: 'AllAfrica Ghana',         contentType: 'general'    },
  ],

  TZ: [
    { url: 'https://www.thecitizen.co.tz/feed/',                                    source: 'The Citizen Tanzania',    contentType: 'general'    },
    { url: 'https://dailynews.co.tz/feed/',                                         source: 'Daily News Tanzania',     contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/tanzania/headlines.rdf',      source: 'AllAfrica Tanzania',      contentType: 'general'    },
  ],

  UG: [
    { url: 'https://www.monitor.co.ug/rss',                                         source: 'Daily Monitor Uganda',    contentType: 'general'    },
    { url: 'https://www.observer.ug/feed/',                                         source: 'The Observer Uganda',     contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/uganda/headlines.rdf',        source: 'AllAfrica Uganda',        contentType: 'general'    },
  ],

  RW: [
    { url: 'https://www.newtimes.co.rw/rss.xml',                                    source: 'The New Times Rwanda',    contentType: 'general'    },
    { url: 'https://ktpress.rw/feed/',                                              source: 'KT Press Rwanda',         contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/rwanda/headlines.rdf',        source: 'AllAfrica Rwanda',        contentType: 'general'    },
  ],

  ET: [
    { url: 'https://addisstandard.com/feed/',                                       source: 'Addis Standard',          contentType: 'general'    },
    { url: 'https://www.thereporterethiopia.com/feed/',                             source: 'The Reporter Ethiopia',   contentType: 'general'    },
    { url: 'https://ethiopianmonitor.com/feed/',                                    source: 'Ethiopian Monitor',       contentType: 'general'    },
    { url: 'https://addisfortune.news/feed/',                                       source: 'Addis Fortune',           contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/ethiopia/headlines.rdf',      source: 'AllAfrica Ethiopia',      contentType: 'general'    },
  ],

  // ── Tier 2 LII countries (verified 200 direct sources + AllAfrica) ────────────

  ZM: [
    { url: 'https://www.lusakatimes.com/feed/',                                     source: 'Lusaka Times',            contentType: 'general'    },
    { url: 'https://www.daily-mail.co.zm/feed/',                                    source: 'Zambia Daily Mail',       contentType: 'general'    },
    { url: 'https://www.themastonline.com/feed/',                                   source: 'The Mast Zambia',         contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/zambia/headlines.rdf',        source: 'AllAfrica Zambia',        contentType: 'general'    },
  ],

  ZW: [
    { url: 'https://www.newsday.co.zw/feed/',                                       source: 'NewsDay Zimbabwe',        contentType: 'general'    },
    { url: 'https://www.thezimbabwean.co/feed/',                                    source: 'The Zimbabwean',          contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/zimbabwe/headlines.rdf',      source: 'AllAfrica Zimbabwe',      contentType: 'general'    },
  ],

  MW: [
    { url: 'https://mwnation.com/feed/',                                            source: 'The Nation Malawi',       contentType: 'general'    },
    { url: 'https://www.nyasatimes.com/feed/',                                      source: 'Nyasa Times',             contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/malawi/headlines.rdf',        source: 'AllAfrica Malawi',        contentType: 'general'    },
  ],

  BW: [
    { url: 'https://www.sundaystandard.info/feed/',                                 source: 'Sunday Standard Botswana', contentType: 'general'   },
    { url: 'https://www.mmegi.bw/rss/',                                             source: 'Mmegi Botswana',          contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/botswana/headlines.rdf',      source: 'AllAfrica Botswana',      contentType: 'general'    },
  ],

  LS: [
    { url: 'https://lestimes.com/feed/',                                            source: 'Lesotho Times',           contentType: 'general'    },
    { url: 'https://www.publiceyenews.com/feed/',                                   source: 'Public Eye Lesotho',      contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/lesotho/headlines.rdf',       source: 'AllAfrica Lesotho',       contentType: 'general'    },
  ],

  NA: [
    { url: 'https://www.namibian.com.na/feed/',                                     source: 'The Namibian',            contentType: 'general'    },
    { url: 'https://www.namibiansun.com/rss/',                                      source: 'Namibian Sun',            contentType: 'general'    },
    { url: 'https://neweralive.na/feed/',                                           source: 'New Era Namibia',         contentType: 'general'    },
    { url: 'https://www.confidentlive.com/feed/',                                   source: 'Confidente Namibia',      contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/namibia/headlines.rdf',       source: 'AllAfrica Namibia',       contentType: 'general'    },
  ],

  CM: [
    { url: 'https://www.journalducameroun.com/feed/',                               source: 'Journal du Cameroun',     contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/cameroon/headlines.rdf',      source: 'AllAfrica Cameroon',      contentType: 'general'    },
  ],

  SL: [
    { url: 'https://www.thesierraleonetelegraph.com/feed/',                         source: 'Sierra Leone Telegraph',  contentType: 'general'    },
    { url: 'https://www.politicosl.com/rss/',                                       source: 'Politico Sierra Leone',   contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/sierraleone/headlines.rdf',   source: 'AllAfrica Sierra Leone',  contentType: 'general'    },
  ],

  GM: [
    { url: 'https://foroyaa.net/feed/',                                             source: 'Foroyaa Gambia',          contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/gambia/headlines.rdf',        source: 'AllAfrica Gambia',        contentType: 'general'    },
  ],

  LR: [
    { url: 'https://frontpageafricaonline.com/feed/',                               source: 'Front Page Africa',       contentType: 'general'    },
    { url: 'https://liberianobserver.com/feed/',                                    source: 'Liberian Observer',       contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/liberia/headlines.rdf',       source: 'AllAfrica Liberia',       contentType: 'general'    },
  ],

  SN: [
    { url: 'https://allafrica.com/tools/headlines/rdf/senegal/headlines.rdf',       source: 'AllAfrica Senegal',       contentType: 'general'    },
  ],

  MZ: [
    { url: 'https://clubofmozambique.com/feed/',                                    source: 'Club of Mozambique',      contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/mozambique/headlines.rdf',    source: 'AllAfrica Mozambique',    contentType: 'general'    },
  ],

  MU: [
    { url: 'https://www.lexpress.mu/rss.xml',                                       source: "L'Express Mauritius",     contentType: 'general'    },
    { url: 'https://www.lematinal.com/feed/',                                       source: 'Le Matinal Mauritius',    contentType: 'general'    },
    { url: 'https://allafrica.com/tools/headlines/rdf/mauritius/headlines.rdf',     source: 'AllAfrica Mauritius',     contentType: 'general'    },
  ],

  // ── Non-LII African countries (AllAfrica only) ───────────────────────────────

  GN: [
    { url: 'https://allafrica.com/tools/headlines/rdf/guinea/headlines.rdf',        source: 'AllAfrica Guinea',        contentType: 'general'    },
  ],
  BI: [
    { url: 'https://allafrica.com/tools/headlines/rdf/burundi/headlines.rdf',       source: 'AllAfrica Burundi',       contentType: 'general'    },
  ],
  DJ: [
    { url: 'https://allafrica.com/tools/headlines/rdf/djibouti/headlines.rdf',      source: 'AllAfrica Djibouti',      contentType: 'general'    },
  ],
  SO: [
    { url: 'https://allafrica.com/tools/headlines/rdf/somalia/headlines.rdf',       source: 'AllAfrica Somalia',       contentType: 'general'    },
  ],
  MG: [
    { url: 'https://allafrica.com/tools/headlines/rdf/madagascar/headlines.rdf',    source: 'AllAfrica Madagascar',    contentType: 'general'    },
  ],
  SC: [
    { url: 'https://allafrica.com/tools/headlines/rdf/seychelles/headlines.rdf',    source: 'AllAfrica Seychelles',    contentType: 'general'    },
  ],
  AO: [
    { url: 'https://allafrica.com/tools/headlines/rdf/angola/headlines.rdf',        source: 'AllAfrica Angola',        contentType: 'general'    },
  ],
  CG: [
    { url: 'https://allafrica.com/tools/headlines/rdf/congo_brazzaville/headlines.rdf', source: 'AllAfrica Congo',    contentType: 'general'    },
  ],
  CD: [
    { url: 'https://allafrica.com/tools/headlines/rdf/congo_kinshasa/headlines.rdf',    source: 'AllAfrica DRC',      contentType: 'general'    },
  ],
  SS: [
    { url: 'https://allafrica.com/tools/headlines/rdf/southsudan/headlines.rdf',    source: 'AllAfrica South Sudan',   contentType: 'general'    },
  ],
  SD: [
    { url: 'https://allafrica.com/tools/headlines/rdf/sudan/headlines.rdf',         source: 'AllAfrica Sudan',         contentType: 'general'    },
  ],
  CI: [
    { url: 'https://allafrica.com/tools/headlines/rdf/cotedivoire/headlines.rdf',   source: "AllAfrica Côte d'Ivoire", contentType: 'general'    },
  ],
  NE: [
    { url: 'https://allafrica.com/tools/headlines/rdf/niger/headlines.rdf',         source: 'AllAfrica Niger',         contentType: 'general'    },
  ],
  ML: [
    { url: 'https://allafrica.com/tools/headlines/rdf/mali/headlines.rdf',          source: 'AllAfrica Mali',          contentType: 'general'    },
  ],
  BF: [
    { url: 'https://allafrica.com/tools/headlines/rdf/burkinafaso/headlines.rdf',   source: 'AllAfrica Burkina Faso',  contentType: 'general'    },
  ],
  TG: [
    { url: 'https://allafrica.com/tools/headlines/rdf/togo/headlines.rdf',          source: 'AllAfrica Togo',          contentType: 'general'    },
  ],
  BJ: [
    { url: 'https://allafrica.com/tools/headlines/rdf/benin/headlines.rdf',         source: 'AllAfrica Benin',         contentType: 'general'    },
  ],

  // ── Non-African jurisdictions ─────────────────────────────────────────────────

  GB: [
    { url: 'https://www.legislation.gov.uk/new/data.feed',                          source: 'legislation.gov.uk',      contentType: 'legislation' },
    { url: 'https://www.lawgazette.co.uk/rss.ashx',                                 source: 'Law Gazette',             contentType: 'general'    },
    { url: 'https://www.legalfutures.co.uk/feed',                                   source: 'Legal Futures',           contentType: 'general'    },
  ],
  US: [
    { url: 'https://www.courtlistener.com/feed/court/all/',                         source: 'CourtListener',           contentType: 'case_law'   },
    { url: 'https://www.scotusblog.com/feed/',                                      source: 'SCOTUSblog',              contentType: 'case_law'   },
    { url: 'https://www.abajournal.com/feed/',                                      source: 'ABA Journal',             contentType: 'general'    },
    { url: 'https://feeds.reuters.com/reuters/legal',                               source: 'Reuters Legal',           contentType: 'general'    },
  ],
  IN: [
    { url: 'https://www.barandbench.com/feed',                                      source: 'Bar and Bench',           contentType: 'general'    },
    { url: 'https://www.livelaw.in/rss.xml',                                        source: 'Live Law India',          contentType: 'case_law'   },
  ],
  AU: [
    { url: 'https://www.lawyersweekly.com.au/feed',                                 source: 'Lawyers Weekly AU',       contentType: 'general'    },
  ],
  CA: [
    { url: 'https://www.canadianlawyermag.com/feed/',                               source: 'Canadian Lawyer',         contentType: 'general'    },
  ],
  EU: [
    { url: 'https://euractiv.com/feed/',                                            source: 'Euractiv',                contentType: 'general'    },
  ],
};

// African jurisdictions where the LII scraper (AfricanLII/PeachJam) is available.
// These get case law and gazette supplements on top of AllAfrica RSS.
const SCRAPER_JURISDICTIONS: Record<string, string> = {
  // Tier 1 — original (full RSS + LII coverage)
  KE: 'Kenya',        ZA: 'South Africa', NG: 'Nigeria',  GH: 'Ghana',
  TZ: 'Tanzania',     UG: 'Uganda',       RW: 'Rwanda',   ET: 'Ethiopia',
  // Tier 2 — AfricanLII / PeachJam coverage confirmed
  ZM: 'Zambia',       ZW: 'Zimbabwe',     MW: 'Malawi',   BW: 'Botswana',
  LS: 'Lesotho',      NA: 'Namibia',      CM: 'Cameroon', SL: 'Sierra Leone',
  GM: 'Gambia',       LR: 'Liberia',      SN: 'Senegal',  MZ: 'Mozambique',
  MU: 'Mauritius',
};

// Minimum number of RSS items published in the last 7 days before Tavily
// fallback kicks in.  If RSS is fresh enough we skip Tavily entirely.
const MIN_RSS_ITEMS = 3;

// Maximum number of items to keep per RSS feed per ingest run.
// Items are sorted newest-first before the cap is applied, so we always
// retain the most recent content and discard older overflow.
const MAX_ITEMS_PER_FEED = 10;

// Country names used by AllAfrica to prefix off-topic items, e.g. "Nigeria: Article title".
// During ingestion, any item whose title starts with "KnownCountry: " and that country
// does NOT match the target jurisdiction is discarded — keeping each jurisdiction's
// feed strictly on-topic.
const ALLAFRICA_COUNTRY_PREFIXES = new Set([
  'Kenya', 'Nigeria', 'South Africa', 'Ghana', 'Tanzania', 'Uganda',
  'Rwanda', 'Ethiopia', 'Zambia', 'Zimbabwe', 'Malawi', 'Botswana',
  'Lesotho', 'Namibia', 'Cameroon', 'Sierra Leone', 'Gambia', 'Liberia',
  'Senegal', 'Mozambique', 'Mauritius', 'Guinea', 'Burundi', 'Djibouti',
  'Somalia', 'Madagascar', 'Seychelles', 'Angola', 'South Sudan', 'Sudan',
  "Côte d'Ivoire", 'Republic of Congo', 'DR Congo', 'Niger', 'Mali',
  'Burkina Faso', 'Togo', 'Benin', 'Eritrea', 'Comoros', 'Gabon',
  'Equatorial Guinea', 'Central African Republic', 'Libya', 'Tunisia',
  'Algeria', 'Morocco', 'Egypt', 'United States', 'United Kingdom',
  'India', 'Australia', 'Canada',
]);

// How far back to look for new items per ingestion run.
// 96 hours (4 days) gives deeper coverage and tolerates a missed cron run.
const INGEST_WINDOW_MS = 96 * 60 * 60 * 1000;

// RSS fetch timeout per feed.  AllAfrica RDF feeds can be slow — 30s is safe.
const RSS_TIMEOUT_MS = 30_000;

// Number of times to retry a timed-out RSS feed before giving up.
const RSS_RETRY_ATTEMPTS = 1;

// ─── RSS polling ──────────────────────────────────────────────────────────────

async function pollRssFeeds(
  code:   string,
  jName:  string,
  since:  Date,
  errors: string[],
): Promise<RawItem[]> {
  const feeds = RSS_FEEDS[code] ?? [];
  if (feeds.length === 0) return [];

  const parser = new Parser({
    timeout:      RSS_TIMEOUT_MS,
    headers:      { 'User-Agent': 'Wansom-Briefly/1.0 (legal digest aggregator)' },
    customFields: {
      item: [
        ['content:encoded',  'contentEncoded'],
        ['dc:date',          'dcDate'],          // RDF/RSS 1.0 (AllAfrica)
        ['dc:description',   'dcDescription'],   // AllAfrica RDF article summary
        ['dc:creator',       'dcCreator'],
        ['media:description','mediaDescription'],
      ],
    },
  });

  const results: RawItem[] = [];

  // Split feeds: AllAfrica feeds are fetched sequentially (same IP — rate-limited)
  // while feeds from other domains run concurrently.
  const allAfricaFeeds = feeds.filter((f) => f.url.includes('allafrica.com'));
  const otherFeeds     = feeds.filter((f) => !f.url.includes('allafrica.com'));

  const fetchFeed = async (feed: FeedConfig) => {
    let lastErr: any;
    for (let attempt = 0; attempt <= RSS_RETRY_ATTEMPTS; attempt++) {
      try {
        const parsed = await parser.parseURL(feed.url);
        const items  = (parsed.items ?? []) as any[];

        // Collect items for this feed, then sort newest-first and cap at
        // MAX_ITEMS_PER_FEED so a large feed never floods the ingest pipeline.
        const feedItems: RawItem[] = [];

        for (const item of items) {
          // Date resolution: try every possible field in order of reliability.
          // AllAfrica RDF uses dc:date; standard RSS uses pubDate; Atom uses published.
          const rawDate =
            item.dcDate        ||   // RDF/RSS 1.0 (AllAfrica)
            item.isoDate       ||   // rss-parser normalised field
            item.pubDate       ||   // RSS 2.0
            item.published     ||   // Atom
            item['dc:date']    ||   // unmapped fallback
            null;

          let date: Date | null = rawDate ? new Date(rawDate) : null;
          if (date && isNaN(date.getTime())) date = null;

          if (!date) {
            // For AllAfrica feeds, a missing date means we cannot verify freshness — drop.
            // For trusted newspaper/publication feeds (requireDate: false) the homepage
            // RSS always serves today's content, so we treat missing dates as "now".
            if (feed.requireDate !== false) continue;
            date = new Date(); // treat as published now
          }

          // Skip items outside the ingest window (4-day lookback)
          if (date < since) continue;

          const url = (item.link || item.url || '').trim();
          if (!url) continue;

          const title   = (item.title || '').replace(/&#?\w+;/g, '').trim();
          const excerpt = (
            item.contentSnippet  ||
            item.dcDescription   ||   // AllAfrica dc:description
            item.content         ||
            item.summary         ||
            item.contentEncoded  ||
            item.description     ||
            item.mediaDescription||
            ''
          ).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 500).trim();

          if (!title) continue;

          // ── Jurisdiction relevance filter for AllAfrica feeds ─────────────
          // AllAfrica aggregates content from every African country.  Two-stage
          // filter to keep only content relevant to the target jurisdiction:
          //
          // Stage 1 — "Country: Title" prefix check (catches most off-topic items)
          // AllAfrica prefixes cross-country articles with "CountryName: ".
          // Drop any item whose prefix names a DIFFERENT country.
          if (feed.url.includes('allafrica.com')) {
            const prefixMatch = title.match(/^([^:]{3,35}):\s/);
            if (prefixMatch) {
              const prefix = prefixMatch[1].trim();
              if (
                ALLAFRICA_COUNTRY_PREFIXES.has(prefix) &&
                prefix.toLowerCase() !== jName.toLowerCase()
              ) continue;
            }

            // Stage 2 — unprefixed items on pan-African feeds (e.g. Governance).
            // If the URL path contains "governance", "africa", or "continent" we
            // treat it as pan-African: require that the title or excerpt contains
            // the jurisdiction name somewhere, otherwise drop.
            const isPanAfrican = /\/(governance|africa|continent|sadc|ecowas|au)\//i.test(feed.url);
            if (isPanAfrican && !prefixMatch) {
              const combined = (title + ' ' + excerpt).toLowerCase();
              if (!combined.includes(jName.toLowerCase())) continue;
            }
          }

          feedItems.push({
            title,
            url,
            excerpt,
            source:      feed.source,
            publishedAt: date,
            contentType: feed.contentType,
          });
        }

        // Sort newest-first, cap, then append to the shared results array.
        feedItems.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
        results.push(...feedItems.slice(0, MAX_ITEMS_PER_FEED));

        return; // success — exit retry loop
      } catch (err: any) {
        lastErr = err;
        // Retry on any transient network error: request timeout, connect timeout,
        // connection reset, or DNS failure — not on 404 / parse errors.
        const isTransient = /timedout|etimedout|econnreset|econnrefused|enotfound|network/i.test(
          (err.message || '') + (err.code || ''),
        );
        if (isTransient && attempt < RSS_RETRY_ATTEMPTS) {
          console.warn(`[RSS] Transient error on ${feed.source} (${err.code || err.message}) — retrying (attempt ${attempt + 1})`);
          await new Promise((r) => setTimeout(r, 3_000)); // 3 s back-off before retry
          continue;
        }
        errors.push(`RSS [${feed.source}]: ${err.message}`);
        return;
      }
    }
  };

  // Non-AllAfrica feeds: concurrent
  await Promise.allSettled(otherFeeds.map(fetchFeed));

  // AllAfrica feeds: sequential with 2 s gap to avoid IP rate-limiting
  for (const feed of allAfricaFeeds) {
    await fetchFeed(feed);
    if (allAfricaFeeds.indexOf(feed) < allAfricaFeeds.length - 1) {
      await new Promise((r) => setTimeout(r, 2_000));
    }
  }

  return results;
}

// ─── LII Scraper supplement ───────────────────────────────────────────────────

async function pollScraper(
  code:   string,
  errors: string[],
): Promise<RawItem[]> {
  const jName = SCRAPER_JURISDICTIONS[code];
  if (!jName) return [];

  if (!process.env.LII_SCRAPER_URL) {
    console.warn(`[Scraper] LII_SCRAPER_URL not set — skipping scraper for ${code}`);
    return [];
  }

  const currentCalYear = new Date().getFullYear();

  try {
    const [casesRes, gazRes] = await Promise.allSettled([
      searchAfricanLegalSources(
        `${jName} court judgment ruling`,
        { jurisdictionHint: jName, maxResults: 10 },
      ),
      searchAfricanLegalSources(
        `${jName} gazette notice legislation`,
        { jurisdictionHint: jName, maxResults: 8 },
      ),
    ]);

    const raw: any[] = [
      ...(casesRes.status === 'fulfilled' ? casesRes.value.legalSources : []),
      ...(gazRes.status === 'fulfilled'
        ? [...gazRes.value.legalSources, ...gazRes.value.researchSources]
        : []),
    ];

    const today = new Date();

    return raw
      .filter((r) => {
        if (!r.url || !r.title) return false;
        // If the LII result has a date, reject clearly old content (pre-2 years).
        // If it has NO date, keep it — AfricanLII freshly-indexed judgments rarely
        // include a date in their search snippet but are current content.
        if (r.date) {
          const d = new Date(r.date);
          if (!isNaN(d.getTime()) && d.getFullYear() < currentCalYear - 1) return false;
        }
        return true;
      })
      .map((r) => {
        // Resolve publishedAt: use the result's date if available and parseable,
        // otherwise fall back to today (freshly-indexed LII content).
        let publishedAt = today;
        if (r.date) {
          const d = new Date(r.date);
          if (!isNaN(d.getTime())) publishedAt = d;
        }
        return {
          title:       r.title,
          url:         r.url,
          excerpt:     r.snippet || '',
          source:      r.platformName || jName + ' Law',
          publishedAt,
          contentType: /(gazette|legislation|act|bill|statutory)/i.test(r.title || '') ? 'legislation' : 'case_law',
        } as RawItem;
      });
  } catch (err: any) {
    errors.push(`Scraper [${code}]: ${err.message}`);
    return [];
  }
}

// ─── Tavily fallback ──────────────────────────────────────────────────────────

async function tavilyFallback(
  code:   string,
  jName:  string,
  errors: string[],
): Promise<RawItem[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const query = `latest ${jName} legal news court decisions legislation ${new Date().getFullYear()}`;

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        api_key:      apiKey,
        query,
        search_depth: 'basic',
        max_results:  8,
        topic:        'news',
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return [];

    const data  = await res.json();
    const items = (data.results ?? []) as any[];
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return items
      .filter((item) => {
        if (!item.url || !item.title) return false;
        const d = item.published_date ? new Date(item.published_date) : null;
        return !d || isNaN(d.getTime()) || d >= since;
      })
      .map((item) => ({
        title:       item.title,
        url:         item.url,
        excerpt:     (item.content || '').slice(0, 400),
        source:      (() => { try { return new URL(item.url).hostname.replace(/^www\./, ''); } catch { return item.url; } })(),
        publishedAt: item.published_date ? new Date(item.published_date) : new Date(),
        contentType: 'general' as const,
      }));
  } catch (err: any) {
    errors.push(`Tavily [${code}]: ${err.message}`);
    return [];
  }
}

// ─── Article excerpt enrichment ──────────────────────────────────────────────
//
// For RSS items whose excerpt is shorter than MIN_EXCERPT_LEN (thin or missing),
// we fetch the article HTML and extract the og:description / meta description.
// These tags are written by editors as article summaries and are present on
// virtually every modern news site. The extracted text is stored in the DB
// permanently — this cost is paid once at ingest time, never again at send time.
//
// Runs with a concurrency cap of EXCERPT_CONCURRENCY so we don't hammer source
// servers. Cloudflare-protected sites (403/530) are silently skipped.

const EXCERPT_CONCURRENCY = 5;
const EXCERPT_FETCH_TIMEOUT_MS = 8_000;

/**
 * Extract a summary from an article HTML string.
 * Tries (in order): og:description → meta description → twitter:description.
 * Returns '' if nothing useful is found.
 */
function extractMetaExcerpt(html: string): string {
  // Patterns handle both attribute orderings:
  //   <meta property="og:description" content="…">
  //   <meta content="…" property="og:description">
  const patterns = [
    /property=["']og:description["'][^>]+content=["']([^"']{40,})["']/i,
    /content=["']([^"']{40,})["'][^>]+property=["']og:description["']/i,
    /name=["']description["'][^>]+content=["']([^"']{40,})["']/i,
    /content=["']([^"']{40,})["'][^>]+name=["']description["']/i,
    /name=["']twitter:description["'][^>]+content=["']([^"']{40,})["']/i,
    /content=["']([^"']{40,})["'][^>]+name=["']twitter:description["']/i,
  ];

  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m) {
      return m[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#\d+;/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500);
    }
  }
  return '';
}

/**
 * Fetch a single article URL and return its og/meta description excerpt.
 * Returns '' on any error (timeout, 4xx, DNS failure, etc.) — callers silently
 * keep whatever excerpt they already have.
 */
async function fetchArticleExcerpt(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Wansom-Briefly/1.0; +https://wansom.ai)',
        'Accept':     'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(EXCERPT_FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });

    if (!res.ok) return '';

    // Read only the first 20 KB — meta tags are always in <head>
    const reader  = res.body?.getReader();
    if (!reader)  return '';

    let html    = '';
    let bytes   = 0;
    const limit = 20_000;

    while (bytes < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      html  += new TextDecoder().decode(value);
      bytes += value.byteLength;
    }
    reader.cancel().catch(() => {});

    return extractMetaExcerpt(html);
  } catch {
    return '';
  }
}

/**
 * Enrich a batch of RawItems whose excerpt is thin by fetching the article page
 * and extracting the og:description / meta description.
 *
 * Mutates items in-place. Runs with EXCERPT_CONCURRENCY parallel fetches.
 */
async function enrichExcerpts(items: RawItem[]): Promise<void> {
  const thin = items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.excerpt.length < MIN_EXCERPT_LEN);

  if (thin.length === 0) return;

  console.log(`[Ingest] Enriching excerpts for ${thin.length} thin item(s)…`);

  // Process in EXCERPT_CONCURRENCY-sized windows
  for (let i = 0; i < thin.length; i += EXCERPT_CONCURRENCY) {
    const window = thin.slice(i, i + EXCERPT_CONCURRENCY);
    await Promise.allSettled(
      window.map(async ({ item }) => {
        const fetched = await fetchArticleExcerpt(item.url);
        if (fetched.length > item.excerpt.length) {
          item.excerpt = fetched;
        }
      }),
    );
  }
}

// ─── Topic classification ─────────────────────────────────────────────────────
//
// Cheap Gemini call: given a batch of titles + excerpts, returns topic tags.
// We batch up to 20 items per call to minimise API round-trips.

const KNOWN_TOPICS = [
  'Criminal Law', 'Civil Litigation', 'Commercial Law', 'Contract Law',
  'Constitutional Law', 'Employment Law', 'Tax Law', 'Real Estate',
  'Intellectual Property', 'Banking & Finance', 'Corporate Governance',
  'Immigration', 'Family Law', 'Environmental Law', 'Regulatory Compliance',
];

/**
 * Classify topics AND generate a 1–2 sentence summary for items whose excerpt
 * is shorter than MIN_EXCERPT_LEN characters (typically AllAfrica RDF items
 * that carry no description, or feeds that only emit a title).
 *
 * Both operations are combined into a single Gemini call per batch to minimise
 * API round-trips.
 */
const MIN_EXCERPT_LEN = 60;

async function classifyAndSummarise(
  items: RawItem[],
): Promise<{ topics: string[][]; summaries: string[]; isLegal: boolean[] }> {
  if (items.length === 0) return { topics: [], summaries: [], isLegal: [] };

  const batchSize = 20;
  const allTopics:    string[][] = new Array(items.length).fill([]);
  // Default to empty string — aiSummary is always written to a dedicated DB field,
  // never used as a fallback for excerpt.
  const allSummaries: string[]   = new Array(items.length).fill('');
  // Default to false — items whose batch fails are treated as non-legal and dropped.
  const allIsLegal:   boolean[]  = new Array(items.length).fill(false);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Always provide the excerpt so Gemini can write an informed summary,
    // even for long excerpts — every item gets an AI-written aiSummary.
    const input = batch.map((item, idx) =>
      `${idx + 1}. Title: ${item.title}\n` +
      `Excerpt: ${item.excerpt.slice(0, 200) || '(none)'}`,
    ).join('\n\n');

    const prompt =
      `You are a legal news classifier and summariser.\n\n` +
      `For each item below:\n` +
      `1. Decide if the item is relevant to the legal profession (court decisions, legislation, ` +
      `regulations, legal sector news, law firm updates, compliance, governance). ` +
      `Set "isLegal": true only if a practising attorney would find it professionally relevant. ` +
      `Sports, entertainment, general politics without legal dimensions, and celebrity news are NOT legal.\n` +
      `2. If isLegal is true, classify into one or more of: ${KNOWN_TOPICS.join(', ')}. If none fit precisely, use "General".\n` +
      `3. Write a 1–2 sentence factual summary in plain English suitable for a practising attorney.\n\n` +
      `${input}\n\n` +
      `Reply ONLY with a JSON array. Each element: {"isLegal": bool, "topics": [...], "summary": "..."}.\n` +
      `Example: [{"isLegal":true,"topics":["Criminal Law"],"summary":"The High Court dismissed the appeal on procedural grounds."},` +
      `{"isLegal":false,"topics":[],"summary":""}]\n` +
      `Return only valid JSON, no markdown.`;

    // Retry up to 3 times with exponential backoff on Gemini 503 (overloaded).
    // A failed batch previously silently dropped all items — retrying prevents that.
    const maxAttempts = 3;
    let batchSucceeded = false;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await genAI.models.generateContent({
          model:    'gemini-2.0-flash',
          contents: prompt,
          config:   { temperature: 0 },
        });

        let text = (response.text || '').trim();
        if (text.startsWith('```')) text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        const parsed: Array<{ isLegal: boolean; topics: string[]; summary: string }> = JSON.parse(text);

        for (let j = 0; j < batch.length; j++) {
          const entry = parsed[j];
          if (!entry) continue;
          allIsLegal[i + j]  = entry.isLegal === true;
          allTopics[i + j]   = allIsLegal[i + j] && Array.isArray(entry.topics) && entry.topics.length > 0
            ? entry.topics
            : ['General'];
          if (entry.isLegal && entry.summary && entry.summary.trim().length > 10) {
            allSummaries[i + j] = entry.summary.trim();
          }
        }
        batchSucceeded = true;
        break;
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 503 && attempt < maxAttempts) {
          const delay = 5000 * attempt; // 5s, 10s
          console.warn(`[Ingest] Gemini 503 on classify attempt ${attempt} — retrying in ${delay}ms`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          console.error(`[Ingest] classify batch failed after ${attempt} attempt(s):`, (err as Error)?.message ?? err);
          break;
        }
      }
    }
    if (!batchSucceeded) {
      // All retries exhausted — mark batch as General/non-legal so they are dropped.
      for (let j = 0; j < batch.length; j++) {
        allTopics[i + j] = ['General'];
      }
    }
  }

  return { topics: allTopics, summaries: allSummaries, isLegal: allIsLegal };
}

// ─── Persist to DB ────────────────────────────────────────────────────────────

async function persistItems(
  items:        RawItem[],
  topics:       string[][],
  summaries:    string[],
  isLegal:      boolean[],
  jurisdiction: string,
): Promise<{ stored: number; skipped: number; dropped: number }> {
  let stored  = 0;
  let skipped = 0;
  let dropped = 0;

  for (let i = 0; i < items.length; i++) {
    // Strategy 1: drop items Gemini flagged as non-legal.
    // Items from the LII scraper (contentType: 'case_law' | 'legislation') are
    // always kept regardless — they are authoritative legal sources by definition.
    if (!isLegal[i] && items[i].contentType === 'general') {
      dropped++;
      continue;
    }

    const item       = items[i];
    const itemTopics = topics[i] ?? ['General'];
    const excerpt    = item.excerpt;          // always store raw / og-enriched content
    const aiSummary  = summaries[i] || '';    // Gemini-written summary (empty if batch failed)

    try {
      await prisma.digestItem.upsert({
        where:  { url: item.url },
        update: {
          excerpt,
          // Only overwrite aiSummary when we have a fresh non-empty one — this
          // preserves a previously stored good summary if the classifier batch failed.
          ...(aiSummary ? { aiSummary } : {}),
        },
        create: {
          title:        item.title,
          url:          item.url,
          excerpt,
          aiSummary,
          source:       item.source,
          jurisdiction,
          topics:       itemTopics,
          contentType:  item.contentType,
          publishedAt:  item.publishedAt,
        },
      });
      stored++;
    } catch {
      skipped++;   // unique constraint or other DB error
    }
  }

  return { stored, skipped, dropped };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Ingest content for one or more jurisdictions.
 * @param jurisdictions  Array of jurisdiction codes, e.g. ['KE', 'ZA']
 */
export async function ingestJurisdictions(
  jurisdictions: string[],
): Promise<IngestResult[]> {
  const JURISDICTION_NAMES: Record<string, string> = {
    // Original Tier 1
    KE: 'Kenya',          ZA: 'South Africa',   NG: 'Nigeria',        GH: 'Ghana',
    TZ: 'Tanzania',       UG: 'Uganda',         RW: 'Rwanda',         ET: 'Ethiopia',
    GB: 'United Kingdom', US: 'United States',  IN: 'India',
    AU: 'Australia',      CA: 'Canada',         EU: 'European Union',
    // Expanded Africa
    MW: 'Malawi',         ZM: 'Zambia',         ZW: 'Zimbabwe',       BW: 'Botswana',
    LS: 'Lesotho',        MZ: 'Mozambique',     NA: 'Namibia',        SS: 'South Sudan',
    SD: 'Sudan',          SN: 'Senegal',        CI: 'Côte d\'Ivoire', CM: 'Cameroon',
    SL: 'Sierra Leone',   GM: 'Gambia',         LR: 'Liberia',        GN: 'Guinea',
    BI: 'Burundi',        DJ: 'Djibouti',       SO: 'Somalia',        MG: 'Madagascar',
    MU: 'Mauritius',      SC: 'Seychelles',     AO: 'Angola',         CG: 'Republic of Congo',
    CD: 'DR Congo',       NE: 'Niger',          ML: 'Mali',           BF: 'Burkina Faso',
    TG: 'Togo',           BJ: 'Benin',
  };

  const since = new Date(Date.now() - INGEST_WINDOW_MS);

  // Run at most 4 jurisdictions concurrently to prevent AllAfrica rate-limiting.
  // Each jurisdiction may have 1–2 AllAfrica feeds; 4 parallel = max 8 concurrent
  // AllAfrica requests before the per-feed sequential logic kicks in.
  const CONCURRENCY = 4;
  const results: IngestResult[] = [];
  for (let i = 0; i < jurisdictions.length; i += CONCURRENCY) {
    const batch = jurisdictions.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(async (code): Promise<IngestResult> => {
    const jName    = JURISDICTION_NAMES[code] ?? code;
    const t0       = Date.now();
    const errors: string[] = [];

    // ── 1. RSS feeds ──────────────────────────────────────────────────────────
    const rssItems = await pollRssFeeds(code, jName, since, errors);
    console.log(`[Ingest] ${code}: RSS → ${rssItems.length} item(s)`);

    // ── 2. LII Scraper (African only) ────────────────────────────────────────
    const scraperItems = await pollScraper(code, errors);
    console.log(`[Ingest] ${code}: Scraper → ${scraperItems.length} item(s)`);

    // ── 3. Tavily fallback (if RSS is thin) ──────────────────────────────────
    const recentRss = rssItems.filter(
      (r) => r.publishedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );
    const tavilyItems = recentRss.length < MIN_RSS_ITEMS
      ? await tavilyFallback(code, jName, errors)
      : [];
    if (tavilyItems.length > 0) {
      console.log(`[Ingest] ${code}: Tavily fallback → ${tavilyItems.length} item(s)`);
    }

    // ── 4. Merge and deduplicate ──────────────────────────────────────────────
    const seen  = new Set<string>();
    const allItems: RawItem[] = [];
    for (const item of [...rssItems, ...scraperItems, ...tavilyItems]) {
      const key = item.url.replace(/\/+$/, '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        allItems.push(item);
      }
    }

    if (allItems.length === 0) {
      return {
        jurisdiction: code, name: jName,
        rss: 0, scraper: 0, tavily: 0, stored: 0, skipped: 0, dropped: 0,
        elapsed_ms: Date.now() - t0, errors,
      };
    }

    // ── 5. Enrich thin excerpts by scraping og:description from article pages ─
    await enrichExcerpts(allItems);

    // ── 6. Classify topics + generate summaries; flag non-legal items ─────────
    const { topics, summaries, isLegal } = await classifyAndSummarise(allItems);

    // ── 7. Persist (non-legal general items are dropped here) ─────────────────
    const { stored, skipped, dropped } = await persistItems(allItems, topics, summaries, isLegal, code);

    console.log(
      `[Ingest] ${code}: ${stored} stored, ${skipped} skipped, ${dropped} dropped (non-legal)` +
      (errors.length ? ` | ${errors.length} error(s)` : ''),
    );

      return {
        jurisdiction: code,
        name:         jName,
        rss:          rssItems.length,
        scraper:      scraperItems.length,
        tavily:       tavilyItems.length,
        stored,
        skipped,
        dropped,
        elapsed_ms:   Date.now() - t0,
        errors,
      };
    }));
    results.push(...batchResults);
  }

  return results;
}

// ─── 14-day retention cleanup ─────────────────────────────────────────────────
//
// Called by the weekly cleanup cron (Sunday 03:00 UTC), before Monday's digest.
// Retention = 14 days: twice the longest digest window (7 days / weekly),
// giving a safe buffer so no edge case can delete items that a digest still needs.

export async function pruneDigestItems(): Promise<number> {
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.digestItem.deleteMany({
    where: { publishedAt: { lt: cutoff } },
  });
  console.log(`[digest-cleanup] Deleted ${count} DigestItem(s) older than 14 days`);
  return count;
}

/** Deletes expired DigestCache rows (expiresAt in the past). */
export async function pruneDigestCache(): Promise<number> {
  const { count } = await prisma.digestCache.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  console.log(`[digest-cleanup] Deleted ${count} expired DigestCache row(s)`);
  return count;
}

// ─── Query helpers (used by synthesis and dev preview) ────────────────────────

export interface DigestItemRow {
  id:           string;
  title:        string;
  url:          string;
  excerpt:      string;
  aiSummary:    string;
  source:       string;
  jurisdiction: string;
  topics:       string[];
  contentType:  string;
  publishedAt:  Date;
}

/**
 * Fetch items from the DB for given jurisdictions / topics / time window.
 * Returns rows ordered by publishedAt DESC.
 */
// Minimum items required from a topic-filtered query before we widen to all items.
const MIN_TOPIC_ITEMS = 5;

export async function queryDigestItems(params: {
  jurisdictions: string[];
  topics:        string[];
  sinceDate:     string;
  limit?:        number;
}): Promise<DigestItemRow[]> {
  const { jurisdictions, topics, sinceDate, limit = 40 } = params;

  const baseWhere = {
    jurisdiction: { in: jurisdictions },
    publishedAt:  { gte: new Date(sinceDate) },
  };

  // Strategy 2: topic-aware query with graceful fallback.
  // First try items that match the subscriber's chosen practice areas.
  // If fewer than MIN_TOPIC_ITEMS match (e.g. niche topic or cold DB),
  // fall back to all items for the jurisdiction window so the digest is
  // never empty — Gemini synthesis handles final relevance ranking.
  if (topics.length > 0) {
    const topicRows = await prisma.digestItem.findMany({
      where:   { ...baseWhere, topics: { hasSome: topics } },
      orderBy: { publishedAt: 'desc' },
      take:    limit,
    });

    if (topicRows.length >= MIN_TOPIC_ITEMS) {
      return topicRows as DigestItemRow[];
    }

    console.log(
      `[Briefly] Only ${topicRows.length} topic-matched item(s) for [${topics.join(', ')}] — ` +
      `widening to all items for ${jurisdictions.join(',')}`,
    );
  }

  // Fallback: all items for the jurisdiction window (no topic filter)
  const rows = await prisma.digestItem.findMany({
    where:   baseWhere,
    orderBy: { publishedAt: 'desc' },
    take:    limit,
  });

  return rows as DigestItemRow[];
}
