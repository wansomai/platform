// Legal Database Service
// Searches official legal databases based on jurisdiction

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
  search: (query: string) => Promise<LegalSearchResult[]>;
}

// ─── Kenya Law (kenyalaw.org) ────────────────────────────────────────────────
async function searchKenyaLaw(query: string): Promise<LegalSearchResult[]> {
  const url = `https://kenyalaw.org/api/search/?q=${encodeURIComponent(query)}&category=case_law&format=json&limit=5`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Kenya Law returned ${res.status}`);
  const data = await res.json();

  // Handle both array and { results: [] } shapes
  const items: any[] = Array.isArray(data) ? data : (data.results ?? data.data ?? []);

  return items.slice(0, 5).map((item: any) => ({
    title: item.title || item.case_title || 'Untitled',
    url: item.url || item.link || `https://kenyalaw.org/caselaw/cases/view/${item.id}/`,
    excerpt: item.snippet || item.headnote || item.summary || '',
    citation: item.citation || item.case_number || '',
    date: item.date || item.year || '',
    source: 'Kenya Law Reports (kenyalaw.org)',
  }));
}

// ─── UK Legislation (legislation.gov.uk) ────────────────────────────────────
async function searchUKLegislation(query: string): Promise<LegalSearchResult[]> {
  const url = `https://www.legislation.gov.uk/api/1/search.json?text=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`legislation.gov.uk returned ${res.status}`);
  const data = await res.json();

  const items: any[] = data.results ?? [];
  return items.map((item: any) => ({
    title: item.title ?? '',
    url: `https://www.legislation.gov.uk${item.link ?? ''}`,
    excerpt: item.description ?? '',
    citation: item.reference ?? '',
    date: item.year?.toString() ?? '',
    source: 'UK Legislation (legislation.gov.uk)',
  }));
}

// ─── Nigeria (NIALS / Nigerian Law Reports) ─────────────────────────────────
async function searchNigeriaLaw(query: string): Promise<LegalSearchResult[]> {
  // Nigeria Law uses AfricanLII which has a REST API
  return searchAfricanLII(query, 'ng');
}

// ─── South Africa (SAFLII) ───────────────────────────────────────────────────
async function searchSouthAfricaLaw(query: string): Promise<LegalSearchResult[]> {
  return searchAfricanLII(query, 'za');
}

// ─── African LII (covers many African jurisdictions) ────────────────────────
async function searchAfricanLII(query: string, countryCode: string): Promise<LegalSearchResult[]> {
  const url = `https://africanlii.org/api/search/?q=${encodeURIComponent(query)}&jurisdiction=${countryCode}&format=json&limit=5`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`AfricanLII returned ${res.status}`);
  const data = await res.json();
  const items: any[] = data.results ?? data.data ?? [];

  return items.slice(0, 5).map((item: any) => ({
    title: item.title ?? 'Untitled',
    url: item.url ?? item.link ?? '',
    excerpt: item.snippet ?? item.description ?? '',
    citation: item.citation ?? '',
    date: item.date ?? '',
    source: `AfricanLII (africanlii.org) — ${countryCode.toUpperCase()}`,
  }));
}

// ─── US Federal (CourtListener — free, no auth for basic search) ─────────────
async function searchUSFederalLaw(query: string): Promise<LegalSearchResult[]> {
  const url = `https://www.courtlistener.com/api/rest/v3/search/?q=${encodeURIComponent(query)}&type=o&order_by=score+desc&page_size=5`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`CourtListener returned ${res.status}`);
  const data = await res.json();
  const items: any[] = data.results ?? [];

  return items.map((item: any) => ({
    title: item.caseName ?? 'Untitled',
    url: `https://www.courtlistener.com${item.absolute_url ?? ''}`,
    excerpt: item.snippet ?? '',
    citation: item.citation?.join(', ') ?? '',
    date: item.dateFiled ?? '',
    source: 'CourtListener (courtlistener.com)',
  }));
}

// ─── Canada (CanLII) ─────────────────────────────────────────────────────────
async function searchCanadaLaw(query: string): Promise<LegalSearchResult[]> {
  // CanLII requires API key; fall back to helpful message
  throw new Error('CanLII API requires registration at canlii.org/en/info/api.html');
}

// ─── Germany (gesetze-im-internet.de) ────────────────────────────────────────
async function searchGermanyLaw(query: string): Promise<LegalSearchResult[]> {
  throw new Error('Use gesetze-im-internet.de for German federal legislation');
}

// ─── Jurisdiction → search function map ─────────────────────────────────────
const DATABASE_MAP: Record<string, LegalDatabaseConfig> = {
  'ke': {
    name: 'Kenya Law Reports',
    baseUrl: 'https://kenyalaw.org',
    search: searchKenyaLaw,
  },
  'uk-england-wales': {
    name: 'UK Legislation',
    baseUrl: 'https://www.legislation.gov.uk',
    search: searchUKLegislation,
  },
  'uk-scotland': {
    name: 'UK Legislation (Scotland)',
    baseUrl: 'https://www.legislation.gov.uk',
    search: searchUKLegislation,
  },
  'ng': {
    name: 'Nigerian Law (AfricanLII)',
    baseUrl: 'https://africanlii.org',
    search: searchNigeriaLaw,
  },
  'za': {
    name: 'SAFLII',
    baseUrl: 'https://africanlii.org',
    search: searchSouthAfricaLaw,
  },
  'ug': {
    name: 'Uganda Legal Information Institute (AfricanLII)',
    baseUrl: 'https://africanlii.org',
    search: (q) => searchAfricanLII(q, 'ug'),
  },
  'tz': {
    name: 'Tanzania Legal (AfricanLII)',
    baseUrl: 'https://africanlii.org',
    search: (q) => searchAfricanLII(q, 'tz'),
  },
  'rw': {
    name: 'Rwanda Law (AfricanLII)',
    baseUrl: 'https://africanlii.org',
    search: (q) => searchAfricanLII(q, 'rw'),
  },
  'zm': {
    name: 'Zambia Law (AfricanLII)',
    baseUrl: 'https://africanlii.org',
    search: (q) => searchAfricanLII(q, 'zm'),
  },
  'mw': {
    name: 'Malawi Law (AfricanLII)',
    baseUrl: 'https://africanlii.org',
    search: (q) => searchAfricanLII(q, 'mw'),
  },
  'et': {
    name: 'Ethiopia Law (AfricanLII)',
    baseUrl: 'https://africanlii.org',
    search: (q) => searchAfricanLII(q, 'et'),
  },
  'cd': {
    name: 'DRC Law (AfricanLII)',
    baseUrl: 'https://africanlii.org',
    search: (q) => searchAfricanLII(q, 'cd'),
  },
  'us-federal': {
    name: 'US Federal Courts (CourtListener)',
    baseUrl: 'https://www.courtlistener.com',
    search: searchUSFederalLaw,
  },
  'ca-federal': {
    name: 'CanLII',
    baseUrl: 'https://www.canlii.org',
    search: searchCanadaLaw,
  },
  'de': {
    name: 'German Federal Law',
    baseUrl: 'https://gesetze-im-internet.de',
    search: searchGermanyLaw,
  },
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
      message: `No direct legal database integration available for jurisdiction "${jurisdictionId}". Verify citations manually at the official national legal database.`,
    };
  }

  try {
    const results = await config.search(query);
    return {
      success: true,
      jurisdictionId,
      databaseName: config.name,
      databaseUrl: config.baseUrl,
      results,
      message: results.length === 0
        ? `No results found in ${config.name} for "${query}". The case or statute may exist — verify directly at ${config.baseUrl}.`
        : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      jurisdictionId,
      databaseName: config.name,
      databaseUrl: config.baseUrl,
      results: [],
      message: `${config.name} is currently unreachable. Verify citations directly at ${config.baseUrl}. Error: ${error.message}`,
    };
  }
}
