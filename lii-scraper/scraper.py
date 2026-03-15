# lii-scraper/scraper.py
#
# ── API discovery (as of March 2026) ─────────────────────────────────────────
#
#  Peachjam platforms (14 LIIs):
#    GET /search/api/documents/?search=<q>&doc_type=<type>&page_size=15
#    Some platforms (Tanzania) redirect to /en/search/api/documents/ — requests
#    follows the redirect automatically. Hrefs in results_html may include /en/
#    prefix — handled in _build_url.
#
#  Response format:
#    A) { "count": N, "results": [...] }          — Kenya Law (JSON objects)
#    B) { "count": N, "results_html": "<ul>..." } — all other Peachjam LIIs
#
#  SAFLII (CGI) — server returns 500; routed through AfricanLII ?jurisdiction=
#  OHADA (Joomla) — HTML scrape via BeautifulSoup
#
#  STRICT RULE: results come ONLY from the platform's own domain.
#  AfricanLII fallback is used ONLY for SAFLII (broken CGI) and OHADA.
#  Downed platforms return empty — no cross-jurisdiction fallback.

import re
import time
import random
import logging
from urllib.parse import urlparse, urljoin, quote_plus

import requests
from bs4 import BeautifulSoup

from platforms import detect_platform, PLATFORM_MAP

logger = logging.getLogger(__name__)

MAX_LEGAL    = 8
MAX_RESEARCH = 6
TIMEOUT      = 15
FETCH_TIMEOUT = 30   # longer — fetching full documents takes more time

# Allowed LII domains — only URLs on these domains may be fetched.
# This prevents the service from being used as a general-purpose proxy.
ALLOWED_LII_DOMAINS = {
    "new.kenyalaw.org", "kenyalaw.org",
    "ghalii.org",
    "nigerialii.org",
    "africanlii.org",
    "saflii.org",
    "ulii.org",
    "tanzlii.org",
    "zimlii.org",
    "malawilii.org",
    "namibialii.org",
    "lesotholii.org",
    "swazilii.org",
    "seylii.org",
    "mauritiuslii.org",
    "ethiopialii.org",
    "ohadalex.org",
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

# AfricanLII jurisdiction filter uses full country names, not ISO codes.
# Used ONLY as fallback for SAFLII (broken) — it's still an LII source.
AFRICANLII_COUNTRY_NAMES = {
    "ke": "Kenya",      "gh": "Ghana",       "ng": "Nigeria",
    "za": "South Africa", "ug": "Uganda",    "tz": "Tanzania",
    "zw": "Zimbabwe",   "mw": "Malawi",      "na": "Namibia",
    "ls": "Lesotho",    "sz": "Eswatini",    "sc": "Seychelles",
    "mu": "Mauritius",  "et": "Ethiopia",    "sn": "Senegal",
}


def _headers(referer=None, accept_json=False):
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "application/json" if accept_json
                  else "text/html,application/xhtml+xml,*/*;q=0.8",
        **({"Referer": referer} if referer else {}),
    }


# ── URL helpers ───────────────────────────────────────────────────────────────

def _strip_expression_suffix(path: str) -> str:
    """Strip /lang@date suffix: /akn/ke/.../eng@2024-01-01 → /akn/ke/..."""
    return re.sub(r"/[a-z]{2,3}@[\d-]+$", "", path)


def _build_url(platform: dict, href: str) -> str | None:
    """
    Resolve a relative href to an absolute URL on this platform.
    Keeps the expression URI (direct 200) as-is — including /en/ prefix
    that some platforms (Tanzania) embed in their hrefs.
    Verifies the resolved URL belongs to this platform's domain only.
    """
    if not href or href.startswith("#") or href.startswith("javascript:"):
        return None
    base = platform["base_url"]
    try:
        url = href if href.startswith("http") else f"{base}{href}"
        if urlparse(url).netloc != urlparse(base).netloc:
            return None
        return url
    except Exception:
        return None


def _strip_marks(text: str) -> str:
    return re.sub(r"</?mark>", "", text).strip()


# ── Format A: JSON results array (Kenya Law) ─────────────────────────────────

def _json_item_to_result(item: dict, platform: dict) -> dict | None:
    title = (item.get("title") or "").strip()
    if not title or len(title) < 5:
        return None

    # expression_frbr_uri gives a direct 200 URL; work_frbr_uri redirects (302)
    uri = item.get("expression_frbr_uri") or item.get("work_frbr_uri") or ""
    if not uri:
        return None

    url = _build_url(platform, uri)
    if not url:
        return None

    highlight = item.get("highlight") or {}
    snippets  = highlight.get("content") or highlight.get("title") or []
    snippet   = _strip_marks(snippets[0]) if snippets else (item.get("citation") or "").strip()
    court     = (item.get("court") or "").strip() or None

    return {
        "title":        title,
        "url":          url,
        "snippet":      snippet[:500],
        "date":         item.get("date"),
        "court":        court,
        "platform":     platform["id"],
        "platformName": platform["name"],
        "jurisdiction": item.get("jurisdiction") or platform["country_codes"][0],
    }


# ── Format B: results_html (all other Peachjam LIIs) ─────────────────────────

def _parse_results_html(html: str, platform: dict) -> list[dict]:
    """
    Parse the HTML fragment returned in results_html.
    Structure:
      <li class="hit" data-document-id="...">
        <h5 class="card-title"><a href="/[en/]akn/...">Title</a></h5>
        <span class="me-3">date</span>
        <div class="ms-3 text-muted">[...] snippet [...]</div>
      </li>
    Note: some sites (Tanzania) include /en/ in the href — handled by _build_url.
    """
    soup    = BeautifulSoup(html, "lxml")
    results = []
    seen    = set()

    for li in soup.select("li.hit"):
        title_el = li.select_one("h5.card-title a, .card-title a")
        if not title_el:
            continue

        title = _strip_marks(title_el.get_text(strip=True))
        if not title or len(title) < 5:
            continue

        href = title_el.get("href", "")
        url  = _build_url(platform, href)
        if not url or url in seen:
            continue
        seen.add(url)

        date_el = li.select_one(".mb-2 .me-3, .mb-2 span")
        date    = date_el.get_text(strip=True) if date_el else None

        snippet_el = li.select_one(".ms-3.text-muted, .text-muted")
        snippet    = ""
        if snippet_el:
            snippet = _strip_marks(snippet_el.get_text(separator=" ", strip=True))[:500]

        results.append({
            "title":        title,
            "url":          url,
            "snippet":      snippet,
            "date":         date,
            "court":        None,
            "platform":     platform["id"],
            "platformName": platform["name"],
            "jurisdiction": platform["country_codes"][0]
                            if platform["country_codes"] != ["*"] else "*",
        })

    return results


# ── Peachjam unified fetcher ──────────────────────────────────────────────────

def fetch_peachjam(platform: dict, query: str,
                   doc_type: str | None = None,
                   jur_filter: str | None = None) -> list[dict]:
    """
    Query a Peachjam platform's /search/api/documents/ endpoint.
    doc_type: 'judgment' | 'legislation' | None (all)
    jur_filter: ISO code — used ONLY when platform is africanlii.
    Requests follows 302 redirects automatically (handles Tanzania's /en/ redirect).
    """
    base  = platform["base_url"]
    # AfricanLII requires /en/ prefix; others don't (requests follows redirect if needed)
    lang  = "/en" if platform["id"] == "africanlii" else ""
    q     = quote_plus(query)

    params = f"search={q}&page_size=15"
    if doc_type:
        params += f"&doc_type={doc_type}"
    if jur_filter and platform["id"] == "africanlii":
        country = AFRICANLII_COUNTRY_NAMES.get(jur_filter.lower(), jur_filter.title())
        params += f"&jurisdiction={quote_plus(country)}"

    endpoint = f"{base}{lang}/search/api/documents/?{params}"

    try:
        resp = requests.get(endpoint, headers=_headers(accept_json=True),
                            timeout=TIMEOUT, allow_redirects=True)
        if resp.status_code in (401, 403, 404):
            logger.warning(f"[peachjam] {platform['id']} → HTTP {resp.status_code}")
            return []
        resp.raise_for_status()
        data = resp.json()

    except requests.exceptions.Timeout:
        logger.warning(f"[peachjam] {platform['id']} → timeout after {TIMEOUT}s")
        return []
    except Exception as e:
        logger.warning(f"[peachjam] {platform['id']} endpoint error: {e}")
        return []

    results = []
    seen    = set()

    # Format A: JSON results array (Kenya Law)
    if "results" in data and isinstance(data["results"], list):
        for item in data["results"]:
            r = _json_item_to_result(item, platform)
            if r and r["url"] not in seen:
                seen.add(r["url"])
                results.append(r)
        logger.info(f"[peachjam/json] {platform['id']} → {len(results)} results")
        return results

    # Format B: results_html (GhaLII, NigeriaLII, Tanzania, AfricanLII, etc.)
    if "results_html" in data:
        results = _parse_results_html(data["results_html"], platform)
        # Remove duplicates
        seen_urls = set()
        deduped   = []
        for r in results:
            if r["url"] not in seen_urls:
                seen_urls.add(r["url"])
                deduped.append(r)
        logger.info(f"[peachjam/html] {platform['id']} → {len(deduped)} results")
        return deduped

    logger.info(f"[peachjam] {platform['id']} → 0 results (unexpected response format)")
    return []


# ── BeautifulSoup HTML scraper (OHADA Joomla) ────────────────────────────────

def scrape_html(platform: dict, url: str) -> list[dict]:
    """BeautifulSoup scraper for Joomla (OHADA) — CGI (SAFLII) is broken."""
    sel = platform.get("selectors")
    if not sel:
        return []

    try:
        resp = requests.get(url, headers=_headers(platform["base_url"]),
                            timeout=20, allow_redirects=True)
        resp.raise_for_status()
        html = resp.text
    except Exception as e:
        logger.warning(f"[scrape_html] {platform['id']} fetch failed: {e}")
        return []

    soup    = BeautifulSoup(html, "lxml")
    domain  = sel.get("domain_filter", "")
    results = []
    seen    = set()

    for container in soup.select(sel["container"]):
        link_el = container.select_one(sel["title_tag"])
        if not link_el:
            continue

        title = link_el.get_text(strip=True)
        if not title or len(title) < 5:
            continue

        href    = link_el.get("href", "")
        doc_url = href if href.startswith("http") else urljoin(platform["base_url"], href)

        if not doc_url or doc_url in seen:
            continue
        if domain and domain not in urlparse(doc_url).netloc:
            continue
        seen.add(doc_url)

        snippet = ""
        if sel.get("snippet_tag"):
            sn_el = container.select_one(sel["snippet_tag"])
            if sn_el:
                snippet = sn_el.get_text(separator=" ", strip=True)[:500]
        if not snippet:
            snippet = container.get_text(separator=" ", strip=True).replace(title, "").strip()[:500]

        results.append({
            "title":        title,
            "url":          doc_url,
            "snippet":      snippet,
            "date":         None,
            "court":        None,
            "platform":     platform["id"],
            "platformName": platform["name"],
            "jurisdiction": platform["country_codes"][0],
        })

    logger.info(f"[scrape_html] {platform['id']} → {len(results)} results")
    return results


# ── Deduplication ─────────────────────────────────────────────────────────────

def _dedup(results: list[dict]) -> list[dict]:
    seen, out = set(), []
    for r in results:
        url = r.get("url", "")
        path = urlparse(url).path.rstrip("/")
        if url and path and url not in seen:
            seen.add(url)
            out.append(r)
    return out


# ── Legal Sources (cases / judgments) ────────────────────────────────────────
#
# STRICT: results come ONLY from the jurisdiction's own LII platform.
# AfricanLII fallback is used ONLY for SAFLII (CGI broken since 2025).
# For downed platforms (timeout/000): return empty — no cross-jurisdiction fallback.

def get_legal_sources(platform: dict, africanlii: dict,
                      query: str, max_results: int) -> list[dict]:

    if platform["type"] == "peachjam":
        # Direct Peachjam API — only the jurisdiction's own LII
        results = fetch_peachjam(platform, query, "judgment")
        return _dedup(results)[:max_results]

    elif platform["id"] == "saflii":
        # SAFLII CGI is broken (HTTP 500 since early 2025).
        # Fallback to AfricanLII with South Africa jurisdiction filter.
        # AfricanLII IS an LII platform and holds SA cases.
        logger.info("[get_legal_sources] SAFLII CGI broken — using AfricanLII/ZA fallback")
        results = fetch_peachjam(africanlii, query, "judgment",
                                 platform["africanlii_jurisdiction"])
        return _dedup(results)[:max_results]

    else:
        # OHADA Joomla — HTML scrape
        results = scrape_html(platform, platform["search_url"](query))
        if not results and platform.get("africanlii_jurisdiction"):
            results = fetch_peachjam(africanlii, query, "judgment",
                                     platform["africanlii_jurisdiction"])
        return _dedup(results)[:max_results]


# ── Research Sources (legislation / acts) ────────────────────────────────────
#
# Same strict rule: only the jurisdiction's own LII.
# SAFLII fallback to AfricanLII/ZA for legislation too.

def get_research_sources(platform: dict, africanlii: dict, query: str) -> list[dict]:

    if platform["type"] == "peachjam":
        results = fetch_peachjam(platform, query, "legislation")
        return _dedup(results)[:MAX_RESEARCH]

    elif platform["id"] == "saflii":
        results = fetch_peachjam(africanlii, query, "legislation",
                                 platform["africanlii_jurisdiction"])
        return _dedup(results)[:MAX_RESEARCH]

    else:
        leg_fn = platform.get("legislation_url")
        results = scrape_html(platform, leg_fn(query)) if leg_fn else []
        if not results and platform.get("africanlii_jurisdiction"):
            results = fetch_peachjam(africanlii, query, "legislation",
                                     platform["africanlii_jurisdiction"])
        return _dedup(results)[:MAX_RESEARCH]


# ── Main entry point ──────────────────────────────────────────────────────────

def search_lii(query: str, jurisdiction_hint: str, max_results: int = MAX_LEGAL) -> dict:
    """
    Search the correct LII platform for the given jurisdiction.
    Returns a dict matching the LegalSearchResponse TypeScript interface.
    """
    platform   = detect_platform(jurisdiction_hint)
    africanlii = PLATFORM_MAP["africanlii"]

    logger.info(f"[search_lii] query='{query}' jurisdiction='{jurisdiction_hint}' "
                f"→ platform={platform['id']}")

    legal_sources    = get_legal_sources(platform, africanlii, query, max_results)
    research_sources = get_research_sources(platform, africanlii, query)

    error = None
    if not legal_sources:
        error = (
            f"No results from {platform['name']} for this query. "
            "The platform may be temporarily unavailable or no matching documents exist."
        )

    return {
        "platform":          platform["id"],
        "platformName":      platform["name"],
        "jurisdiction":      jurisdiction_hint,
        "platformSearchUrl": platform["search_url"](""),
        "legalSources":      legal_sources,
        "researchSources":   research_sources,
        "fromCache":         False,
        **({"error": error} if error else {}),
    }


# ── Document full-text fetcher ────────────────────────────────────────────────

def fetch_document(url: str) -> dict:
    """
    Fetch the full text of a legal document from an official LII URL.
    Only URLs on ALLOWED_LII_DOMAINS are permitted.
    Returns { title, text, url, wordCount, truncated?, error? }.
    """
    # Validate domain
    try:
        netloc = urlparse(url).netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
    except Exception:
        return {"error": "Invalid URL", "url": url, "text": "", "title": "", "wordCount": 0}

    if netloc not in ALLOWED_LII_DOMAINS:
        return {
            "error": f"Domain '{netloc}' is not an authorised LII platform.",
            "url": url, "text": "", "title": "", "wordCount": 0,
        }

    try:
        resp = requests.get(
            url,
            headers=_headers(referer=url),
            timeout=FETCH_TIMEOUT,
            allow_redirects=True,
        )
        if resp.status_code == 404:
            return {"error": "Document not found (404)", "url": url, "text": "", "title": "", "wordCount": 0}
        resp.raise_for_status()
    except requests.exceptions.Timeout:
        return {"error": f"Timeout fetching document after {FETCH_TIMEOUT}s", "url": url, "text": "", "title": "", "wordCount": 0}
    except Exception as e:
        return {"error": f"Fetch failed: {e}", "url": url, "text": "", "title": "", "wordCount": 0}

    soup = BeautifulSoup(resp.text, "lxml")

    # Extract page title
    title = ""
    title_tag = soup.find("title")
    if title_tag:
        title = title_tag.get_text(strip=True)
    if not title:
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)

    # Remove boilerplate elements before extracting text
    for tag in soup.select("script, style, nav, header, footer, .navbar, "
                           ".breadcrumb, .sidebar, form, [aria-hidden='true']"):
        tag.decompose()

    # Priority content selectors for Peachjam and other LII platforms
    content_selectors = [
        ".akoma-ntoso",       # AKN XML rendered content (Peachjam primary)
        "article.document",
        ".document-content",
        ".judgment-body",
        ".judgment",
        "article",
        ".content-main",
        "main",
        "#content",
        ".content",
    ]

    text = ""
    for sel in content_selectors:
        el = soup.select_one(sel)
        if el:
            text = el.get_text(separator="\n", strip=True)
            if len(text) > 200:
                break

    if not text:
        body = soup.find("body")
        text = body.get_text(separator="\n", strip=True) if body else ""

    # Collapse excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    # Cap at ~12 000 words to stay within model context limits
    words = text.split()
    truncated = False
    if len(words) > 12000:
        words = words[:12000]
        text = " ".join(words)
        truncated = True

    logger.info(f"[fetch_document] {netloc} → {len(words)} words (truncated={truncated})")

    return {
        "title":     title,
        "text":      text,
        "url":       url,
        "wordCount": len(words),
        "truncated": truncated,
    }
