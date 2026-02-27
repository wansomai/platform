// Legal Database Service
// Uses Google Custom Search API (site-restricted) for real-time results from official legal databases.
// If the API is not configured or the search fails, returns no results — the AI will tell the user
// it could not verify the citation rather than providing an unverified link.
//
// Setup (one-time):
//  1. Enable "Custom Search API" in Google Cloud Console
//  2. Create a Search Engine at https://programmablesearch.google.com/
//     - Set it to search "the entire web" (so siteSearch param works per-query)
//  3. Add to .env:
//     GOOGLE_API_KEY=your_api_key
//     GOOGLE_CSE_ID=your_cx_id
//
// Cost: $5 per 1,000 queries (no daily cap on the Site Restricted plan).

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
  searchSite: string; // domain to restrict Google search to
}

// ─── Google Custom Search ─────────────────────────────────────────────────────
// All legal database searches go through this single function.
// Throws if API keys are not configured or the request fails.
async function searchViaGoogle(
  query: string,
  site: string,
  sourceName: string
): Promise<LegalSearchResult[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cx) {
    throw new Error(
      `Google Custom Search API is not configured. Set GOOGLE_API_KEY and GOOGLE_CSEpric_ID to enable citation verification.`
    );
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1/siterestricted');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', cx);
  url.searchParams.set('q', query);
  url.searchParams.set('siteSearch', site);
  url.searchParams.set('siteSearchFilter', 'i'); // include only this site
  url.searchParams.set('num', '5');
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    let body: string;
    try {
      body = JSON.stringify(await res.json());
    } catch {
      body = await res.text();
    }
    throw new Error(`Google Custom Search returned ${res.status} – ${body} for site:${site}`);
  }

  const data = await res.json();
  const items: any[] = data.items ?? [];

  return items.map((item: any) => ({
    title: item.title ?? '',
    url: item.link ?? '',
    excerpt: item.snippet ?? '',
    citation: item.pagemap?.metatags?.[0]?.['citation'] ?? '',
    date: (
      item.pagemap?.metatags?.[0]?.['article:published_time'] ??
      item.pagemap?.metatags?.[0]?.['date'] ??
      ''
    ),
    source: sourceName,
  }));
}

// ─── UK Legislation — has a real public JSON API, use it directly ─────────────
async function searchUKLegislation(query: string): Promise<LegalSearchResult[]> {
  const apiUrl = `https://www.legislation.gov.uk/api/1/search.json?text=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(apiUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`legislation.gov.uk API returned ${res.status}`);
  const data = await res.json();
  const items: any[] = data.results ?? [];

  if (items.length > 0) {
    return items.map((item: any) => ({
      title: item.title ?? '',
      url: `https://www.legislation.gov.uk${item.link ?? ''}`,
      excerpt: item.description ?? '',
      citation: item.reference ?? '',
      date: item.year?.toString() ?? '',
      source: 'UK Legislation (legislation.gov.uk)',
    }));
  }

  // API returned nothing — fall through to Google site search
  return searchViaGoogle(query, 'legislation.gov.uk', 'UK Legislation');
}

// ─── US Federal (CourtListener — free public API) ─────────────────────────────
async function searchUSFederalLaw(query: string): Promise<LegalSearchResult[]> {
  const apiUrl = `https://www.courtlistener.com/api/rest/v3/search/?q=${encodeURIComponent(query)}&type=o&order_by=score+desc&page_size=5`;
  const res = await fetch(apiUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`CourtListener API returned ${res.status}`);
  const data = await res.json();
  const items: any[] = data.results ?? [];

  if (items.length > 0) {
    return items.map((item: any) => ({
      title: item.caseName ?? 'Untitled',
      url: `https://www.courtlistener.com${item.absolute_url ?? ''}`,
      excerpt: item.snippet ?? '',
      citation: item.citation?.join(', ') ?? '',
      date: item.dateFiled ?? '',
      source: 'CourtListener (courtlistener.com)',
    }));
  }

  return searchViaGoogle(query, 'courtlistener.com', 'CourtListener (US Federal)');
}

// ─── Jurisdiction → database config map ──────────────────────────────────────
const DATABASE_MAP: Record<string, LegalDatabaseConfig> = {
  'ke':              { name: 'Kenya Law Reports',          baseUrl: 'https://new.kenyalaw.org',           searchSite: 'new.kenyalaw.org' },
  'uk-england-wales':{ name: 'UK Legislation',             baseUrl: 'https://www.legislation.gov.uk',     searchSite: 'legislation.gov.uk' },
  'uk-scotland':     { name: 'UK Legislation (Scotland)',  baseUrl: 'https://www.legislation.gov.uk',     searchSite: 'legislation.gov.uk' },
  'ng':              { name: 'AfricanLII Nigeria',          baseUrl: 'https://africanlii.org',             searchSite: 'africanlii.org' },
  'za':              { name: 'AfricanLII South Africa',     baseUrl: 'https://africanlii.org',             searchSite: 'africanlii.org' },
  'ug':              { name: 'AfricanLII Uganda',           baseUrl: 'https://africanlii.org',             searchSite: 'africanlii.org' },
  'tz':              { name: 'AfricanLII Tanzania',         baseUrl: 'https://africanlii.org',             searchSite: 'africanlii.org' },
  'rw':              { name: 'AfricanLII Rwanda',           baseUrl: 'https://africanlii.org',             searchSite: 'africanlii.org' },
  'zm':              { name: 'AfricanLII Zambia',           baseUrl: 'https://africanlii.org',             searchSite: 'africanlii.org' },
  'mw':              { name: 'AfricanLII Malawi',           baseUrl: 'https://africanlii.org',             searchSite: 'africanlii.org' },
  'et':              { name: 'AfricanLII Ethiopia',         baseUrl: 'https://africanlii.org',             searchSite: 'africanlii.org' },
  'cd':              { name: 'AfricanLII DRC',              baseUrl: 'https://africanlii.org',             searchSite: 'africanlii.org' },
  'us-federal':      { name: 'CourtListener (US Federal)', baseUrl: 'https://www.courtlistener.com',      searchSite: 'courtlistener.com' },
  'ca-federal':      { name: 'CanLII',                      baseUrl: 'https://www.canlii.org',             searchSite: 'canlii.org' },
  'au-federal':      { name: 'AustLII',                     baseUrl: 'https://www.austlii.edu.au',         searchSite: 'austlii.edu.au' },
  'in':              { name: 'Indian Kanoon',               baseUrl: 'https://indiankanoon.org',           searchSite: 'indiankanoon.org' },
  'sg':              { name: 'Singapore Law Watch',         baseUrl: 'https://www.singaporelawwatch.sg',   searchSite: 'singaporelawwatch.sg' },
  'de':              { name: 'Gesetze im Internet',         baseUrl: 'https://gesetze-im-internet.de',     searchSite: 'gesetze-im-internet.de' },
  'fr':              { name: 'Légifrance',                  baseUrl: 'https://www.legifrance.gouv.fr',     searchSite: 'legifrance.gouv.fr' },
  'hk':              { name: 'HKLII',                       baseUrl: 'https://www.hklii.org',              searchSite: 'hklii.org' },
};

// Special cases that use their own native API before falling back to Google
const NATIVE_API_HANDLERS: Partial<Record<string, (query: string) => Promise<LegalSearchResult[]>>> = {
  'uk-england-wales': searchUKLegislation,
  'uk-scotland': searchUKLegislation,
  'us-federal': searchUSFederalLaw,
};

export interface LegalDatabaseSearchResult {
  success: boolean;
  jurisdictionId: string;
  databaseName: string;
  databaseUrl: string;
  results: LegalSearchResult[];
  message?: string;
}

export async function searchJurisdictionDatabase(
  query: string,
  jurisdictionId: string
): Promise<LegalDatabaseSearchResult> {
  const config = DATABASE_MAP[jurisdictionId];

  if (!config) {
    return {
      success: false,
      jurisdictionId,
      databaseName: 'Unknown',
      databaseUrl: '',
      results: [],
      message: `No legal database integration available for jurisdiction "${jurisdictionId}".`,
    };
  }

  try {
    const nativeHandler = NATIVE_API_HANDLERS[jurisdictionId];
    const results = nativeHandler
      ? await nativeHandler(query)
      : await searchViaGoogle(query, config.searchSite, config.name);

    return {
      success: results.length > 0,
      jurisdictionId,
      databaseName: config.name,
      databaseUrl: config.baseUrl,
      results,
      message: results.length === 0
        ? `No results found in ${config.name} for "${query}".`
        : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      jurisdictionId,
      databaseName: config.name,
      databaseUrl: config.baseUrl,
      results: [],
      message: error.message,
    };
  }
}
