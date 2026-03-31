// src/app/api/dev/digest-preview/route.ts
//
// Dev-only endpoint for testing the Briefly digest pipeline without sending email.
// Blocked automatically in production.
//
// ─── Usage ───────────────────────────────────────────────────────────────────
//
//  Old live-search modes (still available):
//    GET /api/dev/digest-preview?output=search&jurisdictions=KE,NG&topics=Contract Law
//    GET /api/dev/digest-preview?output=html&jurisdictions=KE&topics=Criminal Law&frequency=weekly
//    GET /api/dev/digest-preview?output=json&jurisdictions=KE,NG&topics=Contract Law
//
//  New pipeline modes:
//    Ingest only (populate DB from RSS/scraper/Tavily):
//      GET /api/dev/digest-preview?output=ingest&jurisdictions=KE,NG
//
//    Full pipeline (ingest → DB → synthesis → email preview):
//      GET /api/dev/digest-preview?output=pipeline&jurisdictions=KE&topics=Criminal Law&frequency=weekly
//
// ─── Parameters ──────────────────────────────────────────────────────────────
//  jurisdictions  comma-separated codes, e.g. KE,NG,GB,US   (default: KE)
//  topics         comma-separated topic labels               (default: General Practice)
//  frequency      daily | weekly                             (default: daily)
//  output         search | html | json | ingest | pipeline   (default: html)

import { NextRequest, NextResponse } from 'next/server';
import {
  generateLegalDigest,
  generateLegalDigestFromDB,
  runDigestSearch,
  DigestContent,
  JurisdictionSearchResult,
} from '@/services/legalDigestService';
import {
  ingestJurisdictions,
  queryDigestItems,
  IngestResult,
  DigestItemRow,
} from '@/services/digestIngestService';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawJurisdictions = searchParams.get('jurisdictions') || 'KE';
  const rawTopics        = searchParams.get('topics')        || 'General Practice';
  const frequency        = (searchParams.get('frequency')    || 'daily') as 'daily' | 'weekly';
  const output           = searchParams.get('output')        || 'html';

  const jurisdictions = rawJurisdictions.split(',').map((j) => j.trim().toUpperCase()).filter(Boolean);
  const topics        = rawTopics.split(',').map((t) => t.trim()).filter(Boolean);

  const globalStart = Date.now();

  // ── ingest mode: populate DB from RSS / scraper / Tavily ─────────────────
  if (output === 'ingest') {
    try {
      const results  = await ingestJurisdictions(jurisdictions);
      const elapsed  = Date.now() - globalStart;
      const html     = buildIngestPage(results, jurisdictions, elapsed);
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── pipeline mode: ingest → DB → synthesis ───────────────────────────────
  if (output === 'pipeline') {
    try {
      // Phase 1: ingest
      const ingestResults = await ingestJurisdictions(jurisdictions);
      const ingestElapsed = Date.now() - globalStart;

      // Phase 2: query DB
      const sinceDate = frequency === 'weekly'
        ? new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const dbItems = await queryDigestItems({ jurisdictions, topics, sinceDate, limit: 40 });

      // Phase 3: synthesise
      const { digest, source: digestSource, itemCount } = await generateLegalDigestFromDB(
        topics, jurisdictions, frequency,
      );

      const elapsed = Date.now() - globalStart;
      const html    = buildPipelinePage(
        ingestResults, dbItems, digest, digestSource, itemCount,
        topics, jurisdictions, frequency, ingestElapsed, elapsed,
      );
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    } catch (err: any) {
      const elapsed = Date.now() - globalStart;
      return new NextResponse(buildErrorPage(err.message, elapsed), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  }

  // ── search mode: raw results only, no synthesis ───────────────────────────
  if (output === 'search') {
    try {
      const searchResults = await runDigestSearch(topics, jurisdictions, frequency);
      const elapsed = Date.now() - globalStart;
      return NextResponse.json(
        { params: { jurisdictions, topics, frequency }, elapsed_ms: elapsed, jurisdictions: searchResults },
        { status: 200 },
      );
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── json / html modes: full live-search pipeline ──────────────────────────
  try {
    let searchResults: JurisdictionSearchResult[] | null = null;
    let digest: DigestContent;

    if (output === 'html') {
      [searchResults, digest] = await Promise.all([
        runDigestSearch(topics, jurisdictions, frequency),
        generateLegalDigest(topics, jurisdictions, frequency),
      ]);
    } else {
      digest = await generateLegalDigest(topics, jurisdictions, frequency);
    }

    const elapsed = Date.now() - globalStart;

    if (output === 'json') {
      return NextResponse.json(
        { params: { jurisdictions, topics, frequency }, elapsed_ms: elapsed, digest },
        { status: 200 },
      );
    }

    const html = buildPreviewPage(digest, searchResults!, topics, jurisdictions, frequency, elapsed);
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (err: any) {
    const elapsed = Date.now() - globalStart;
    if (output === 'json') {
      return NextResponse.json({ error: err.message, elapsed_ms: elapsed }, { status: 500 });
    }
    return new NextResponse(buildErrorPage(err.message, elapsed), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const BASE_STYLES = `
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; }
.dev-banner { background: #1e293b; color: #f8fafc; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.dev-badge { background: #f59e0b; color: #1e293b; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px; }
.dev-meta { font-size: 13px; color: #94a3b8; }
.section { margin: 24px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.08); overflow: hidden; }
.section-header { background: #0a4b5e; color: white; padding: 12px 20px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.section-header.success { background: #15803d; }
.section-header.warn { background: #b45309; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { background: #f8fafc; padding: 10px 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
.tabs { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; padding: 0 24px; background: white; margin: 0 24px; border-radius: 8px 8px 0 0; }
.tab { padding: 10px 20px; cursor: pointer; font-size: 13px; font-weight: 500; color: #6b7280; border: none; background: none; }
.tab.active { color: #0a4b5e; border-bottom: 2px solid #0a4b5e; margin-bottom: -2px; }
.tab-panel { display: none; }
.tab-panel.active { display: block; }
.email-frame { border: none; width: 100%; height: 800px; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.badge-green { background: #dcfce7; color: #15803d; }
.badge-amber { background: #fef9c3; color: #b45309; }
.badge-red   { background: #fee2e2; color: #b91c1c; }
.badge-blue  { background: #dbeafe; color: #1d4ed8; }
`;

// ─── Ingest page ──────────────────────────────────────────────────────────────

function buildIngestPage(
  results:       IngestResult[],
  jurisdictions: string[],
  elapsed:       number,
): string {
  const totalStored  = results.reduce((n, r) => n + r.stored,  0);
  const totalSkipped = results.reduce((n, r) => n + r.skipped, 0);
  const totalErrors  = results.reduce((n, r) => n + r.errors.length, 0);

  const totalDropped = results.reduce((n, r) => n + r.dropped, 0);

  const rows = results.map((r) => {
    const storedBadge  = r.stored  > 0 ? `<span class="badge badge-green">${r.stored} new</span>` : `<span class="badge badge-amber">0 new</span>`;
    const skippedBadge = r.skipped > 0 ? `<span class="badge badge-blue">${r.skipped} dup</span>` : '';
    const droppedBadge = r.dropped > 0 ? `<span class="badge badge-red">${r.dropped} non-legal</span>` : '';
    const errorBadge   = r.errors.length > 0 ? `<span class="badge badge-red">${r.errors.length} err</span>` : '';
    const errorList    = r.errors.map((e) => `<div style="color:#b91c1c;font-size:11px;margin-top:4px">${escapeHtml(e)}</div>`).join('');

    return `
      <tr>
        <td style="font-weight:500">${r.name} <span style="color:#888">(${r.jurisdiction})</span></td>
        <td>${r.rss}</td>
        <td>${r.scraper}</td>
        <td>${r.tavily}</td>
        <td>${storedBadge} ${skippedBadge} ${droppedBadge} ${errorBadge}${errorList}</td>
        <td style="color:#888">${r.elapsed_ms} ms</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Briefly — Ingest Preview</title>
<style>${BASE_STYLES}</style></head><body>
<div class="dev-banner">
  <div style="display:flex;align-items:center;gap:10px">
    <span class="dev-badge">DEV</span>
    <span style="font-weight:600">Briefly — Ingestion Preview</span>
  </div>
  <div class="dev-meta">
    Jurisdictions: <strong style="color:#f8fafc">${jurisdictions.join(', ')}</strong> &nbsp;|&nbsp;
    Stored: <strong style="color:#4ade80">${totalStored} new</strong> &nbsp;|&nbsp;
    Skipped: <strong style="color:#94a3b8">${totalSkipped} dup</strong> &nbsp;|&nbsp;
    Dropped: <strong style="${totalDropped > 0 ? 'color:#f87171' : 'color:#94a3b8'}">${totalDropped} non-legal</strong> &nbsp;|&nbsp;
    Errors: <strong style="${totalErrors > 0 ? 'color:#f87171' : 'color:#94a3b8'}">${totalErrors}</strong> &nbsp;|&nbsp;
    Time: <strong style="color:#f8fafc">${elapsed} ms</strong>
  </div>
</div>
<div class="section" style="margin:24px">
  <div class="section-header ${totalStored > 0 ? 'success' : 'warn'}">📥 Ingestion Results — ${totalStored} new items stored to database</div>
  <table>
    <thead><tr>
      <th>Jurisdiction</th><th>RSS</th><th>Scraper</th><th>Tavily</th><th>Result</th><th>Time</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>
<div style="margin:0 24px 24px;font-size:13px;color:#6b7280">
  Next step: run
  <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">output=pipeline</code>
  to synthesise a digest from these items.
</div>
</body></html>`;
}

// ─── Pipeline page ────────────────────────────────────────────────────────────

function buildPipelinePage(
  ingestResults: IngestResult[],
  dbItems:       DigestItemRow[],
  digest:        DigestContent,
  digestSource:  'db',
  itemCount:     number,
  topics:        string[],
  jurisdictions: string[],
  frequency:     string,
  ingestElapsed: number,
  totalElapsed:  number,
): string {
  const totalStored = ingestResults.reduce((n, r) => n + r.stored, 0);

  // Ingest table
  const ingestRows = ingestResults.map((r) => `
    <tr>
      <td style="font-weight:500">${r.name}</td>
      <td>${r.rss}</td><td>${r.scraper}</td><td>${r.tavily}</td>
      <td><span class="badge badge-green">${r.stored} new</span>
          ${r.skipped > 0 ? `<span class="badge badge-blue" style="margin-left:4px">${r.skipped} dup</span>` : ''}</td>
    </tr>`).join('');

  // DB items table
  const dbRows = dbItems.slice(0, 30).map((item) => {
    const typeColor: Record<string, string> = {
      case_law: 'badge-blue', legislation: 'badge-green', general: 'badge-amber',
    };
    const badge = `<span class="badge ${typeColor[item.contentType] || 'badge-amber'}">${item.contentType}</span>`;
    const date  = item.publishedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    return `
      <tr>
        <td><a href="${item.url}" target="_blank" style="color:#0a4b5e;font-weight:500">${escapeHtml(item.title.slice(0, 80))}</a></td>
        <td>${item.source}</td>
        <td>${badge}</td>
        <td style="color:#888;white-space:nowrap">${date}</td>
        <td style="color:#555;font-size:12px">${item.topics.join(', ')}</td>
      </tr>`;
  }).join('');

  const sourceLabel = `<span class="badge badge-green">DB (${itemCount} items)</span>`;

  const emailHtml = buildEmailHtml(digest, frequency);

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Briefly — Pipeline Preview</title>
<style>${BASE_STYLES}</style></head><body>
<div class="dev-banner">
  <div style="display:flex;align-items:center;gap:10px">
    <span class="dev-badge">DEV</span>
    <span style="font-weight:600">Briefly — Pipeline Preview</span>
  </div>
  <div class="dev-meta">
    Jurisdictions: <strong style="color:#f8fafc">${jurisdictions.join(', ')}</strong> &nbsp;|&nbsp;
    Topics: <strong style="color:#f8fafc">${topics.join(', ')}</strong> &nbsp;|&nbsp;
    Frequency: <strong style="color:#f8fafc">${frequency}</strong> &nbsp;|&nbsp;
    Digest source: ${sourceLabel} &nbsp;|&nbsp;
    Total time: <strong style="color:#f8fafc">${totalElapsed} ms</strong>
  </div>
</div>

<div style="margin:24px">
  <div class="tabs" id="tabs" style="margin:0;border-radius:8px 8px 0 0">
    <button class="tab active" onclick="switchTab('ingest')">📥 Ingestion (${totalStored} new)</button>
    <button class="tab" onclick="switchTab('db')">🗄️ DB Items (${dbItems.length})</button>
    <button class="tab" onclick="switchTab('email')">✉️ Email Preview</button>
    <button class="tab" onclick="switchTab('json')">{ } Digest JSON</button>
  </div>
</div>

<div class="tab-panel active" id="panel-ingest">
  <div class="section">
    <div class="section-header">📥 Phase 1 — Ingestion (${ingestElapsed} ms)</div>
    <table>
      <thead><tr><th>Jurisdiction</th><th>RSS</th><th>Scraper</th><th>Tavily</th><th>Stored</th></tr></thead>
      <tbody>${ingestRows}</tbody>
    </table>
  </div>
</div>

<div class="tab-panel" id="panel-db">
  <div class="section">
    <div class="section-header">🗄️ Phase 2 — DB items used for synthesis (${dbItems.length} items in window)</div>
    <table>
      <thead><tr><th>Title</th><th>Source</th><th>Type</th><th>Published</th><th>Topics</th></tr></thead>
      <tbody>${dbRows}</tbody>
    </table>
    ${dbItems.length > 30 ? `<div style="padding:10px 12px;color:#6b7280;font-size:13px">Showing first 30 of ${dbItems.length} items.</div>` : ''}
  </div>
</div>

<div class="tab-panel" id="panel-email">
  <p style="margin:0 24px 8px;font-size:12px;color:#6b7280">Exact email preview — all links open real source pages.</p>
  <div class="section" style="padding:0">
    <iframe class="email-frame" srcdoc="${escapeAttr(emailHtml)}"></iframe>
  </div>
</div>

<div class="tab-panel" id="panel-json">
  <div class="section">
    <div class="section-header">{ } DigestContent JSON</div>
    <pre style="padding:20px;overflow:auto;font-size:12px;line-height:1.5;margin:0">${escapeHtml(JSON.stringify(digest, null, 2))}</pre>
  </div>
</div>

<script>
function switchTab(name) {
  const panels = ['ingest','db','email','json'];
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', panels[i] === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
}
</script>
</body></html>`;
}

// ─── Original live-search preview page ───────────────────────────────────────

function buildPreviewPage(
  digest:        DigestContent,
  searchResults: JurisdictionSearchResult[],
  topics:        string[],
  jurisdictions: string[],
  frequency:     string,
  elapsed:       number,
): string {
  const totalResults = searchResults.reduce((n, jr) => n + jr.results.length, 0);

  const searchTableRows = searchResults.map((jr) => {
    const badge = jr.results.length > 0
      ? `<span style="color:#16a34a;font-weight:600">${jr.results.length} results</span>`
      : `<span style="color:#dc2626;font-weight:600">0 results</span>`;
    const SOURCE_ICONS: Record<string, string> = {
      lii_scraper: '🔬 LII Scraper', native_api: '🗄️ Native API',
      gemini_grounding: '🔍 Gemini Search', none: '—',
    };
    const sourceLabel = jr.sources.map((s) => SOURCE_ICONS[s] ?? s).join(' + ') || '—';
    const errorNote   = jr.error ? `<br><small style="color:#dc2626">${jr.error}</small>` : '';
    const resultLinks = jr.results.slice(0, 3).map((r) =>
      `<li><a href="${r.url}" target="_blank" style="color:#0a4b5e;font-size:12px">${r.title}</a>
       <span style="color:#888;font-size:11px"> — ${r.source}</span></li>`
    ).join('');

    return `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:10px 12px;font-weight:500">${jr.name}</td>
        <td style="padding:10px 12px;color:#555">${sourceLabel}</td>
        <td style="padding:10px 12px">${badge}${errorNote}</td>
        <td style="padding:10px 12px;font-size:12px;color:#555">${jr.elapsed_ms} ms</td>
        <td style="padding:10px 12px"><ul style="margin:0;padding-left:16px">${resultLinks}</ul></td>
      </tr>`;
  }).join('');

  const emailHtml = buildEmailHtml(digest, frequency);

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Briefly Dev Preview</title>
<style>${BASE_STYLES}
.hint { font-size: 12px; color: #6b7280; margin: 0 24px 8px; }
</style></head><body>
<div class="dev-banner">
  <div style="display:flex;align-items:center;gap:10px">
    <span class="dev-badge">DEV PREVIEW</span>
    <span style="font-weight:600">Briefly by Wansom — Live Search Preview</span>
  </div>
  <div class="dev-meta">
    Jurisdictions: <strong style="color:#f8fafc">${jurisdictions.join(', ')}</strong> &nbsp;|&nbsp;
    Topics: <strong style="color:#f8fafc">${topics.join(', ')}</strong> &nbsp;|&nbsp;
    Frequency: <strong style="color:#f8fafc">${frequency}</strong> &nbsp;|&nbsp;
    Total time: <strong style="color:#f8fafc">${elapsed} ms</strong> &nbsp;|&nbsp;
    Sources found: <strong style="color:#f8fafc">${totalResults}</strong>
  </div>
</div>
<div style="margin:24px">
  <div class="tabs" id="tabs" style="margin:0">
    <button class="tab active" onclick="switchTab('search')">🔍 Search Results</button>
    <button class="tab" onclick="switchTab('email')">✉️ Email Preview</button>
    <button class="tab" onclick="switchTab('json')">{ } Digest JSON</button>
  </div>
</div>
<div class="tab-panel active" id="panel-search">
  <div class="section">
    <div class="section-header">🔍 What the scrapers found (${totalResults} total results across ${searchResults.length} jurisdiction${searchResults.length !== 1 ? 's' : ''})</div>
    <table>
      <thead><tr><th>Jurisdiction</th><th>Source</th><th>Results</th><th>Time</th><th>Top results (click to verify URLs)</th></tr></thead>
      <tbody>${searchTableRows}</tbody>
    </table>
  </div>
</div>
<div class="tab-panel" id="panel-email">
  <p class="hint">This is exactly what the email looks like in an inbox. All links open the real source pages.</p>
  <div class="section" style="padding:0">
    <iframe class="email-frame" srcdoc="${escapeAttr(emailHtml)}"></iframe>
  </div>
</div>
<div class="tab-panel" id="panel-json">
  <div class="section">
    <div class="section-header">{ } DigestContent JSON</div>
    <pre style="padding:20px;overflow:auto;font-size:12px;line-height:1.5;margin:0">${escapeHtml(JSON.stringify(digest, null, 2))}</pre>
  </div>
</div>
<script>
function switchTab(name) {
  const panels = ['search','email','json'];
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', panels[i] === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
}
</script>
</body></html>`;
}

// ─── Email HTML builder (shared) ──────────────────────────────────────────────

function buildEmailHtml(digest: DigestContent, frequency: string): string {
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai';
  const freqLabel = frequency === 'daily' ? 'Daily' : 'Weekly';

  const sectionsHtml = digest.sections
    .filter((s) => s.items.length > 0)
    .map((section) => `
      <div style="margin-bottom:28px">
        <h2 style="color:#0a4b5e;font-size:18px;border-bottom:2px solid #0a4b5e;padding-bottom:8px;margin-bottom:16px">${section.category}</h2>
        ${section.items.map((item) => {
            const cardStyle = 'display:block;margin-bottom:16px;padding:12px;background:#f8fafc;border-radius:6px;border-left:3px solid #0a4b5e;text-decoration:none;color:inherit;';
            const inner = `
              <h3 style="color:#1a1a1a;font-size:15px;margin:0 0 6px 0">${item.title}</h3>
              <p style="color:#4a4a4a;font-size:14px;line-height:1.5;margin:0 0 8px 0">${item.summary}</p>
              ${item.sourceName ? `<span style="color:#0a4b5e;font-size:13px">${item.sourceName}${item.sourceUrl ? ' &rarr;' : ''}</span>` : ''}
            `;
            return item.sourceUrl
              ? `<a href="${item.sourceUrl}" style="${cardStyle}">${inner}</a>`
              : `<div style="${cardStyle}">${inner}</div>`;
          }).join('')}
      </div>`).join('');

  const sourcesHtml = digest.sources.length > 0 ? `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e5e5">
      <h3 style="color:#666;font-size:14px;margin-bottom:8px">Sources</h3>
      <ul style="list-style:none;padding:0;margin:0">
        ${digest.sources.map((s) =>
          `<li style="margin-bottom:4px"><a href="${s.url}" style="color:#0a4b5e;font-size:13px;text-decoration:none">${s.title}</a></li>`
        ).join('')}
      </ul>
    </div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f5f5f5">
  <div style="max-width:640px;margin:0 auto;padding:20px">
    <div style="background:#0a4b5e;padding:24px;text-align:center;border-radius:8px 8px 0 0">
      <h1 style="color:white;font-size:22px;margin:12px 0 4px 0">Briefly by Wansom — ${freqLabel}</h1>
      <p style="color:rgba(255,255,255,.8);font-size:13px;margin:0">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
    </div>
    <div style="background:white;padding:28px;border-radius:0 0 8px 8px">
      <p style="font-size:15px">Hello [Subscriber],</p>
      <div style="background:#f0f9ff;border-left:4px solid #0a4b5e;padding:14px;margin:16px 0;border-radius:0 6px 6px 0">
        <p style="margin:0;font-size:15px;font-weight:600;color:#0a4b5e">${digest.headline}</p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#4a4a4a">${digest.summary}</p>
      </div>
      ${sectionsHtml}
      ${sourcesHtml}
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e5e5;text-align:center">
        <a href="${appUrl}/dashboard" style="display:inline-block;background:#0a4b5e;color:white;padding:10px 24px;text-decoration:none;border-radius:4px;font-weight:600">Open Wansom Workspace</a>
      </div>
    </div>
  </div>
</body></html>`;
}

function buildErrorPage(message: string, elapsed: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Digest Preview Error</title></head>
<body style="font-family:sans-serif;padding:40px;background:#fef2f2">
  <h1 style="color:#dc2626">Digest generation failed</h1>
  <p style="color:#6b7280">Elapsed: ${elapsed} ms</p>
  <pre style="background:white;padding:20px;border-radius:8px;border:1px solid #fca5a5;color:#7f1d1d">${escapeHtml(message)}</pre>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
