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
  timeoutMs?:       number;
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

  const { jurisdictionHint, maxResults = 8, timeoutMs = 55_000 } = options;

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
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown error');
    throw new Error(`LII scraper returned ${response.status}: ${text}`);
  }

  return response.json() as Promise<LegalSearchResponse>;
}

// ── Stream event types from /search/stream ──────────────────────────────────

export type SearchStreamEvent =
  | { event: 'platform'; platform: string; platformName: string; jurisdiction: string; platformSearchUrl: string }
  | { event: 'legal';    results: SearchResult[] }
  | { event: 'research'; results: SearchResult[] }
  | { event: 'done';     fromCache: boolean };

/**
 * Stream search results from the LII scraper service via /search/stream.
 * Yields typed events as they arrive (platform → legal → research → done).
 * Caller assembles the final LegalSearchResponse from these events.
 */
export async function* streamAfricanLegalSources(
  query: string,
  options: LegalSearchOptions,
): AsyncGenerator<SearchStreamEvent> {
  if (!SCRAPER_URL) {
    throw new Error(
      'LII_SCRAPER_URL is not configured. ' +
      'Set it to your Digital Ocean droplet URL (e.g. http://<PUBLIC_IP>).',
    );
  }

  const { jurisdictionHint, maxResults = 8 } = options;

  const response = await fetch(`${SCRAPER_URL}/search/stream`, {
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
    signal: AbortSignal.timeout(55_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown error');
    throw new Error(`LII scraper /search/stream returned ${response.status}: ${text}`);
  }

  if (!response.body) {
    throw new Error('LII scraper /search/stream returned an empty response body');
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer    = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // keep incomplete last line

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) yield JSON.parse(trimmed) as SearchStreamEvent;
      }
    }

    // flush any remaining buffered data
    if (buffer.trim()) yield JSON.parse(buffer.trim()) as SearchStreamEvent;
  } finally {
    reader.releaseLock();
  }
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
