/**
 * Resolve redirects and validate a URL (returns final URL and whether it's reachable).
 * Used to mitigate 404s and unstable links from search grounding.
 */

const TIMEOUT_MS = 4000;

export interface ResolveResult {
  finalUrl: string;
  ok: boolean;
}

/**
 * Follow redirects and validate the URL. Returns the final URL after redirects
 * and whether the response was ok (2xx). Uses HEAD first; falls back to GET if
 * the server returns 405 Method Not Allowed.
 */
export async function resolveAndValidateUrl(url: string): Promise<ResolveResult> {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return { finalUrl: url, ok: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'WansomAI-LinkValidator/1.0 (https://wansom.ai)',
    };

    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers,
    });

    // Some servers don't support HEAD; retry with GET
    if (res.status === 405) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers,
      });
    }

    clearTimeout(timeout);
    const finalUrl = res.url || url;
    const ok = res.ok;
    return { finalUrl, ok };
  } catch {
    clearTimeout(timeout);
    return { finalUrl: url, ok: false };
  }
}

/**
 * Resolve and validate multiple URLs in parallel. Returns an array of
 * { title, uri } with only valid (ok) sources, using the final resolved URL.
 */
export async function resolveAndValidateSources(
  sources: Array<{ title: string; uri: string }>
): Promise<{ valid: Array<{ title: string; uri: string }>; brokenCount: number }> {
  if (sources.length === 0) {
    return { valid: [], brokenCount: 0 };
  }

  const results = await Promise.all(
    sources.map(async (source) => {
      const { finalUrl, ok } = await resolveAndValidateUrl(source.uri);
      return { ...source, finalUrl, ok };
    })
  );

  const valid = results
    .filter((r) => r.ok)
    .map((r) => ({ title: r.title, uri: r.finalUrl }));
  const brokenCount = results.filter((r) => !r.ok).length;

  return { valid, brokenCount };
}
