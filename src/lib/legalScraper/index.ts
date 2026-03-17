// src/lib/legalScraper/index.ts
//
// Thin client — delegates all scraping to the Python service on Digital Ocean.
// The Python service handles BeautifulSoup (SAFLII/OHADA) and Peachjam REST API.
//
// Required env vars:
//   LII_SCRAPER_URL     — e.g. http://<DROPLET_PUBLIC_IP>
//   LII_SCRAPER_API_KEY — must match LII_API_KEY set on the droplet

export interface SearchResult {
  title:        string;
  url:          string;
  snippet:      string;
  date?:        string;
  court?:       string;
  platform:     string;
  platformName: string;
  jurisdiction: string;
  docContent?:  string;
}

export interface LegalSearchOptions {
  jurisdictionHint: string;
  maxResults?:      number;
  snippetsOnly?:    boolean;
}

export interface LegalSearchResponse {
  platform:          string;
  platformName:      string;
  jurisdiction:      string;
  platformSearchUrl: string;
  legalSources:      SearchResult[];
  researchSources:   SearchResult[];
  fromCache:         boolean;
  error?:            string;
}

export interface FetchDocumentResult {
  title:      string;
  text:       string;
  url:        string;
  wordCount:  number;
  truncated?: boolean;
  error?:     string;
}

const SCRAPER_URL = process.env.LII_SCRAPER_URL;
const SCRAPER_KEY = process.env.LII_SCRAPER_API_KEY;

export async function searchAfricanLegalSources(
  query: string,
  options: LegalSearchOptions,
): Promise<LegalSearchResponse> {
  if (!SCRAPER_URL) {
    throw new Error(
      'LII_SCRAPER_URL is not configured. ' +
      'Set it to your Digital Ocean droplet URL (e.g. http://<PUBLIC_IP>).',
    );
  }

  const { jurisdictionHint, maxResults = 8 } = options;

  const response = await fetch(`${SCRAPER_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(SCRAPER_KEY ? { 'X-Api-Key': SCRAPER_KEY } : {}),
    },
    body: JSON.stringify({
      query:        query.trim(),
      jurisdiction: jurisdictionHint.trim(),
      maxResults:   Math.min(maxResults, 20),
    }),
    // Stay within Vercel's 60 s function timeout
    signal: AbortSignal.timeout(55_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown error');
    throw new Error(`LII scraper returned ${response.status}: ${text}`);
  }

  return response.json() as Promise<LegalSearchResponse>;
}

/**
 * Fetch the full text of a legal document from an official LII URL.
 * Only URLs on known LII domains are permitted by the scraper service.
 */
export async function fetchLegalDocument(url: string): Promise<FetchDocumentResult> {
  if (!SCRAPER_URL) {
    throw new Error('LII_SCRAPER_URL is not configured.');
  }

  const response = await fetch(`${SCRAPER_URL}/fetch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(SCRAPER_KEY ? { 'X-Api-Key': SCRAPER_KEY } : {}),
    },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(55_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown error');
    throw new Error(`LII scraper /fetch returned ${response.status}: ${text}`);
  }

  return response.json() as Promise<FetchDocumentResult>;
}
