// Legal Database Service
// Uses the Tavily Search API (https://tavily.com) for site-restricted searches.
//
// Search cascade (per query):
//   1. include_domains param — restricts results to a specific domain
//   2. site: operator in query — fallback if step 1 returns nothing
//   3. Alternate domains / mirrors (e.g. AfricanLII for Kenya)
//
// Setup:
//   TAVILY_API_KEY  — API key from app.tavily.com (free tier: 1 000 req/month)

export interface LegalSearchResult {
  title: string;
  url: string;
  excerpt: string;
  citation?: string;
  date?: string;
  source: string;
}

export interface LegalDatabaseConfig {
  name: string;
  baseUrl: string;
  searchSites: string[];
}

// ─── Tavily search ────────────────────────────────────────────────────────────
// Returns [] when no results are found. Throws on real errors.
async function doTavilyRequest(
  q: string,
  includeDomains?: string[],
): Promise<Omit<LegalSearchResult, 'source'>[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Tavily Search is not configured. Set TAVILY_API_KEY.',
    );
  }

  console.log(`[legalSearch] Tavily q="${q}" domains=${JSON.stringify(includeDomains ?? [])}`);

  const body: Record<string, unknown> = {
    api_key: apiKey,
    query: q,
    search_depth: 'basic',
    max_results: 5,
  };

  if (includeDomains && includeDomains.length > 0) {
    body.include_domains = includeDomains;
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[legalSearch] ❌ Tavily HTTP ${res.status}: ${text}`);
      throw new Error(`Tavily ${res.status}: ${text}`);
    }

    const data = await res.json();
    const items: any[] = data.results ?? [];

    console.log(`[legalSearch] ✅ ${items.length} result(s)${items.length > 0 ? ':' : ''}`);
    items.forEach((item, i) => {
      console.log(`  [${i + 1}] ${item.title} → ${item.url}`);
    });

    return items.map(item => ({
      title:    item.title   ?? '',
      url:      item.url     ?? '',
      excerpt:  item.content ?? '',
      citation: '',
      date:     item.published_date ?? '',
    }));
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.error(`[legalSearch] ❌ Tavily error q="${q}": ${message}`);
    throw new Error(`Tavily search failed: ${message}`);
  }
}

// ─── Single-site search with two-strategy cascade ────────────────────────────
// Strategy 1: include_domains param
// Strategy 2: site:DOMAIN in query (fallback if Strategy 1 returns nothing)
async function searchOneSite(
  query:      string,
  site:       string,
  sourceName: string,
): Promise<LegalSearchResult[]> {
  const r1 = await doTavilyRequest(query, [site]).catch(() => []);
  if (r1.length > 0) return r1.map(r => ({ ...r, source: sourceName }));

  const r2 = await doTavilyRequest(`site:${site} ${query}`).catch(() => []);
  return r2.map(r => ({ ...r, source: sourceName }));
}

// ─── Multi-site search ────────────────────────────────────────────────────────
async function searchViaTavily(
  query:      string,
  sites:      string[],
  sourceName: string,
): Promise<LegalSearchResult[]> {
  for (const site of sites) {
    const results = await searchOneSite(query, site, sourceName).catch(() => []);
    if (results.length > 0) return results;
  }
  return [];
}

// ─── Kenya Law ────────────────────────────────────────────────────────────────
// Tries new.kenyalaw.org first, then AfricanLII which mirrors Kenyan legislation.
async function searchKenyaLaw(query: string): Promise<LegalSearchResult[]> {
  const kl = await searchViaTavily(query, ['new.kenyalaw.org'], 'Kenya Law');
  if (kl.length > 0) return kl;

  const africanQuery = query.toLowerCase().includes('kenya') ? query : `${query} Kenya`;
  return searchViaTavily(africanQuery, ['africanlii.org'], 'AfricanLII (Kenya)');
}

// ─── UK Legislation — native JSON API first ───────────────────────────────────
async function searchUKLegislation(query: string): Promise<LegalSearchResult[]> {
  try {
    const res = await fetch(
      `https://www.legislation.gov.uk/api/1/search.json?text=${encodeURIComponent(query)}&limit=5`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) },
    );
    if (res.ok) {
      const data  = await res.json();
      const items: any[] = data.results ?? [];
      if (items.length > 0) {
        return items.map((item: any) => ({
          title:    item.title ?? '',
          url:      `https://www.legislation.gov.uk${item.link ?? ''}`,
          excerpt:  item.description ?? '',
          citation: item.reference ?? '',
          date:     item.year?.toString() ?? '',
          source:   'UK Legislation (legislation.gov.uk)',
        }));
      }
    }
  } catch { /* fall through to Tavily */ }

  return searchViaTavily(query, ['legislation.gov.uk'], 'UK Legislation');
}

// ─── US Federal — CourtListener native API first ──────────────────────────────
async function searchUSFederalLaw(query: string, sinceDate?: string): Promise<LegalSearchResult[]> {
  try {
    const dateParam = sinceDate ? `&filed_after=${sinceDate.slice(0, 10)}` : '';
    const res = await fetch(
      `https://www.courtlistener.com/api/rest/v3/search/?q=${encodeURIComponent(query)}&type=o&order_by=dateFiled+desc&page_size=5${dateParam}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) },
    );
    if (res.ok) {
      const data  = await res.json();
      const items: any[] = data.results ?? [];
      if (items.length > 0) {
        return items.map((item: any) => ({
          title:    item.caseName ?? 'Untitled',
          url:      `https://www.courtlistener.com${item.absolute_url ?? ''}`,
          excerpt:  item.snippet ?? '',
          citation: item.citation?.join(', ') ?? '',
          date:     item.dateFiled ?? '',
          source:   'CourtListener (courtlistener.com)',
        }));
      }
    }
  } catch { /* fall through to Tavily */ }

  return searchViaTavily(query, ['courtlistener.com'], 'CourtListener (US Federal)');
}

// ─── Jurisdiction → database config ──────────────────────────────────────────
const DATABASE_MAP: Record<string, LegalDatabaseConfig> = {
  'ke':              { name: 'Kenya Law',                  baseUrl: 'https://new.kenyalaw.org',          searchSites: ['new.kenyalaw.org'] },
  'uk-england-wales':{ name: 'UK Legislation',             baseUrl: 'https://www.legislation.gov.uk',    searchSites: ['legislation.gov.uk'] },
  'uk-scotland':     { name: 'UK Legislation (Scotland)',  baseUrl: 'https://www.legislation.gov.uk',    searchSites: ['legislation.gov.uk'] },
  'ng':              { name: 'AfricanLII Nigeria',          baseUrl: 'https://africanlii.org',            searchSites: ['africanlii.org'] },
  'za':              { name: 'AfricanLII South Africa',     baseUrl: 'https://africanlii.org',            searchSites: ['africanlii.org'] },
  'ug':              { name: 'AfricanLII Uganda',           baseUrl: 'https://africanlii.org',            searchSites: ['africanlii.org'] },
  'tz':              { name: 'AfricanLII Tanzania',         baseUrl: 'https://africanlii.org',            searchSites: ['africanlii.org'] },
  'rw':              { name: 'AfricanLII Rwanda',           baseUrl: 'https://africanlii.org',            searchSites: ['africanlii.org'] },
  'zm':              { name: 'AfricanLII Zambia',           baseUrl: 'https://africanlii.org',            searchSites: ['africanlii.org'] },
  'mw':              { name: 'AfricanLII Malawi',           baseUrl: 'https://africanlii.org',            searchSites: ['africanlii.org'] },
  'et':              { name: 'AfricanLII Ethiopia',         baseUrl: 'https://africanlii.org',            searchSites: ['africanlii.org'] },
  'cd':              { name: 'AfricanLII DRC',              baseUrl: 'https://africanlii.org',            searchSites: ['africanlii.org'] },
  'us-federal':      { name: 'CourtListener (US Federal)', baseUrl: 'https://www.courtlistener.com',     searchSites: ['courtlistener.com'] },
  'ca-federal':      { name: 'CanLII',                      baseUrl: 'https://www.canlii.org',            searchSites: ['canlii.org'] },
  'au-federal':      { name: 'AustLII',                     baseUrl: 'https://www.austlii.edu.au',        searchSites: ['austlii.edu.au'] },
  'in':              { name: 'Indian Kanoon',               baseUrl: 'https://indiankanoon.org',          searchSites: ['indiankanoon.org'] },
  'sg':              { name: 'Singapore Law Watch',         baseUrl: 'https://www.singaporelawwatch.sg',  searchSites: ['singaporelawwatch.sg'] },
  'de':              { name: 'Gesetze im Internet',         baseUrl: 'https://gesetze-im-internet.de',    searchSites: ['gesetze-im-internet.de'] },
  'fr':              { name: 'Légifrance',                  baseUrl: 'https://www.legifrance.gouv.fr',    searchSites: ['legifrance.gouv.fr'] },
  'hk':              { name: 'HKLII',                       baseUrl: 'https://www.hklii.org',             searchSites: ['hklii.org'] },
};

const NATIVE_API_HANDLERS: Partial<Record<string, (query: string, sinceDate?: string) => Promise<LegalSearchResult[]>>> = {
  'ke':               searchKenyaLaw,
  'uk-england-wales': searchUKLegislation,
  'uk-scotland':      searchUKLegislation,
  'us-federal':       searchUSFederalLaw,
};

export interface LegalDatabaseSearchResult {
  success:        boolean;
  jurisdictionId: string;
  databaseName:   string;
  databaseUrl:    string;
  results:        LegalSearchResult[];
  message?:       string;
}

export async function searchJurisdictionDatabase(
  query:          string,
  jurisdictionId: string,
  sinceDate?:     string,
): Promise<LegalDatabaseSearchResult> {
  const config = DATABASE_MAP[jurisdictionId];

  if (!config) {
    return {
      success:        false,
      jurisdictionId,
      databaseName:   'Unknown',
      databaseUrl:    '',
      results:        [],
      message:        `No legal database configured for jurisdiction "${jurisdictionId}".`,
    };
  }

  try {
    const nativeHandler = NATIVE_API_HANDLERS[jurisdictionId];
    const results = nativeHandler
      ? await nativeHandler(query, sinceDate)
      : await searchViaTavily(query, config.searchSites, config.name);

    return {
      success:      results.length > 0,
      jurisdictionId,
      databaseName: config.name,
      databaseUrl:  config.baseUrl,
      results,
      message:      results.length === 0
        ? `No results found in ${config.name} for "${query}".`
        : undefined,
    };
  } catch (error: any) {
    return {
      success:        false,
      jurisdictionId,
      databaseName:   config.name,
      databaseUrl:    config.baseUrl,
      results:        [],
      message:        error.message,
    };
  }
}
