// src/services/legalDigestService.ts
//
// Generates the Briefly digest using real legal source searches first,
// then Gemini purely as a summariser/organiser — never as a searcher.
//
// For each jurisdiction ALL applicable sources run IN PARALLEL:
//
//   African (KE, ZA, NG, GH, TZ, UG, RW, ET)
//     → LII Scraper (Python service)  +  Gemini Google Search grounding
//
//   United States
//     → CourtListener REST API  +  Gemini Google Search grounding
//
//   United Kingdom
//     → legislation.gov.uk REST API  +  Gemini Google Search grounding
//
//   India / Australia / Canada / European Union
//     → Gemini Google Search grounding only
//
// Results from all sources are merged and URL-deduplicated before synthesis.
// Gemini is only used as a formatter/organiser — it never generates URLs.

import { GoogleGenAI } from '@google/genai';
import { searchAfricanLegalSources } from '@/lib/legalScraper';
import { searchJurisdictionDatabase } from '@/services/legalDatabaseService';
import prisma from '@/lib/prisma';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// ─── Unified jurisdiction config ──────────────────────────────────────────────

interface JurisdictionConfig {
  /** Human-readable name used in emails and log output */
  name: string;
  /** Jurisdiction hint passed to the African LII scraper service */
  scraperHint?: string;
  /** Jurisdiction ID for legalDatabaseService (native REST APIs, no Tavily key) */
  databaseId?: string;
  /**
   * Official court, parliament, and gazette domains used for the targeted
   * "court judgments and legislation" grounding query.  These are authoritative
   * government / legal-database sources — NOT news sites or law firms.
   */
  officialSites: string[];
  /**
   * General news outlet domains used for the "legal news" grounding query.
   * These are newspapers and independent legal-news publications.
   */
  newsSites: string[];
  /**
   * Law-firm blog / publication domains for the "law firm analysis" grounding query.
   */
  lawFirmSites: string[];
}

const JURISDICTION_CONFIG: Record<string, JurisdictionConfig> = {
  // ── African jurisdictions: LII Scraper + Gemini grounding ──────────────────
  KE: {
    name:        'Kenya',
    scraperHint: 'Kenya',
    officialSites: [
      'new.kenyalaw.org',       // primary case law & legislation repository
      'kenyalaw.org',
      'judiciary.go.ke',        // official court decisions
      'parliament.go.ke',       // bills and acts
      'kenyagazette.co.ke',     // Kenya Gazette notices
      'africanlii.org',
    ],
    newsSites: [
      'nation.africa',          // daily newspaper — high Google crawl frequency
      'standardmedia.co.ke',
      'theeastafrican.co.ke',
      'businessdailyafrica.com',
      'citizen.digital',
      'lsk.or.ke',              // Law Society of Kenya
      'allafrica.com',          // pan-African news aggregator
    ],
    lawFirmSites: [
      'bowmanslawyers.com',
      'cliffedekkerhofmeyr.com',
      'nortonrosefulbright.com',
      'mmaklaw.com',
      'coulsonharney.com',
    ],
  },
  ZA: {
    name:        'South Africa',
    scraperHint: 'South Africa',
    officialSites: [
      'saflii.org',
      'africanlii.org',
      'judiciary.gov.za',
      'parliament.gov.za',
      'gov.za',
    ],
    newsSites: [
      'dailymaverick.co.za',
      'timeslive.co.za',
      'businesslive.co.za',
      'legalbrief.co.za',
      'groundup.org.za',
    ],
    lawFirmSites: [
      'cliffedekkerhofmeyr.com',
      'bowmanslawyers.com',
      'werksmans.com',
      'nortonrosefulbright.com',
      'herbertsmithfreehills.com',
    ],
  },
  NG: {
    name:        'Nigeria',
    scraperHint: 'Nigeria',
    officialSites: [
      'nigerialii.org',
      'africanlii.org',
      'lawnigeria.com',
      'nass.gov.ng',
    ],
    newsSites: [
      'punchng.com',
      'vanguardngr.com',
      'premiumtimesng.com',
      'thenigerialawyer.com',
      'businessdayng.com',
    ],
    lawFirmSites: [
      'aelex.com',
      'templarslaw.com',
      'streetsimpson.com',
      'nortonrosefulbright.com',
    ],
  },
  GH: {
    name:        'Ghana',
    scraperHint: 'Ghana',
    officialSites: [
      'ghanalii.org',
      'africanlii.org',
      'judiciary.gov.gh',
      'parliament.gh',
    ],
    newsSites: [
      'myjoyonline.com',
      'graphic.com.gh',
      'ghanaweb.com',
    ],
    lawFirmSites: [
      'bowmanslawyers.com',
      'nortonrosefulbright.com',
      'reindorfchambers.com',
    ],
  },
  TZ: {
    name:        'Tanzania',
    scraperHint: 'Tanzania',
    officialSites: [
      'tanzlii.org',
      'africanlii.org',
      'judiciary.go.tz',
    ],
    newsSites: [
      'thecitizen.co.tz',
      'dailynews.co.tz',
      'ippmedia.com',
    ],
    lawFirmSites: [
      'mkono.com',
      'bowmanslawyers.com',
      'nortonrosefulbright.com',
    ],
  },
  UG: {
    name:        'Uganda',
    scraperHint: 'Uganda',
    officialSites: [
      'ulii.org',
      'africanlii.org',
      'judiciary.go.ug',
    ],
    newsSites: [
      'monitor.co.ug',
      'newvision.co.ug',
    ],
    lawFirmSites: [
      'kta-advocates.com',
      'bowmanslawyers.com',
      'nortonrosefulbright.com',
    ],
  },
  RW: {
    name:        'Rwanda',
    scraperHint: 'Rwanda',
    officialSites: [
      'rwandalii.org',
      'africanlii.org',
      'judiciary.gov.rw',
      'parliament.gov.rw',
    ],
    newsSites: [
      'newtimes.co.rw',
    ],
    lawFirmSites: [
      'bowmanslawyers.com',
      'dfdl.com',
      'cliffedekkerhofmeyr.com',
    ],
  },
  ET: {
    name:        'Ethiopia',
    scraperHint: 'Ethiopia',
    officialSites: [
      'africanlii.org',
      'chilot.me',
      'parliament.gov.et',
    ],
    newsSites: [
      'addisstandard.com',
      'thereporterethiopia.com',
      'ethiopianmonitor.com',
    ],
    lawFirmSites: [
      'bowmanslawyers.com',
      'nortonrosefulbright.com',
      'globallaw.com',
    ],
  },
  // ── Expanded Africa — AllAfrica RSS + AfricanLII grounding ─────────────────
  MW: {
    name: 'Malawi', scraperHint: 'Malawi',
    officialSites: ['africanlii.org', 'malawilii.org'],
    newsSites: ['allafrica.com', 'mwnation.com', 'nyasatimes.com'],
    lawFirmSites: ['bowmanslawyers.com', 'nortonrosefulbright.com'],
  },
  ZM: {
    name: 'Zambia', scraperHint: 'Zambia',
    officialSites: ['zambialii.org', 'africanlii.org', 'parliament.gov.zm'],
    newsSites: ['allafrica.com', 'lusakatimes.com', 'daily-mail.co.zm'],
    lawFirmSites: ['bowmanslawyers.com', 'nortonrosefulbright.com'],
  },
  ZW: {
    name: 'Zimbabwe', scraperHint: 'Zimbabwe',
    officialSites: ['zimlii.org', 'africanlii.org', 'veritaszim.net'],
    newsSites: ['allafrica.com', 'newsday.co.zw', 'thezimbabwean.co'],
    lawFirmSites: ['bowmanslawyers.com', 'scanlen.co.zw'],
  },
  BW: {
    name: 'Botswana', scraperHint: 'Botswana',
    officialSites: ['africanlii.org', 'botswanalii.org'],
    newsSites: ['allafrica.com', 'sundaystandard.info', 'mmegi.bw'],
    lawFirmSites: ['bowmanslawyers.com', 'nortonrosefulbright.com'],
  },
  LS: {
    name: 'Lesotho', scraperHint: 'Lesotho',
    officialSites: ['africanlii.org', 'lesotholii.org'],
    newsSites: ['allafrica.com', 'lestimes.com'],
    lawFirmSites: ['bowmanslawyers.com'],
  },
  MZ: {
    name: 'Mozambique', scraperHint: 'Mozambique',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'mozambiquenews.co.mz'],
    lawFirmSites: ['bowmanslawyers.com', 'nortonrosefulbright.com'],
  },
  NA: {
    name: 'Namibia', scraperHint: 'Namibia',
    officialSites: ['namibialii.org', 'africanlii.org', 'parliament.na'],
    newsSites: ['allafrica.com', 'namibian.com.na', 'namibiansun.com'],
    lawFirmSites: ['bowmanslawyers.com', 'enwc.co.na'],
  },
  SS: {
    name: 'South Sudan',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'radiotamazuj.org'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  SD: {
    name: 'Sudan',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'sudantribune.com'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  SN: {
    name: 'Senegal', scraperHint: 'Senegal',
    officialSites: ['africanlii.org', 'senegallii.org'],
    newsSites: ['allafrica.com', 'enqueteplus.com'],
    lawFirmSites: ['bowmanslawyers.com', 'nortonrosefulbright.com'],
  },
  CI: {
    name: "Côte d'Ivoire",
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'fratmat.info'],
    lawFirmSites: ['bowmanslawyers.com', 'nortonrosefulbright.com'],
  },
  CM: {
    name: 'Cameroon', scraperHint: 'Cameroon',
    officialSites: ['africanlii.org', 'cameroonlii.org'],
    newsSites: ['allafrica.com', 'cameroon-info.net'],
    lawFirmSites: ['bowmanslawyers.com', 'nortonrosefulbright.com'],
  },
  SL: {
    name: 'Sierra Leone', scraperHint: 'Sierra Leone',
    officialSites: ['africanlii.org', 'sierraleonelii.org'],
    newsSites: ['allafrica.com', 'awoko.org'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  GM: {
    name: 'Gambia', scraperHint: 'Gambia',
    officialSites: ['africanlii.org', 'gambialii.org'],
    newsSites: ['allafrica.com', 'foroyaa.net'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  LR: {
    name: 'Liberia', scraperHint: 'Liberia',
    officialSites: ['africanlii.org', 'liberialii.org'],
    newsSites: ['allafrica.com', 'frontpageafricaonline.com'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  GN: {
    name: 'Guinea',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'guineenews.org'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  BI: {
    name: 'Burundi',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'iwacu-burundi.org'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  DJ: {
    name: 'Djibouti',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  SO: {
    name: 'Somalia',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'garoweonline.com'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  MG: {
    name: 'Madagascar',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'madagascar-tribune.com'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  MU: {
    name: 'Mauritius', scraperHint: 'Mauritius',
    officialSites: ['africanlii.org', 'mauritiuslii.org', 'gov.mu'],
    newsSites: ['allafrica.com', 'lexpress.mu', 'defimedia.info'],
    lawFirmSites: ['bowmanslawyers.com', 'appleby.com'],
  },
  SC: {
    name: 'Seychelles',
    officialSites: ['africanlii.org', 'seychelleslii.org'],
    newsSites: ['allafrica.com', 'seychellesnewsagency.com'],
    lawFirmSites: ['appleby.com'],
  },
  AO: {
    name: 'Angola',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'angop.ao'],
    lawFirmSites: ['bowmanslawyers.com', 'nortonrosefulbright.com'],
  },
  CG: {
    name: 'Republic of Congo',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  CD: {
    name: 'DR Congo',
    officialSites: ['africanlii.org', 'leganet.cd'],
    newsSites: ['allafrica.com', 'radiookapi.net'],
    lawFirmSites: ['bowmanslawyers.com', 'nortonrosefulbright.com'],
  },
  NE: {
    name: 'Niger',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'lesahel.org'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  ML: {
    name: 'Mali',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'journaldumali.com'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  BF: {
    name: 'Burkina Faso',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'lefaso.net'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  TG: {
    name: 'Togo',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'icilome.com'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },
  BJ: {
    name: 'Benin',
    officialSites: ['africanlii.org'],
    newsSites: ['allafrica.com', 'lanationbenin.info'],
    lawFirmSites: ['nortonrosefulbright.com'],
  },

  // ── Common law — native API + Gemini grounding ────────────────────────────
  US: {
    name:       'United States',
    databaseId: 'us-federal',
    officialSites: [
      'courtlistener.com',
      'supremecourt.gov',
      'law.cornell.edu',
      'congress.gov',
      'scotusblog.com',
    ],
    newsSites: [
      'law360.com',
      'abajournal.com',
      'reuters.com',
      'bloomberg.com',
    ],
    lawFirmSites: [
      'skadden.com',
      'lw.com',
      'gibsondunn.com',
      'weil.com',
      'sidley.com',
    ],
  },
  GB: {
    name:       'United Kingdom',
    databaseId: 'uk-england-wales',
    officialSites: [
      'legislation.gov.uk',
      'bailii.org',
      'judiciary.gov.uk',
      'parliament.uk',
    ],
    newsSites: [
      'lawgazette.co.uk',
      'legalfutures.co.uk',
      'theguardian.com',
      'legalweek.com',
    ],
    lawFirmSites: [
      'allenovery.com',
      'freshfields.com',
      'cliffordchance.com',
      'linklaters.com',
      'slaughterandmay.com',
    ],
  },
  // ── Gemini grounding only ─────────────────────────────────────────────────
  IN: {
    name: 'India',
    officialSites: [
      'indiankanoon.org',
      'sci.gov.in',
      'legislative.gov.in',
    ],
    newsSites: [
      'barandbench.com',
      'livelaw.in',
      'thehindu.com',
    ],
    lawFirmSites: [
      'azbopartners.com',
      'cyrilshroff.com',
      'trilegal.com',
      'shardul.com',
    ],
  },
  AU: {
    name: 'Australia',
    officialSites: [
      'austlii.edu.au',
      'fedcourt.gov.au',
      'hcourt.gov.au',
      'legislation.gov.au',
    ],
    newsSites: [
      'lawyersweekly.com.au',
      'australianlawyer.com.au',
      'theaustralian.com.au',
    ],
    lawFirmSites: [
      'allens.com.au',
      'herbertsmithfreehills.com',
      'claytonutz.com',
      'minterellison.com',
    ],
  },
  CA: {
    name: 'Canada',
    officialSites: [
      'canlii.org',
      'scc-csc.ca',
      'laws-lois.justice.gc.ca',
    ],
    newsSites: [
      'thelawyersdaily.ca',
      'canadianlawyermag.com',
    ],
    lawFirmSites: [
      'mcmillan.ca',
      'osler.com',
      'blakes.com',
      'bennettjones.com',
    ],
  },
  EU: {
    name: 'European Union',
    officialSites: [
      'eur-lex.europa.eu',
      'curia.europa.eu',
      'europarl.europa.eu',
    ],
    newsSites: [
      'eulawlive.com',
      'politico.eu',
      'euractiv.com',
    ],
    lawFirmSites: [
      'allenovery.com',
      'freshfields.com',
      'linklaters.com',
      'cleary.com',
    ],
  },
};

/** Human-readable names for all supported Briefly jurisdiction codes */
export const JURISDICTIONS: Record<string, { name: string }> = Object.fromEntries(
  Object.entries(JURISDICTION_CONFIG).map(([code, cfg]) => [code, { name: cfg.name }]),
);

// ─── Shared result shape ──────────────────────────────────────────────────────

export interface RawResult {
  title:        string;
  url:          string;
  snippet:      string;
  date?:        string;
  source:       string;   // e.g. "Kenya Law", "CourtListener", "saflii.org"
  jurisdiction: string;   // human name, e.g. "Kenya"
  type:         'case_law' | 'legislation' | 'general';
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getSinceDate(frequency: 'daily' | 'weekly'): string {
  const ms = frequency === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms).toISOString();
}

function sinceDateShort(sinceDate: string): string {
  return sinceDate.slice(0, 10);
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function filterByDate(results: RawResult[], sinceDate: string): RawResult[] {
  const cutoff = new Date(sinceDate).getTime();
  return results.filter((r) => {
    if (!r.date) return true;
    const d = new Date(r.date).getTime();
    return isNaN(d) || d >= cutoff;
  });
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, '')}${u.search}`;
  } catch {
    return url.replace(/\/+$/, '');
  }
}

// ─── Gemini Google Search grounding ──────────────────────────────────────────
//
// Runs a Gemini call with { googleSearch: {} } grounding.
// URLs come ONLY from groundingChunks — real URLs verified by Google.
//
// Query design:
//   - NO `site:` operators: they cause 0 results on infrequently-crawled legal
//     databases when combined with a recency requirement.
//   - NO `after:` operator: same problem — Google finds nothing on niche sites.
//   - Instead we use a specific, natural-language legal query so Google finds
//     actual court rulings, gazette notices, and legislation — not law firm ads.
//   - Domain filter is applied AFTER, to the returned groundingChunks only,
//     so we accept results only from the sites we trust.
//   - `vertexaisearch.cloud.google.com` proxy URLs are resolved via the chunk
//     title (which contains the real domain) so the domain filter still works.

/**
 * Runs a Gemini Google Search grounding call.
 *
 * IMPORTANT — how Gemini grounding works:
 *   Gemini does NOT pass your text to Google as a raw query string.
 *   It reads the prompt and generates its own Google Search query.
 *   Putting `site:X OR site:Y` in the text may or may not be passed through.
 *   The most reliable approach is a short, natural-language prompt that names
 *   specific sources so Gemini knows where to look — no search operators needed.
 *
 * @param prompt         Natural-language instruction for Gemini (what to find + where)
 * @param jName          Jurisdiction name for RawResult labelling
 * @param maxResults     Maximum chunks to return
 * @param allowedDomains Whitelist of hostname suffixes — chunks whose hostname does not
 *                       match at least one entry are discarded. Pass undefined to accept all.
 */
async function searchViaGeminiGrounding(
  prompt:          string,
  jName:           string,
  maxResults:      number = 8,
  allowedDomains?: string[],
): Promise<RawResult[]> {
  const today = getTodayLabel();

  const response = await genAI.models.generateContent({
    model:    process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
    // Keep contents short — verbose prompts cause Gemini to generate poor Google queries.
    contents: `Today is ${today}. ${prompt}`,
    config: {
      tools:       [{ googleSearch: {} }],
      temperature: 0,
    },
  });

  const chunks   = response.candidates?.[0]?.groundingMetadata?.groundingChunks   ?? [];
  const supports = response.candidates?.[0]?.groundingMetadata?.groundingSupports ?? [];
  console.log(`[Briefly] grounding "${prompt.slice(0, 80)}": ${chunks.length} chunk(s)`);

  const chunkIndex: { url: string; title: string }[] = chunks.map((c: any) => ({
    url:   c.web?.uri   ?? '',
    title: c.web?.title ?? '',
  }));

  const seen    = new Set<string>();
  const results: RawResult[] = [];

  for (const support of supports as any[]) {
    const indices: number[] = support.groundingChunkIndices ?? [];
    const snippet: string   = support.segment?.text ?? '';

    for (const idx of indices) {
      const chunk = chunkIndex[idx];
      if (!chunk?.url || seen.has(chunk.url)) continue;
      // Skip bare Vertex AI proxy URLs with no title
      if (chunk.url.includes('vertexaisearch.cloud.google.com') && !chunk.title) continue;

      seen.add(chunk.url);
      let hostname = chunk.url;
      try { hostname = new URL(chunk.url).hostname.replace(/^www\./, ''); } catch { /* keep url as label */ }

      // Hard blocklist — always rejected regardless of URL type or whitelist.
      // These are non-legal platforms that Gemini sometimes includes via proxy URLs
      // (where the hostname check cannot reach the real domain).  We also check the
      // title because proxy URLs conceal the real hostname.
      const BLOCKED: string[] = [
        'youtube.com', 'youtu.be',
        'reddit.com', 'twitter.com', 'x.com', 'facebook.com',
        'instagram.com', 'tiktok.com', 'linkedin.com',
        'mexc.com', 'vellum.co',
      ];
      const urlLower   = chunk.url.toLowerCase();
      const titleLower = (chunk.title || '').toLowerCase();
      const blocked = BLOCKED.some(
        (d) => urlLower.includes(d) || titleLower.includes(d.split('.')[0] + '.'),
      );
      if (blocked) continue;

      // Domain whitelist check — applies to direct URLs only.
      // Vertex AI proxy URLs (vertexaisearch.cloud.google.com) wrap the real source
      // and cannot be inspected by hostname; they pass the whitelist so legal content
      // from e.g. new.kenyalaw.org isn't silently dropped.
      if (
        allowedDomains &&
        allowedDomains.length > 0 &&
        !chunk.url.includes('vertexaisearch.cloud.google.com')
      ) {
        const normalizedAllowed = allowedDomains.map((d) => d.toLowerCase().replace(/^www\./, ''));
        const hostLower = hostname.toLowerCase();
        const allowed = normalizedAllowed.some(
          (d) => hostLower === d || hostLower.endsWith('.' + d),
        );
        if (!allowed) continue;
      }

      // For Vertex AI proxy URLs the real hostname is hidden; derive a readable
      // source label from the page title instead (e.g. "Case Name | Kenya Law"
      // → "Kenya Law", "Article - Bowmans" → "Bowmans").
      let sourceLabel = hostname;
      if (chunk.url.includes('vertexaisearch.cloud.google.com') && chunk.title) {
        const parts = chunk.title.split(/[\|\-–]/).map((s: string) => s.trim()).filter(Boolean);
        // Last segment usually contains the site name; use it if it's short (≤30 chars)
        const last = parts[parts.length - 1] ?? '';
        sourceLabel = (last.length > 0 && last.length <= 30) ? last : parts[0] || hostname;
      }

      results.push({
        title:        chunk.title || prompt,
        url:          chunk.url,
        snippet:      snippet.slice(0, 300),
        source:       sourceLabel,
        jurisdiction: jName,
        type:         'general',
      });
    }
  }

  return results.slice(0, maxResults);
}

// ─── Timeout helper ───────────────────────────────────────────────────────────
//
// Races a promise against a timeout. On timeout the promise rejects with an
// Error — the caller's .catch() handles it gracefully, so no results are lost
// from other parallel sources.

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

// ─── Per-jurisdiction parallel search ────────────────────────────────────────

/** Returns a human-readable date-window string to embed directly in queries. */
function buildDateWindow(sinceDate: string): string {
  const since = new Date(sinceDate);
  const now   = new Date();
  const diffMs   = now.getTime() - since.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const fmtShort = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (diffDays <= 1.5) {
    // Daily window: "27 March 2026"
    return fmtShort(now);
  }
  // Weekly window: "20 March 2026 to 27 March 2026"
  return `${fmtShort(since)} to ${fmtShort(now)}`;
}

async function searchOneJurisdiction(
  baseQuery:  string,
  code:       string,
  sinceDate?: string,
): Promise<RawResult[]> {
  const config = JURISDICTION_CONFIG[code];
  if (!config) return [];

  const jName      = config.name;
  const dateWindow = sinceDate
    ? buildDateWindow(sinceDate)
    : new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  // ISO date string for scraper queries — e.g. "2026-03-20".
  // AfricanLII / Peachjam search APIs understand the `after:` operator and
  // the `date:` prefix when present in the query string, which filters results
  // to documents published on or after that date.  This is far more reliable
  // than embedding a human-readable date (which is just treated as a keyword).
  const isoSince = sinceDate ? sinceDate.slice(0, 10) : new Date().toISOString().slice(0, 10);

  // Named sources for grounding prompts.
  // Gemini generates its own Google Search query from the prompt text — naming
  // specific sources is more reliable than site: operators.
  const officialSourceNames = config.officialSites.slice(0, 4).join(', ');
  const newsOutletNames     = config.newsSites.slice(0, 4).join(', ');
  const firmNames = config.lawFirmSites
    .slice(0, 3)
    .map((s) => s.replace(/\.(com|co\.\w+|org|net|go\.\w+)$/, '').replace(/-/g, ' '))
    .join(', ');

  // Trusted domains per query type — grounding chunks from outside these sets
  // are blocked (for direct URLs) to prevent off-topic sites leaking in.
  const trustedOfficial = [...config.officialSites];
  const trustedNews     = [...config.newsSites];
  const trustedFirms    = [...config.lawFirmSites];
  // The "all" set is used where we want any trusted source (e.g. scraper cutoff check)
  const trustedAll      = [...config.officialSites, ...config.newsSites, ...config.lawFirmSites];

  const mapScraper = (r: any, type: RawResult['type']): RawResult => ({
    title: r.title, url: r.url, snippet: r.snippet,
    date: r.date, source: r.platformName, jurisdiction: jName, type,
  });

  // For weekly digests the scraper should return more results (7 days of content
  // vs 1 day), and the Gemini grounding queries should cover a broader window.
  // We detect this by checking how far back sinceDate is.
  const diffDays = sinceDate
    ? (Date.now() - new Date(sinceDate).getTime()) / (1000 * 60 * 60 * 24)
    : 1;
  const isWeekly = diffDays > 2;
  const scraperCaseMax    = isWeekly ? 15 : 10;
  const scraperGazetteMax = isWeekly ? 10 : 8;
  const groundingNewsMax  = isWeekly ? 10 : 8;
  const groundingFirmsMax = isWeekly ? 6  : 4;

  // ── Task 1: LII Scraper — recent court judgments ──────────────────────────
  // The scraper queries Kenya Law, AfricanLII, SAFLII and the other LII databases
  // directly — it is the authoritative source for case law and legislation.
  // Practice areas (baseQuery) are included in the query to surface relevant cases.
  // A 90-day client-side cutoff is applied after the results come back because
  // AfricanLII/Peachjam does not reliably honour the `after:` date operator.
  const scraperCasesTask: Promise<RawResult[]> = config.scraperHint
    ? withTimeout(
        searchAfricanLegalSources(
          `${jName} court judgment ruling ${baseQuery} after:${isoSince}`,
          { jurisdictionHint: config.scraperHint, maxResults: scraperCaseMax },
        ),
        30_000, `LII scraper cases [${code}]`,
      )
        .then((res) => res.legalSources.slice(0, isWeekly ? 10 : 6).map((r) => mapScraper(r, 'case_law')))
        .catch((err) => { console.error(`[Briefly] scraper cases [${code}]:`, err.message); return []; })
    : Promise.resolve([]);

  // ── Task 2: LII Scraper — gazette / legislation ───────────────────────────
  const scraperGazetteTask: Promise<RawResult[]> = config.scraperHint
    ? withTimeout(
        searchAfricanLegalSources(
          `${jName} gazette notice legislation ${baseQuery} after:${isoSince}`,
          { jurisdictionHint: config.scraperHint, maxResults: scraperGazetteMax },
        ),
        30_000, `LII scraper gazette [${code}]`,
      )
        .then((res) => [
          ...res.legalSources.slice(0, isWeekly ? 6 : 4).map((r) => mapScraper(r, 'legislation')),
          ...res.researchSources.slice(0, isWeekly ? 6 : 4).map((r) => mapScraper(r, 'legislation')),
        ])
        .catch((err) => { console.error(`[Briefly] scraper gazette [${code}]:`, err.message); return []; })
    : Promise.resolve([]);

  const freqLabel = isWeekly ? 'weekly' : 'daily';

  // ── Task 3: Gemini grounding — official court judgments & legislation ────────
  // For African jurisdictions the LII scraper already covers cases/legislation
  // from authoritative sources (AfricanLII, KenyaLaw, etc.), and Gemini Search
  // cannot reliably index content on low-crawl-frequency court portals like
  // new.kenyalaw.org or judiciary.go.ke — so we skip this task for those jurisdictions.
  //
  // For non-African jurisdictions (US, GB, IN, AU, CA, EU) there is no scraper,
  // so grounding fills the authoritative-source gap.  No domain whitelist is applied
  // here because proxy URLs from those sites bypass it anyway.
  const officialPrompt =
    `Find the most recent ${jName} court judgments, rulings, and legislation. ` +
    `Focus on content from ${dateWindow}. ` +
    `For each result include: case name or title, citation or reference number, court or authority, and date. ` +
    `Return only official court decisions, statutes, and gazette notices — do NOT include law firm commentary or news articles.`;
  const groundingOfficialTask: Promise<RawResult[]> = config.scraperHint
    ? Promise.resolve([])   // scraper handles cases/legislation for African jurisdictions
    : withTimeout(
        searchViaGeminiGrounding(officialPrompt, jName, groundingNewsMax, undefined),
        40_000, `Gemini official grounding [${code}]`,
      ).catch((err) => { console.error(`[Briefly] official grounding [${code}]:`, err.message); return []; });

  // ── Task 4: Gemini grounding — legal news from outlets ────────────────────
  // Targets newspapers and independent legal publications. Same relaxed approach
  // as official grounding — synthesis filters by date.
  const newsPrompt =
    `Find the most recent ${jName} legal news from ${newsOutletNames}. ` +
    `Focus on content from ${dateWindow}. ` +
    `Topics: court verdicts, new laws, regulatory changes, government legal actions, law reform, legal sector news. ` +
    `For each article include: headline, publication, date published, and the key legal development.`;
  const groundingNewsTask: Promise<RawResult[]> = withTimeout(
    searchViaGeminiGrounding(newsPrompt, jName, isWeekly ? 6 : 4, trustedNews),
    40_000, `Gemini news grounding [${code}]`,
  ).catch((err) => { console.error(`[Briefly] news grounding [${code}]:`, err.message); return []; });

  // ── Task 5: Gemini grounding — law firm analysis ──────────────────────────
  // Uses current year (not a specific week) because firm alerts for African
  // jurisdictions are indexed with a delay; a narrow window returns 0 chunks.
  const currentYear = new Date().getFullYear();
  const firmsPrompt =
    `Find the most recent ${jName} law firm client alerts, legal updates, and briefings ` +
    `published in ${currentYear} by ${firmNames}. ` +
    `Return only ${currentYear} publications — do not include articles from previous years. ` +
    `For each: law firm name, article title, publication date, and the key legal development covered.`;
  const groundingFirmsTask: Promise<RawResult[]> = withTimeout(
    searchViaGeminiGrounding(firmsPrompt, jName, groundingFirmsMax, trustedFirms),
    40_000, `Gemini firms grounding [${code}]`,
  ).catch((err) => { console.error(`[Briefly] firms grounding [${code}]:`, err.message); return []; });

  // ── Task 6: Native REST API (US CourtListener / GB legislation.gov.uk) ────
  const nativeApiTask: Promise<RawResult[]> = config.databaseId
    ? withTimeout(
        searchJurisdictionDatabase(`${jName} ${baseQuery}`, config.databaseId, sinceDate),
        10_000, `native API [${code}]`,
      )
        .then((res) => res.results.slice(0, 5).map((r) => ({
          title: r.title, url: r.url, snippet: r.excerpt,
          date: r.date, source: r.source, jurisdiction: jName, type: 'general' as const,
        })))
        .catch((err) => { console.error(`[Briefly] native API [${code}]:`, err.message); return []; })
    : Promise.resolve([]);

  // ── Run all tasks in parallel ──────────────────────────────────────────────
  const [scraperCases, scraperGazette, groundingOfficial, groundingNews, groundingFirms, nativeApi] =
    await Promise.all([scraperCasesTask, scraperGazetteTask, groundingOfficialTask, groundingNewsTask, groundingFirmsTask, nativeApiTask]);

  console.log(
    `[Briefly] ${code}: scraperCases=${scraperCases.length} scraperGazette=${scraperGazette.length}` +
    ` official=${groundingOfficial.length} news=${groundingNews.length} firms=${groundingFirms.length} native=${nativeApi.length}`,
  );

  // ── Deduplicate helper ─────────────────────────────────────────────────────
  const seen = new Set<string>();
  const dedup = (batch: RawResult[]) =>
    batch.filter((r) => {
      if (!r.url) return false;
      const k = normalizeUrl(r.url);
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });

  // ── Separate scraper (legal DB) from live-web results ─────────────────────
  //
  // AfricanLII/Peachjam ignores the `after:` date operator and returns top-relevance
  // results from any year.  We use a year-based filter instead of a day-based cutoff:
  //   Keep results from the current year OR the previous year.
  // This blocks genuinely stale cases (e.g. 2012, 2017, 2023) while tolerating the
  // typical weeks-long LII indexing lag (a judgment filed in late 2025 may be indexed
  // in early 2026 but still carries its original 2025 date).
  // Undated entries always pass through — they are likely freshly added records.
  const currentCalYear = new Date().getFullYear();
  const scraperAll   = dedup([...scraperCases, ...scraperGazette]).filter((r) => {
    if (!r.date) return true;                          // keep undated
    const d = new Date(r.date);
    if (isNaN(d.getTime())) return true;               // keep unparseable
    return d.getFullYear() >= currentCalYear - 1;      // current or previous year
  });

  // Grounding + native API: accept all, synthesis filters by date.
  // We do NOT apply a strict client-side date filter here because grounding chunks
  // often lack a `date` field and would be incorrectly passed or dropped.
  const liveRaw  = dedup([...nativeApi, ...groundingOfficial, ...groundingNews, ...groundingFirms]);

  // Per-source cap: prevent any single site from taking more than 2 slots in
  // the live results to preserve source diversity.
  // Grounding results often come through Vertex AI proxy URLs
  // (vertexaisearch.cloud.google.com) — they all share the same hostname so a
  // hostname-based cap would collapse all proxy results to 2.  Instead we use
  // r.source (the human-readable site name extracted from the page title) as the
  // cap key for proxy URLs, and the real hostname for direct URLs.
  const domainCount = new Map<string, number>();
  const MAX_PER_DOMAIN = 2;
  const liveAll = liveRaw.filter((r) => {
    let capKey = r.url;
    try {
      const hostname = new URL(r.url).hostname.replace(/^www\./, '');
      capKey = hostname.includes('vertexaisearch')
        ? (r.source || hostname).toLowerCase().trim()   // use source label for proxy URLs
        : hostname;
    } catch { /* keep original */ }
    const count = domainCount.get(capKey) ?? 0;
    if (count >= MAX_PER_DOMAIN) return false;
    domainCount.set(capKey, count + 1);
    return true;
  });

  const merged = [...scraperAll, ...liveAll];

  if (merged.length === 0) {
    console.log(`[Briefly] ${code}: no results from any source`);
    return [];
  }

  console.log(
    `[Briefly] ${code}: returning ${merged.length} result(s)` +
    ` (${scraperAll.length} legal DB + ${liveAll.length} live web)`,
  );
  return merged;
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface DigestSection {
  category: string;
  items: {
    title:          string;
    summary:        string;
    sourceUrl?:     string;
    sourceName?:    string;
    /** Set when this item falls outside the subscriber's primary window (e.g. "3 days ago"). Rendered as a small tag in the email. */
    backdatedLabel?: string;
  }[];
}

export interface DigestContent {
  headline:    string;
  summary:     string;
  sections:    DigestSection[];
  sources:     { title: string; url: string }[];
  generatedAt: string;
  /**
   * Set when the digest extended beyond the subscriber's primary window.
   * Value = number of extra days added (currently always 3).
   * Used to stamp per-item backdatedLabel tags — items within the primary
   * window get no tag; only out-of-window items are labelled.
   */
  backdatedDays?: number;
}

// ─── Search-only export (used by dev preview endpoint) ───────────────────────

export interface JurisdictionSearchResult {
  code:       string;
  name:       string;
  /** All source types attempted for this jurisdiction */
  sources:    string[];
  elapsed_ms: number;
  results:    RawResult[];
  error?:     string;
}

/**
 * Runs only the search phase (no Gemini synthesis).
 * Returns per-jurisdiction results useful for debugging and dev preview.
 */
export async function runDigestSearch(
  topics:        string[],
  jurisdictions: string[],
  frequency:     'daily' | 'weekly' = 'daily',
): Promise<JurisdictionSearchResult[]> {
  const topicList   = topics.join(', ') || 'general legal developments';
  const sinceDate   = getSinceDate(frequency);
  const searchQuery = `${topicList} legal developments`;

  const tasks = jurisdictions.map(async (code): Promise<JurisdictionSearchResult> => {
    const config = JURISDICTION_CONFIG[code];
    const jName  = config?.name ?? code;
    const t0     = Date.now();

    // Collect which source types are configured for this jurisdiction
    const sources: string[] = [];
    if (config?.scraperHint) sources.push('lii_scraper');
    if (config?.databaseId)  sources.push('native_api');
    if (config)              sources.push('gemini_grounding');
    if (sources.length === 0) sources.push('none');

    try {
      const results = await searchOneJurisdiction(searchQuery, code, sinceDate);
      return { code, name: jName, sources, elapsed_ms: Date.now() - t0, results };
    } catch (err: any) {
      return { code, name: jName, sources, elapsed_ms: Date.now() - t0, results: [], error: err.message };
    }
  });

  return Promise.all(tasks);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateLegalDigest(
  topics:        string[],
  jurisdictions: string[],
  frequency:     'daily' | 'weekly',
): Promise<DigestContent> {
  const sinceDate   = getSinceDate(frequency);
  const nowIso      = new Date().toISOString();
  const todayLabel  = getTodayLabel();
  const timeframe   = frequency === 'daily' ? 'the past 24 hours' : 'the past 7 days';
  const topicList   = topics.length > 0 ? topics.join(', ') : 'general legal developments';
  const searchQuery = `${topicList} legal developments`;

  // ── 1. Search all jurisdictions in parallel ────────────────────────────────
  const searchTasks = jurisdictions.map((code) =>
    searchOneJurisdiction(searchQuery, code, sinceDate).catch((err) => {
      console.error(`[Briefly] search error for ${code}:`, err);
      return [] as RawResult[];
    }),
  );

  const searchResults = await Promise.allSettled(searchTasks);
  const allResults: RawResult[] = searchResults.flatMap((r) =>
    r.status === 'fulfilled' ? r.value : [],
  );

  const jurisdictionNames = jurisdictions
    .map((c) => JURISDICTION_CONFIG[c]?.name)
    .filter(Boolean)
    .join(', ');

  // ── 2. Fallback if no results were found ──────────────────────────────────
  if (allResults.length === 0) {
    return {
      headline:    `Legal digest for ${jurisdictionNames || 'your jurisdictions'}`,
      summary:     `No new legal developments could be retrieved at this time. Please check back later.`,
      sections:    [],
      sources:     [],
      generatedAt: new Date().toISOString(),
    };
  }

  // ── 3. Ask Gemini to synthesise a digest from the real results ─────────────
  //    Gemini acts as formatter/organiser only — no searching, no URL generation.
  const synthesisPrompt = `You are a legal editor organising pre-fetched search results into a ${timeframe} email digest for practising attorneys.

TODAY: ${todayLabel}
DIGEST WINDOW: ${sinceDate} to ${nowIso.slice(0, 10)} (${timeframe})
TOPICS: ${topicList}
JURISDICTIONS: ${jurisdictionNames}

STRICT RULES:
1. This is a ${timeframe} digest — ONLY include items that were published or decided within the digest window (${sinceDate} to ${nowIso.slice(0, 10)}).
2. Discard any item whose date clearly falls outside this window (e.g. a 2025 article in a daily 2026 digest).
3. Undated items: include them — they likely represent freshly indexed content.
4. Do NOT search for additional information. Do NOT generate, guess, or modify any URLs.
5. For "sourceUrl": copy the "url" field EXACTLY from the results. Do not alter it.
6. Write all summaries in plain English suitable for practising attorneys (2 concise sentences each).
7. Each item title must include the jurisdiction name if not already present.

CLASSIFICATION:
- Court judgment / ruling / order → "Case Law Updates"
- Statute, regulation, statutory instrument, gazette notice, government action → "Regulatory Changes"
- News article, law firm alert, commentary, industry update → "Legal News"

SEARCH RESULTS (${allResults.length} items from official legal databases, court portals, and verified news sources):
${JSON.stringify(allResults, null, 2)}

Return ONLY valid JSON — no markdown fences, no extra text:
{
  "headline": "Single sentence: the most significant legal development in this digest",
  "summary": "2–3 sentences: executive overview of key developments across all jurisdictions",
  "sections": [
    {
      "category": "Case Law Updates",
      "items": [
        {
          "title": "case or article title (include jurisdiction)",
          "summary": "2-sentence plain-English summary based on the snippet",
          "sourceName": "source field from results",
          "sourceUrl": "exact url from results — copy verbatim, do not modify"
        }
      ]
    }
  ],
  "sources": [
    { "title": "title from results", "url": "exact url from results" }
  ]
}`;

  const response = await withTimeout(
    genAI.models.generateContent({
      model:    process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: synthesisPrompt,
      config: { temperature: 0.2 },
    }),
    120_000,
    'Gemini digest synthesis',
  );

  const text = response.text?.trim() || '';
  let cleanText = text;
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // Build verified URL sets from real search results
  const verifiedUrls     = new Set(allResults.map((r) => normalizeUrl(r.url)).filter(Boolean));
  const normalToOriginal = new Map<string, string>();
  for (const r of allResults) {
    if (r.url) normalToOriginal.set(normalizeUrl(r.url), r.url);
  }

  try {
    const parsed = JSON.parse(cleanText) as DigestContent;
    parsed.generatedAt = new Date().toISOString();

    // ── 4. Validate every sourceUrl against real search results ───────────────
    // Gemini may merge two items and output "url1 | url2" — split and take the
    // first verified URL rather than discarding the whole entry.
    for (const section of parsed.sections) {
      for (const item of section.items) {
        if (item.sourceUrl) {
          const parts = item.sourceUrl.split(' | ').map(u => u.trim()).filter(Boolean);
          const firstVerified = parts.find(u => verifiedUrls.has(normalizeUrl(u)));
          if (firstVerified) {
            item.sourceUrl = normalToOriginal.get(normalizeUrl(firstVerified)) ?? firstVerified;
          } else {
            item.sourceUrl = undefined;
          }
        }
      }
    }

    // ── 5. Build authoritative sources list from real results only ────────────
    const seenUrls = new Set<string>();
    parsed.sources = [];
    for (const r of allResults) {
      if (r.url && !seenUrls.has(r.url)) {
        parsed.sources.push({ title: r.title, url: r.url });
        seenUrls.add(r.url);
      }
    }

    return parsed;
  } catch {
    // Graceful fallback: build a basic digest directly from raw results
    const caseItems = allResults.filter((r) => r.type === 'case_law');
    const legItems  = allResults.filter((r) => r.type === 'legislation');
    const restItems = allResults.filter((r) => r.type === 'general');

    const toSection = (category: string, items: RawResult[]): DigestSection => ({
      category,
      items: items.map((r) => ({
        title:      r.title,
        summary:    r.snippet,
        sourceName: r.source,
        sourceUrl:  r.url,
      })),
    });

    return {
      headline:    `Legal digest — ${jurisdictionNames}`,
      summary:     `${allResults.length} legal developments retrieved from official databases across ${jurisdictionNames}.`,
      sections: [
        ...(caseItems.length  > 0 ? [toSection('Case Law Updates',   caseItems)]  : []),
        ...(legItems.length   > 0 ? [toSection('Regulatory Changes', legItems)]   : []),
        ...(restItems.length  > 0 ? [toSection('Legal News',         restItems)]  : []),
      ],
      sources:     allResults.map((r) => ({ title: r.title, url: r.url })),
      generatedAt: new Date().toISOString(),
    };
  }
}

// ─── DB-based synthesis ───────────────────────────────────────────────────────
//
// Reads pre-ingested items from the DigestItem table and synthesises from them.
// Live search is intentionally never triggered from this path — all content
// enters via the ingestion cron (digest-ingest).  If the DB is sparse the
// digest will be shorter but will never contain live/real-time fetched content.

// ── Deduplication helpers ────────────────────────────────────────────────────
// Two media houses often cover the same story. We deduplicate in two passes:
//   Pass 1 — exact URL: trivially catches reposts of the same article.
//   Pass 2 — title Jaccard similarity: catches same story, different headlines.
//            Threshold 0.65 + minimum 3 shared words avoids false positives on
//            short titles that share only jurisdiction/court words (e.g. "Kenya
//            Court" appears in many unrelated cases).
// Remaining semantic duplicates (different titles, same event) are handled by
// Gemini — see prompt rule below.

const STOP_WORDS = new Set([
  'the','a','an','in','on','at','to','for','of','and','or','is','are',
  'was','were','by','with','from','as','its','it','this','that','has',
  'have','been','be','will','new','over',
]);

function titleWordSet(title: string): Set<string> {
  return new Set(
    title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const w of a) if (b.has(w)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

function deduplicateByTitle<T extends { title: string; url: string }>(
  items: T[],
  threshold = 0.65,
  minSharedWords = 3,
): T[] {
  // Pass 1: exact URL dedup
  const seenUrls = new Set<string>();
  const urlDeduped = items.filter((item) => {
    if (seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });

  // Pass 2: title similarity dedup
  const selected: Array<{ item: T; words: Set<string> }> = [];
  for (const item of urlDeduped) {
    const words = titleWordSet(item.title);
    const isDuplicate = selected.some((s) => {
      let shared = 0;
      for (const w of words) if (s.words.has(w)) shared++;
      return shared >= minSharedWords && jaccardSimilarity(s.words, words) >= threshold;
    });
    if (!isDuplicate) selected.push({ item, words });
  }
  return selected.map((s) => s.item);
}

// Maximum unique stories to include per digest email.
const MAX_DIGEST_ITEMS = 12;

export async function generateLegalDigestFromDB(
  topics:        string[],
  jurisdictions: string[],
  frequency:     'daily' | 'weekly',
): Promise<{ digest: DigestContent; source: 'db'; itemCount: number }> {
  const { queryDigestItems } = await import('@/services/digestIngestService');

  const sinceDate = getSinceDate(frequency);
  let effectiveSinceDate = sinceDate;
  let backdatedDays: number | undefined;

  // ── Split jurisdictions into DB-backed (Tier 1+2) and grounding-only ────────
  // Supported jurisdictions have configured RSS/scraper/Tavily feeds and are
  // queried from the DigestItem DB table.  Unsupported jurisdictions (any other
  // ISO code the subscriber selected) are handled by live Gemini grounding at
  // synthesis time — no feeds are configured so the DB path would return nothing.
  const supportedJurs   = jurisdictions.filter(j => JURISDICTION_CONFIG[j] !== undefined);
  const unsupportedJurs = jurisdictions.filter(j => JURISDICTION_CONFIG[j] === undefined);

  // Query the primary window first.  Only query supported jurisdictions —
  // unsupported ones have no ingested feeds and are handled later by Gemini grounding.
  const MIN_ITEMS_BEFORE_BACKDATE = 10;
  let rawItems = supportedJurs.length > 0
    ? await queryDigestItems({ jurisdictions: supportedJurs, topics, sinceDate, limit: 60 })
    : [];
  const primaryItems = deduplicateByTitle(rawItems);

  // items will be finalised below — declare here so the rest of the function can use it.
  let items: typeof primaryItems;

  // ── Backdate fallback — two-step ──────────────────────────────────────────
  // If the primary window is thin (< 10 items), supplement from the DB using
  // progressively wider windows — purely from the ingest pipeline, no live search.
  //
  // Step 1: extend by 3 days.
  // Step 2: if still thin, extend to a full 7-day (one-week) window.
  //
  // Ordering guarantee: primary-window items ALWAYS come first in the final list;
  // backdated items fill the remaining slots up to MAX_DIGEST_ITEMS.
  const buildItemsFromExtendedQuery = async (extendDays: number) => {
    effectiveSinceDate = new Date(
      new Date(sinceDate).getTime() - extendDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    rawItems = await queryDigestItems({ jurisdictions: supportedJurs, topics, sinceDate: effectiveSinceDate, limit: 60 });
    const allDeduped      = deduplicateByTitle(rawItems);
    const primaryWindowMs = new Date(sinceDate).getTime();
    const inWindow  = allDeduped.filter(item => new Date(item.publishedAt).getTime() >= primaryWindowMs);
    const backdated = allDeduped.filter(item => new Date(item.publishedAt).getTime() < primaryWindowMs);
    return { inWindow, backdated, allDeduped };
  };

  if (supportedJurs.length > 0 && primaryItems.length < MIN_ITEMS_BEFORE_BACKDATE) {
    // Step 1: 3-day extension
    console.log(
      `[Briefly] Primary window thin (${primaryItems.length} item(s)) for ${supportedJurs.join(',')} — ` +
      `trying 3-day extension (since: ${new Date(Date.now() - 3 * 86400_000).toISOString().slice(0, 10)})`,
    );
    let { inWindow, backdated } = await buildItemsFromExtendedQuery(3);
    const after3Days = [...inWindow, ...backdated];

    if (after3Days.length < MIN_ITEMS_BEFORE_BACKDATE) {
      // Step 2: still thin — run a fresh ingest for these jurisdictions with a
      // 7-day window, then re-query the DB.  The ingest will fetch whatever the
      // RSS feeds and scrapers have published in the past week and store those
      // items before we widen the DB query to pick them up.
      console.log(
        `[Briefly] Still thin after 3 days (${after3Days.length} item(s)) — running fresh 7-day ingest for ${supportedJurs.join(',')}`,
      );
      const { ingestJurisdictions } = await import('@/services/digestIngestService');
      // Cap the fresh ingest at 120s — a subscriber with many jurisdictions could
      // otherwise exhaust the full 300s digest cron budget before any emails are sent.
      // If it times out we still re-query the DB: whatever was ingested before the
      // cutoff is better than nothing, and the regular ingest cron will fill the rest.
      const ingestCompleted = await withTimeout(
        ingestJurisdictions(supportedJurs),
        120_000,
        `backdate ingest [${supportedJurs.join(',')}]`,
      ).then(() => true).catch((err) => {
        console.warn(`[Briefly] Backdate ingest hit time limit: ${err.message} — proceeding with available DB items`);
        return false;
      });
      console.log(`[Briefly] Fresh ingest ${ingestCompleted ? 'complete' : 'partial'} — re-querying 7-day window for ${supportedJurs.join(',')}`);
      ({ inWindow, backdated } = await buildItemsFromExtendedQuery(7));
    }

    if (backdated.length > 0 || inWindow.length > 0) {
      backdatedDays = Math.round(
        (new Date(sinceDate).getTime() - new Date(effectiveSinceDate).getTime()) / 86400_000,
      );
      items = [...inWindow, ...backdated].slice(0, MAX_DIGEST_ITEMS);
      console.log(
        `[Briefly] Backdate (${backdatedDays}d): ${inWindow.length} primary + ${backdated.length} backdated item(s) for ${supportedJurs.join(',')}`,
      );
    } else {
      items = [];
    }
  } else {
    items = primaryItems.slice(0, MAX_DIGEST_ITEMS);
  }

  console.log(
    `[Briefly] DB synthesis: ${rawItems.length} fetched → ${items.length} item(s)` +
    (backdatedDays ? ` (${backdatedDays}-day backdate)` : '') +
    ` for ${supportedJurs.join(',') || 'none'}`,
  );

  const todayLabel  = getTodayLabel();
  // Email headline/summary should reflect the subscriber's selected cadence.
  // Backdated items are still tagged individually via backdatedLabel in the item cards.
  const timeframe   = frequency === 'daily' ? 'the past 24 hours' : 'the past 7 days';
  const topicList   = topics.length > 0 ? topics.join(', ') : 'general legal developments';

  // Build jurisdiction name list: supported names from JURISDICTION_CONFIG,
  // unsupported names from Intl.DisplayNames (ISO code → English country name).
  const jDisplayNames = unsupportedJurs.length > 0
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;
  const jurisdictionNames = [
    ...supportedJurs.map(c => JURISDICTION_CONFIG[c]?.name).filter(Boolean),
    ...unsupportedJurs.map(code => { try { return jDisplayNames!.of(code) ?? code; } catch { return code; } }),
  ].join(', ') || jurisdictions.join(', ');

  // Convert DigestItemRow to the same shape as RawResult for the synthesis prompt.
  // Prefer the AI-written aiSummary over the raw excerpt — it is always present
  // (set at ingest time by classifyAndSummarise) and is safe to send even if
  // Gemini synthesis later fails and the fallback path is used.
  const rawResults = items.map((item) => ({
    title:        item.title,
    url:          item.url,
    snippet:      (item.aiSummary || item.excerpt).slice(0, 150),
    date:         item.publishedAt.toISOString(),
    source:       item.source,
    jurisdiction: JURISDICTION_CONFIG[item.jurisdiction]?.name ?? item.jurisdiction,
    type:         item.contentType as RawResult['type'],
  }));

  // ── Gemini grounding for unsupported jurisdictions ────────────────────────────
  // Unsupported jurisdictions have no RSS/scraper feeds in the DB.  We call
  // searchViaGeminiGrounding directly here so they are included in the same
  // synthesis pass and appear alongside the DB-backed content in the email.
  // Unlike DB items, these results are always treated as "primary window" —
  // no backdatedLabel is stamped on them.
  let unsupportedGroundingResults: RawResult[] = [];

  if (unsupportedJurs.length > 0) {
    const displayNames      = new Intl.DisplayNames(['en'], { type: 'region' });
    const topicListGrounding = topics.length > 0 ? topics.join(', ') : 'general legal developments';
    const dateWindow         = buildDateWindow(sinceDate);

    const groundingTasks = unsupportedJurs.map(async (code) => {
      const countryName = (() => { try { return displayNames.of(code) ?? code; } catch { return code; } })();
      const prompt =
        `Find the most recent legal news, court decisions, and regulatory changes from ${countryName} ` +
        `from ${dateWindow}. Topics: ${topicListGrounding}. ` +
        `For each result include: headline, publication, date, and the key legal development.`;
      try {
        const results = await withTimeout(
          searchViaGeminiGrounding(prompt, countryName, 6, undefined),
          40_000, `Gemini grounding unsupported [${code}]`,
        );
        console.log(`[Briefly] Grounding unsupported jurisdiction ${code} (${countryName}): ${results.length} result(s)`);
        return results;
      } catch (err: any) {
        console.error(`[Briefly] Grounding failed for unsupported jurisdiction ${code} (${countryName}):`, err.message);
        return [] as RawResult[];
      }
    });

    const settled = await Promise.allSettled(groundingTasks);
    unsupportedGroundingResults = settled.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  }

  // ── Merge DB results and grounding results ─────────────────────────────────
  const allRawResults: RawResult[] = [
    ...rawResults,
    ...unsupportedGroundingResults.map(r => ({
      title:        r.title,
      url:          r.url,
      snippet:      r.snippet.slice(0, 150),
      date:         r.date,
      source:       r.source,
      jurisdiction: r.jurisdiction,
      type:         r.type,
    })),
  ];

  // ── Empty check (after grounding) ─────────────────────────────────────────
  // Only return empty if both the DB path AND grounding produced nothing.
  if (allRawResults.length === 0) {
    console.log(`[Briefly] No items found (DB + grounding) for ${jurisdictions.join(',')} — sending empty digest notification`);
    return {
      digest: {
        headline: `No legal updates found for ${jurisdictionNames}`,
        summary:
          `We searched your selected jurisdictions (${jurisdictionNames}) and practice areas over the past ` +
          `${frequency === 'daily' ? '4' : '10'} days but could not find any matching legal updates. ` +
          `This is rare — you can help Briefly find more content by adding additional jurisdictions ` +
          `or practice areas to your subscription.`,
        sections:    [],
        sources:     [],
        generatedAt: new Date().toISOString(),
      },
      source:    'db',
      itemCount: 0,
    };
  }

  // ── Build digest from pre-computed aiSummary fields — no Gemini synthesis ───
  // Each item's aiSummary was written by Gemini at ingest time and is already
  // clean, attorney-ready content.  Skipping a second synthesis pass makes this
  // path instant (no Gemini call) and reliable for any number of subscribers.
  console.log(
    `[Briefly] Building digest from aiSummary fields: ${allRawResults.length} item(s) for ${jurisdictions.join(',')}`,
  );

  const sections: DigestContent['sections'] = [
    { category: 'Case Law Updates',   items: [] },
    { category: 'Regulatory Changes', items: [] },
    { category: 'Legal News',         items: [] },
  ];

  for (const r of allRawResults) {
    const idx =
      r.type === 'case_law'    ? 0 :
      r.type === 'legislation' ? 1 : 2;

    sections[idx].items.push({
      title:      r.title,
      summary:    r.snippet || r.title,
      sourceName: r.source,
      sourceUrl:  r.url,
    });
  }

  const digest: DigestContent = {
    headline:    `${jurisdictionNames} Legal Digest — ${getTodayLabel()}`,
    summary:     `${allRawResults.length} legal developments across ${jurisdictionNames} for ${timeframe}.`,
    sections:    sections.filter((s) => s.items.length > 0),
    sources:     allRawResults.map((r) => ({ title: r.title, url: r.url })),
    generatedAt: new Date().toISOString(),
    ...(backdatedDays ? { backdatedDays } : {}),
  };

  return { digest, source: 'db', itemCount: items.length };
}

// ─── DigestCache helpers ──────────────────────────────────────────────────────
//
// Synthesis is expensive (Gemini call per unique subscriber fingerprint).
// digest-ingest pre-computes and stores DigestContent after each ingest run so
// that legal-digest only needs a DB read + SMTP — no Gemini calls at send time.

// Cache TTL: ingest cadence is 4 h; 5 h gives a 1 h buffer so the 8 am send
// cron always finds a valid entry from the 4 am or 8 am ingest run.
const DIGEST_CACHE_TTL_MS = 5 * 60 * 60 * 1000;

/**
 * Deterministic fingerprint for a unique digest configuration.
 * Both the ingest cron (writer) and the send cron (reader) must produce
 * identical strings for the same logical subscription — hence sorted arrays.
 */
export function buildDigestFingerprint(
  frequency:     string,
  jurisdictions: string[],
  topics:        string[],
): string {
  return `${frequency}::${[...jurisdictions].sort().join(',')}::${[...topics].sort().join(',')}`;
}

/** Returns the cached DigestContent if it exists and has not expired. */
export async function getCachedDigest(fingerprint: string): Promise<DigestContent | null> {
  const row = await prisma.digestCache.findUnique({ where: { fingerprint } });
  if (!row || row.expiresAt < new Date()) return null;
  return row.content as unknown as DigestContent;
}

/** Upserts a synthesized digest into the cache. */
export async function setCachedDigest(
  fingerprint:   string,
  frequency:     string,
  jurisdictions: string[],
  topics:        string[],
  content:       DigestContent,
): Promise<void> {
  const now      = new Date();
  const expiresAt = new Date(now.getTime() + DIGEST_CACHE_TTL_MS);
  await prisma.digestCache.upsert({
    where:  { fingerprint },
    update: { content: content as any, synthesizedAt: now, expiresAt },
    create: { fingerprint, frequency, jurisdictions, topics, content: content as any, expiresAt },
  });
}
