// POST /api/projects/[id]/canvas/import-doc
// Converts a .doc file to HTML server-side.  Three extraction paths:
//   1 – mammoth  (.doc files that are actually .docx — full formatting)
//   2 – RTF      (.doc files that are actually RTF — full formatting)
//   3 – cfb      (genuine binary Word 97-2003 — plain text, no formatting)
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { createApiResponse, createBadRequestResponse } from '@/lib/api/response';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------------------
// Path 2: RTF → HTML
// Handles .doc files that are actually RTF (Google Docs, LibreOffice "Save as
// .doc", older Word versions).  RTF is a text-based format with clearly
// documented control words, so we can extract formatting faithfully.
// ---------------------------------------------------------------------------

// Destination groups whose content should be ignored entirely
const RTF_SKIP_DESTINATIONS = new Set([
  'stylesheet','fonttbl','filetbl','colortbl','pict','object',
  'footnote','header','footer','headerl','headerr','headerf',
  'footerl','footerr','footerf','info','fldinst','datafield',
  'nonshppict','wmetafile','blipuid','shpinst','sp','sn','sv',
  'shp','shpgrp','themedata','colorschememapping','latentstyles',
]);

// ---------------------------------------------------------------------------
// Windows-1252 → Unicode mapping for bytes 0x80–0x9F.
// Latin-1 treats these as control characters; Word/RTF files use CP1252 where
// they are printable (em-dash, curly quotes, bullet, ellipsis, etc.).
// ---------------------------------------------------------------------------
const CP1252: Record<number, string> = {
  0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E',
  0x85: '\u2026', 0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02C6',
  0x89: '\u2030', 0x8A: '\u0160', 0x8B: '\u2039', 0x8C: '\u0152',
  0x8E: '\u017D', 0x91: '\u2018', 0x92: '\u2019', 0x93: '\u201C',
  0x94: '\u201D', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
  0x98: '\u02DC', 0x99: '\u2122', 0x9A: '\u0161', 0x9B: '\u203A',
  0x9C: '\u0153', 0x9E: '\u017E', 0x9F: '\u0178',
};
function cp1252Char(code: number): string {
  return CP1252[code] ?? String.fromCharCode(code);
}

// ---------------------------------------------------------------------------
// Pre-scan the RTF {\stylesheet} block to build a style-index → heading-level
// map.  Uses a simple strip-all-control-words approach rather than a fragile
// regex so it works reliably across Word, Google Docs, and LibreOffice output.
// ---------------------------------------------------------------------------
function extractHeadingStyles(rtf: string): Map<number, number> {
  const headings = new Map<number, number>();

  const ssStart = rtf.indexOf('{\\stylesheet');
  if (ssStart === -1) return headings;

  // Find the end of the stylesheet block via brace counting.
  let depth = 0;
  let ssEnd = ssStart;
  for (let i = ssStart; i < rtf.length; i++) {
    if (rtf[i] === '{') depth++;
    else if (rtf[i] === '}') { depth--; if (depth === 0) { ssEnd = i; break; } }
  }
  const stylesheet = rtf.slice(ssStart, ssEnd + 1);

  // Walk each direct-child group.
  let j = stylesheet.indexOf('{', 1); // skip outer {
  while (j !== -1 && j < stylesheet.length) {
    let d = 0;
    let entryEnd = j;
    for (let k = j; k < stylesheet.length; k++) {
      if (stylesheet[k] === '{') d++;
      else if (stylesheet[k] === '}') { d--; if (d === 0) { entryEnd = k; break; } }
    }
    const entry = stylesheet.slice(j + 1, entryEnd);

    // Style index is the first \sN in the entry.
    const idxMatch = entry.match(/^\\s(\d+)/);
    if (idxMatch) {
      const idx = parseInt(idxMatch[1]);
      // Strip all RTF control words and braces, then grab the text before the
      // first semicolon — that is the style name.
      const name = entry
        .replace(/\\[a-zA-Z]+[-]?\d*/g, ' ')
        .replace(/[{}]/g, '')
        .split(';')[0]
        .trim()
        .toLowerCase();

      // Match heading-style names across languages common in legal documents.
      const m = name.match(
        /(?:heading|titre|en-t[eê]te|rubrique|[uü]berschrift|kop|intestazione|encabezado|nag[łl][oó]wek)\s*(\d)/i,
      );
      if (m) {
        const level = parseInt(m[1]);
        if (level >= 1 && level <= 6) headings.set(idx, level);
      }
    }

    j = stylesheet.indexOf('{', entryEnd + 1);
  }

  return headings;
}

// ---------------------------------------------------------------------------
// RTF → HTML parser
//
// Handles .doc files that are actually RTF (Google Docs, LibreOffice, older
// Word versions saved as .doc).  Tracks:
//   • Character formatting: bold, italic, underline, font size (\fsN)
//   • Paragraph properties: style index (\sN), alignment (\qc/\qj/\ql),
//     list membership (\ls / \ilvl)
//   • Per-paragraph metadata used for heuristic heading detection:
//       allBold   – every text run in the paragraph is bold
//       isCenter  – paragraph has \qc (centred) alignment
//       maxFontSz – largest \fs value seen in the paragraph (half-points)
//       rawText   – plain text stripped of HTML tags (for length checks)
//
// Heuristic heading detection fires only when the stylesheet map has no entry
// for a paragraph's style index.  It catches the common legal-document pattern
// where headings are formatted manually (bold + caps / large font / centred)
// rather than via Word heading styles.
// ---------------------------------------------------------------------------

interface RtfState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  skip: boolean;     // inside a destination group to ignore
  fontSize: number;  // \fsN in half-points; 24 = 12 pt default
}

interface Para {
  html: string;
  rawText: string;
  styleIndex: number | null;
  isList: boolean;
  isCenter: boolean;
  allBold: boolean;
  maxFontSz: number;
}

function parseRtfToHtml(buffer: Buffer): string {
  const rtf = buffer.toString('latin1');

  // Pre-scan stylesheet for reliable heading-index mapping.
  const headingStyleMap = extractHeadingStyles(rtf);

  const stateStack: RtfState[] = [];
  let state: RtfState = { bold: false, italic: false, underline: false, skip: false, fontSize: 24 };

  const paras: Para[] = [];

  // ── Per-paragraph accumulators ────────────────────────────────────────────
  let inlineParts: string[] = [];
  let currentText  = '';
  let currentParaStyle: number | null = null;
  let isList       = false;
  let isCenter     = false;
  let paraAllBold  = true;  // assumed true until non-bold text is seen
  let paraHasText  = false; // at least one non-whitespace char was added
  let paraMaxFont  = 0;
  let rawTextBuf   = '';

  function flushInlineText() {
    if (!currentText) return;
    const textHasContent = currentText.trim().length > 0;
    if (textHasContent) {
      // Track whether any non-bold visible text exists in the paragraph.
      if (!state.bold) paraAllBold = false;
      paraHasText = true;
      if (state.fontSize > paraMaxFont) paraMaxFont = state.fontSize;
    }
    rawTextBuf += currentText;
    let t = escapeHtml(currentText);
    if (state.bold)      t = `<strong>${t}</strong>`;
    if (state.italic)    t = `<em>${t}</em>`;
    if (state.underline) t = `<u>${t}</u>`;
    inlineParts.push(t);
    currentText = '';
  }

  function flushParagraph() {
    flushInlineText();
    paras.push({
      html:       inlineParts.join(''),
      rawText:    rawTextBuf,
      styleIndex: currentParaStyle,
      isList,
      isCenter,
      allBold:    paraHasText && paraAllBold,
      maxFontSz:  paraMaxFont,
    });
    // Reset paragraph-level accumulators.
    inlineParts    = [];
    rawTextBuf     = '';
    currentParaStyle = null;
    isList         = false;
    isCenter       = false;
    paraAllBold    = true;
    paraHasText    = false;
    paraMaxFont    = 0;
  }

  let i = 0;
  const len = rtf.length;

  while (i < len) {
    const ch = rtf[i];

    if (ch === '{') {
      i++;
      flushInlineText();
      stateStack.push({ ...state });
      if (rtf[i] === '\\' && rtf[i + 1] === '*') {
        state = { ...state, skip: true };
        i += 2;
      }
    } else if (ch === '}') {
      i++;
      flushInlineText();
      state = stateStack.pop() ?? state;
    } else if (ch === '\\') {
      i++;
      const nc = rtf[i];

      if (nc === '\'') {
        // Hex-encoded character: \'XX (Windows-1252 byte)
        i++;
        const hex = rtf.slice(i, i + 2);
        i += 2;
        if (!state.skip) {
          const code = parseInt(hex, 16);
          if (!isNaN(code)) currentText += cp1252Char(code);
        }
      } else if (nc === '\\' || nc === '{' || nc === '}') {
        if (!state.skip) currentText += nc;
        i++;
      } else if (nc === '\r' || nc === '\n') {
        i++;
        if (rtf[i] === '\n') i++;
        if (!state.skip) flushParagraph();
      } else if ('-~_|:'.includes(nc)) {
        if (nc === '~' && !state.skip) currentText += '\u00A0';
        i++;
      } else {
        // Control word
        let word = '';
        while (i < len && /[a-zA-Z]/.test(rtf[i])) word += rtf[i++];

        let paramStr = '';
        let paramNeg = false;
        if (i < len && rtf[i] === '-') { paramNeg = true; i++; }
        while (i < len && /[0-9]/.test(rtf[i])) paramStr += rtf[i++];
        if (i < len && rtf[i] === ' ') i++;

        const param = paramStr.length > 0
          ? (paramNeg ? -parseInt(paramStr) : parseInt(paramStr))
          : null;

        if (RTF_SKIP_DESTINATIONS.has(word)) {
          state = { ...state, skip: true };
          continue;
        }

        if (!state.skip) {
          flushInlineText();
          switch (word) {
            // ── Character formatting ──────────────────────────────────────
            case 'b':       state.bold      = param !== 0; break;
            case 'i':       state.italic    = param !== 0; break;
            case 'ul':
            case 'uld':
            case 'uldash':
            case 'ulw':     state.underline = param !== 0; break;
            case 'ulnone':  state.underline = false; break;
            case 'fs':
              // Font size in half-points.  \fs0 is a reset (use default 24).
              state.fontSize = (param && param > 0) ? param : 24;
              break;

            // ── Paragraph control ─────────────────────────────────────────
            case 'pard':
              currentParaStyle = null;
              isList           = false;
              isCenter         = false;
              break;
            case 's':
              currentParaStyle = param;
              break;
            case 'qc':
              isCenter = true;
              break;
            case 'ql':
            case 'qr':
            case 'qj':
              isCenter = false;
              break;
            case 'ls':
            case 'ilvl':
              isList = true;
              break;
            case 'par':
              flushParagraph();
              break;
            case 'line':
              currentText += '\n';
              break;
            case 'tab':
              currentText += '\t';
              break;

            // ── Special characters ────────────────────────────────────────
            case 'endash':    currentText += '\u2013'; break;
            case 'emdash':    currentText += '\u2014'; break;
            case 'bullet':    currentText += '\u2022 '; break;
            case 'lquote':    currentText += '\u2018'; break;
            case 'rquote':    currentText += '\u2019'; break;
            case 'ldblquote': currentText += '\u201C'; break;
            case 'rdblquote': currentText += '\u201D'; break;
          }
        }
      }
    } else if (ch === '\r' || ch === '\n') {
      i++;
    } else {
      if (!state.skip) currentText += ch;
      i++;
    }
  }

  if (currentText || inlineParts.length > 0) flushParagraph();

  // ── Build HTML ────────────────────────────────────────────────────────────
  const htmlParts: string[] = [];
  let inList = false;

  for (const p of paras) {
    const content = p.html || '<br>';
    const s = p.styleIndex;

    if (p.isList) {
      if (!inList) { htmlParts.push('<ul>'); inList = true; }
      htmlParts.push(`  <li>${content}</li>`);
      continue;
    }
    if (inList) { htmlParts.push('</ul>'); inList = false; }

    // ── 1. Stylesheet-based heading detection (most reliable) ─────────────
    let headingLevel: number | null = null;
    if (s !== null) {
      if (headingStyleMap.has(s)) {
        headingLevel = headingStyleMap.get(s)!;
      } else if (headingStyleMap.size === 0 && s >= 1 && s <= 6) {
        headingLevel = s; // legacy fallback when document has no stylesheet
      }
    }

    // ── 2. Heuristic heading detection (manually-formatted legal headings) ─
    // Only fires when the stylesheet gave no match.  Legal documents commonly
    // use bold+caps, large font, or centred text instead of heading styles.
    if (headingLevel === null) {
      const text     = p.rawText.trim();
      const length   = text.length;
      const isShort  = length > 0 && length <= 100;
      const isUpper  = length > 0 && text === text.toUpperCase() && /[A-Z]/.test(text);
      const halfPt   = p.maxFontSz; // half-points; 24 = 12pt, 28 = 14pt, 36 = 18pt

      if (isShort) {
        if      (halfPt >= 52)                           headingLevel = 1; // ≥ 26pt
        else if (halfPt >= 40)                           headingLevel = 1; // ≥ 20pt
        else if (halfPt >= 32)                           headingLevel = 2; // ≥ 16pt
        else if (halfPt >= 28 && p.allBold)              headingLevel = 2; // 14pt + bold
        else if (p.isCenter && p.allBold && isUpper)     headingLevel = 2; // centred bold caps
        else if (p.isCenter && p.allBold && length <= 60) headingLevel = 3; // centred bold
        else if (p.allBold  && isUpper   && length <= 60) headingLevel = 3; // bold caps
      }
    }

    if (headingLevel !== null) {
      htmlParts.push(`<h${headingLevel}>${content}</h${headingLevel}>`);
    } else {
      htmlParts.push(`<p>${content}</p>`);
    }
  }

  if (inList) htmlParts.push('</ul>');

  return htmlParts.join('\n');
}

// ---------------------------------------------------------------------------
// Path 3: cfb + WordDocument stream text extraction
// Genuine binary Word 97-2003.  Text is stored as UTF-16 LE in the
// WordDocument OLE2 stream.  Formatting tables are in a separate binary
// structure we don't parse, so only plain text is recovered.
// ---------------------------------------------------------------------------

/**
 * Post-process the plain-text HTML produced by extractTextFromWordStream to
 * detect and mark up structural headings.
 *
 * Binary Word 97-2003 files carry no inline character formatting, so we rely
 * entirely on textual patterns that are highly reliable in legal documents:
 *
 *   1. Legal section/article numbering: "Article 1", "Section 2:", "1. Title",
 *      "1.1 Sub-section", Roman numerals "I. Something"
 *   2. ALL-CAPS short paragraphs (≤ 100 chars) — court headings, document
 *      titles, party names and section headers in African legal practice.
 *   3. Party designations (...PLAINTIFF, ...DEFENDANT, etc.) are kept as
 *      body paragraphs even when all-caps.
 *
 * Heading levels assigned:
 *   h2 — top-level sections: Article/Section/Clause keywords, numbered "N. Title",
 *         ALL CAPS ≤ 70 chars
 *   h3 — sub-sections: "N.N", Roman numerals, ALL CAPS 71–100 chars
 */
function applyBinaryDocHeuristics(rawHtml: string): string {
  // ── Pass 1: classify each line as heading or paragraph ──────────────────
  type Tagged = { kind: 'h2' | 'h3' | 'p'; line: string };
  const tagged: Tagged[] = [];

  for (const line of rawHtml.split('\n')) {
    const m = line.match(/^<p>([\s\S]*?)<\/p>$/);
    if (!m) { tagged.push({ kind: 'p', line }); continue; }

    const inner = m[1];
    const plain = inner.replace(/<[^>]*>/g, '').trim();
    if (!plain) continue; // drop empty <p></p>; we re-add spacers below

    const len = plain.length;
    let hl: 'h2' | 'h3' | null = null;

    // Legal section/article keywords: "Article 1", "SECTION 2:", "Schedule A"
    if (
      /^(article|section|clause|part|schedule|annexure|appendix|exhibit|addendum|attachment)\s+[\dA-Z]/i.test(plain) &&
      len <= 100
    ) {
      hl = 'h2';
    }
    // Numbered heading "N. Title" (not "1.1 sub-section")
    else if (/^\d+\.\s+\S/.test(plain) && !/^\d+\.\d/.test(plain) && len <= 80) {
      hl = 'h2';
    }
    // Sub-section "1.1 Something"
    else if (/^\d+\.\d+[\s.)]/.test(plain) && len <= 80) {
      hl = 'h3';
    }
    // Roman numeral heading "I. Something"
    else if (/^(I{1,3}|IV|VI{0,3}|IX|X{0,3}I{0,3}V?)\.\s+\S/i.test(plain) && len <= 80) {
      hl = 'h3';
    }
    // ALL-CAPS paragraph — very common in African legal court documents
    else if (plain === plain.toUpperCase() && /[A-Z]/.test(plain) && len >= 3) {
      const isPartyRef =
        /^\.{1,3}(plaintiff|defendant|appellant|respondent|petitioner|claimant|applicant|\d)/i.test(plain);
      if (!isPartyRef) {
        hl = len <= 70 ? 'h2' : len <= 100 ? 'h3' : null;
      }
    }

    if (hl) {
      tagged.push({ kind: hl, line: `<${hl}>${inner}</${hl}>` });
    } else {
      tagged.push({ kind: 'p', line });
    }
  }

  // ── Pass 2: insert blank spacers at structural transitions ───────────────
  // A blank <p><br></p> spacer is inserted:
  //   • before any heading that follows one or more body paragraphs
  //   • after the final heading in an opening heading block, before body text
  // This recovers the visual breathing room that was lost when the binary
  // extractor dropped the empty paragraph marks from the original document.
  const SPACER = '<p><br></p>';
  const out: string[] = [];

  for (let i = 0; i < tagged.length; i++) {
    const prev = i > 0 ? tagged[i - 1] : null;
    const curr = tagged[i];
    const next = i < tagged.length - 1 ? tagged[i + 1] : null;

    // Spacer before a heading that is preceded by body text
    if ((curr.kind === 'h2' || curr.kind === 'h3') && prev && prev.kind === 'p') {
      out.push(SPACER);
    }

    out.push(curr.line);

    // Spacer after the last heading in an opening block, before the first paragraph
    if ((curr.kind === 'h2' || curr.kind === 'h3') && next && next.kind === 'p') {
      out.push(SPACER);
    }
  }

  return out.join('\n');
}

function extractTextFromWordStream(buf: Buffer): string {
  const paragraphs: string[] = [];
  let para = '';

  // Only accept pairs whose high byte is 0x00 (U+0000–U+00FF).
  // Binary metadata routinely produces non-zero high bytes which would
  // otherwise decode as garbage Latin-Extended characters.
  for (let i = 0; i < buf.length - 1; i += 2) {
    const lo = buf[i];
    const hi = buf[i + 1];

    if (hi !== 0x00) {
      if (para.trim().length > 3) paragraphs.push(para.trim());
      para = '';
      continue;
    }

    if (lo === 0x0D || lo === 0x0B) {
      if (para.trim()) { paragraphs.push(para.trim()); para = ''; }
    } else if (lo === 0x09) {
      para += ' ';
    } else if (lo >= 0x20 && lo <= 0x7E) {
      para += String.fromCharCode(lo);
    } else if (lo >= 0xA0) {
      para += String.fromCharCode(lo); // Latin-1 supplement
    }
  }
  if (para.trim()) paragraphs.push(para.trim());

  // Binary header noise like "bjbj[i[i" has ≤4 consecutive letters and no
  // spaces.  Real text either has spaces (multi-word line → relax to 4+) or
  // is a single word long enough to be unambiguous (5+ consecutive letters).
  const valid = paragraphs.filter(p =>
    p.length > 3 &&
    (/[a-zA-Z]{5,}/.test(p) || (p.includes(' ') && /[a-zA-Z]{4,}/.test(p)))
  );
  if (valid.length > 0) {
    return valid.map(p => `<p>${escapeHtml(p)}</p>`).join('\n');
  }

  // ANSI / CP1252 fallback: scan raw Latin-1 bytes for printable ASCII runs
  const raw = buf.toString('latin1');
  const runs = raw.match(/[\x20-\x7E\t]{8,}/g) ?? [];
  const filtered = runs
    .map(r => r.trim())
    .filter(r => r.length > 5 && /[a-zA-Z]{3,}/.test(r));
  return filtered.map(r => `<p>${escapeHtml(r)}</p>`).join('\n');
}

// ---------------------------------------------------------------------------
// Path 0 helpers: Google Drive .doc → .docx conversion
// ---------------------------------------------------------------------------

// Style properties that must be preserved on table/cell elements to keep the
// form's column widths, borders, and cell padding intact.
const TABLE_STYLE_KEEP = /^(width|min-width|max-width|border(-[a-z]+)?|border-collapse|border-spacing|padding(-[a-z]+)?|vertical-align|text-align|background(-color)?|white-space)\s*:/i;

// HTML tags whose inline styles carry layout-critical information.
const TABLE_TAGS = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'col', 'colgroup']);

/**
 * Clean mammoth-generated HTML for the Lexical editor.
 * - Strips class attributes everywhere (mammoth's class names are unused).
 * - For table/cell elements: keeps layout-critical styles (width, border,
 *   padding, vertical-align, text-align, background-color).
 * - For all other elements: keeps only text-align.
 * This preserves the column structure of imported legal forms while removing
 * font/color/spacing noise that conflicts with the editor's own theme.
 */
function cleanMammothHtml(raw: string): string {
  return raw
    .replace(/\s*class="[^"]*"/g, '')
    // Single-pass style handler: checks which element owns the attribute by
    // looking backwards in the string for the most recent opening tag.
    .replace(/style="([^"]*)"/g, (match, style, offset, full: string) => {
      // Find the tag name that precedes this style="" attribute
      const before = (full as string).slice(0, offset);
      const tagMatch = before.match(/<([\w]+)[^>]*$/);
      const tag = tagMatch ? tagMatch[1].toLowerCase() : '';

      if (TABLE_TAGS.has(tag)) {
        // Keep only layout-critical properties for table/cell elements
        const kept = style
          .split(';')
          .map((s: string) => s.trim())
          .filter((s: string) => s && TABLE_STYLE_KEEP.test(s))
          .join('; ');
        return kept ? `style="${kept}"` : '';
      }

      // All other elements: keep only text-align
      const m = style.match(/text-align\s*:\s*[^;]+/);
      return m ? `style="${m[0].trim()}"` : '';
    })
    .replace(/<span>\s*<\/span>/g, '')
    .replace(/<p>\s*<\/p>/g, '<p><br></p>')
    .trim();
}

/**
 * Upload a binary .doc to Google Drive (which converts it to a Google Doc),
 * then immediately export it back as .docx.  The temporary Google Doc is
 * deleted in a finally block so no data persists in Drive.
 *
 * Credentials are resolved from, in order:
 *   1. GOOGLE_SERVICE_ACCOUNT_KEY  – JSON string (recommended for Vercel)
 *   2. GOOGLE_APPLICATION_CREDENTIALS – path to a JSON key file (local/server)
 *
 * Returns null (and logs) on any failure so callers can fall through.
 */
async function convertDocToDocxViaDrive(
  buffer: Buffer,
  filename: string,
): Promise<Buffer | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { google } = require('googleapis') as typeof import('googleapis');

    // ── Resolve service-account credentials ─────────────────────────────────
    //
    // Two supported env vars:
    //
    //   GOOGLE_SERVICE_ACCOUNT_KEY  – inline JSON string (single line, no outer
    //     quotes).  Recommended for Vercel / CI.  Example:
    //       GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":...}
    //
    //   GOOGLE_APPLICATION_CREDENTIALS – file path to a service-account JSON key
    //     file on the local filesystem.  This is the official Google convention.
    //     Example:  GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json
    //
    // NOTE: do NOT embed multiline JSON directly in GOOGLE_APPLICATION_CREDENTIALS.
    // dotenv stops reading at the first unescaped " inside a quoted value, so the
    // JSON is silently truncated.  Either use GOOGLE_SERVICE_ACCOUNT_KEY with a
    // single-line (minified) JSON string, or point GOOGLE_APPLICATION_CREDENTIALS
    // to a .json file on disk.

    /** Parse an inline JSON service-account string, stripping stray outer quotes. */
    function parseInlineCredentials(raw: string): Record<string, unknown> {
      // Strip a single layer of matching surrounding quotes dotenv may have left in.
      let val = raw.trim().replace(/^(["'])([\s\S]*)\1$/, '$2').trim();
      // Also remove any lone leading quote (value ends before matching closing quote).
      if ((val.startsWith('"') || val.startsWith("'")) && !val.endsWith(val[0])) {
        val = val.slice(1).trim();
      }
      return JSON.parse(val);
    }

    // Build a GoogleAuth instance from whichever credential source is available.
    // Returns null if neither is configured so the caller falls through silently.
    type GoogleAuthInstance = InstanceType<typeof google.auth.GoogleAuth>;
    let auth: GoogleAuthInstance | null = null;

    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      // Inline JSON string — parse and use directly.
      try {
        const credentials = parseInlineCredentials(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
      } catch (e) {
        console.info('[import-doc] GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON:', (e as Error).message);
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Must be a plain file path (the standard Google convention).
      // dotenv corrupts multiline JSON values, so we only accept this var as a
      // file path.  If the value starts with { or " it's (likely truncated) JSON
      // — skip silently and let the RTF/cfb fallback run instead.
      const credVal = process.env.GOOGLE_APPLICATION_CREDENTIALS.trim();
      if (!credVal.startsWith('{') && !credVal.startsWith('"') && !credVal.startsWith("'")) {
        auth = new google.auth.GoogleAuth({
          keyFile: credVal,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
      } else {
        console.info(
          '[import-doc] GOOGLE_APPLICATION_CREDENTIALS looks like embedded JSON (dotenv ' +
          'truncates multiline values). Save the key to a .json file and point the env var ' +
          'at that path, or put minified single-line JSON in GOOGLE_SERVICE_ACCOUNT_KEY.',
        );
      }
    }

    if (!auth) return null; // credentials not configured — skip silently

    const drive = google.drive({ version: 'v3', auth });

    // ── Step 1: upload the .doc; Drive converts it to Google Docs format ─────
    const safeName =
      filename.replace(/\.docx?$/i, '').replace(/[^\w\s-]/g, '').trim() || 'import';

    const uploadRes = await drive.files.create({
      requestBody: {
        name: safeName,
        mimeType: 'application/vnd.google-apps.document',
      },
      media: {
        mimeType: 'application/msword',
        // googleapis requires a Readable stream for the upload body.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        body: (() => {
          const { Readable } = require('stream') as typeof import('stream');
          return Readable.from(buffer);
        })(),
      },
      fields: 'id',
    });

    const fileId = uploadRes.data.id;
    if (!fileId) return null;

    try {
      // ── Step 2: export the Google Doc back as .docx ───────────────────────
      const exportRes = await drive.files.export(
        {
          fileId,
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        { responseType: 'arraybuffer' },
      );

      return Buffer.from(exportRes.data as ArrayBuffer);
    } finally {
      // ── Step 3: always delete the temp Google Doc — no data remains ────────
      await drive.files.delete({ fileId }).catch(() => {});
    }
  } catch (e) {
    console.info('[import-doc] Google Drive conversion:', (e as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, _userId: string) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return createBadRequestResponse('No file provided');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Path 0: Google Drive conversion ─────────────────────────────────────
    // Uploads the .doc to Drive (auto-converted to Google Docs format), exports
    // as .docx, deletes the temp file, then runs mammoth on the result.
    // Skipped silently when GOOGLE_SERVICE_ACCOUNT_KEY /
    // GOOGLE_APPLICATION_CREDENTIALS are not set.
    try {
      const docxBuf = await convertDocToDocxViaDrive(buffer, file.name);
      if (docxBuf) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mammoth = require('mammoth') as typeof import('mammoth');
        const result = await mammoth.convertToHtml({ buffer: docxBuf });
        if (result.value && result.value.trim().length > 0) {
          return createApiResponse({ html: cleanMammothHtml(result.value), quality: 'full' });
        }
      }
    } catch (e) {
      console.info('[import-doc] Path 0 (Drive → mammoth):', (e as Error).message);
    }

    // ── Path 1: mammoth ──────────────────────────────────────────────────────
    // Handles .doc files that are actually Office Open XML (.docx) — full
    // formatting, tables, lists.  Mammoth throws on genuine binary .doc, so
    // we catch and fall through.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth') as typeof import('mammoth');
      const result = await mammoth.convertToHtml({ buffer });
      if (result.value && result.value.trim().length > 0) {
        const html = result.value
          .replace(/\s*class="[^"]*"/g, '')
          .replace(/style="([^"]*)"/g, (_: string, s: string) => {
            const m = s.match(/text-align\s*:\s*[^;]+/);
            return m ? `style="${m[0].trim()}"` : '';
          })
          .replace(/<span>\s*<\/span>/g, '')
          .replace(/<p>\s*<\/p>/g, '<p><br></p>')
          .trim();
        return createApiResponse({ html, quality: 'full' });
      }
    } catch (e) {
      console.info('[import-doc] mammoth:', (e as Error).message);
    }

    // ── Path 2: RTF parser ───────────────────────────────────────────────────
    // Many .doc files are actually RTF (Google Docs, LibreOffice, older Word).
    // RTF is text-based with well-defined control words, so we can extract
    // headings, bold, italic, underline, and list structure.
    const rtfMagic = buffer.slice(0, 6).toString('ascii');
    console.info('[import-doc] file magic bytes:', JSON.stringify(buffer.slice(0, 8).toString('hex')));
    if (rtfMagic.startsWith('{\\rtf')) {
      try {
        const html = parseRtfToHtml(buffer);
        console.info('[import-doc] RTF path produced', html.length, 'chars; first 400:', html.slice(0, 400));
        if (html.trim().length > 0) {
          return createApiResponse({ html, quality: 'full' });
        }
      } catch (e) {
        console.info('[import-doc] RTF parse error:', (e as Error).message);
      }
    }

    // ── Path 3: cfb + binary text extraction ────────────────────────────────
    // Genuine Word 97-2003 binary format.  cfb is a transitive dep of xlsx.
    // Text is recovered but formatting (bold, headings, etc.) is lost.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const CFB = require('cfb') as {
        read: (data: Buffer, opts: { type: 'buffer' }) => unknown;
        find: (cfb: unknown, name: string) => { content: Uint8Array } | null;
      };
      const parsed = CFB.read(buffer, { type: 'buffer' });
      const entry = CFB.find(parsed, 'WordDocument');
      if (entry?.content) {
        const rawHtml = extractTextFromWordStream(Buffer.from(entry.content));
        const html    = applyBinaryDocHeuristics(rawHtml);
        console.info('[import-doc] cfb path produced', html.length, 'chars; first 600:', html.slice(0, 600));
        if (html.length > 0) {
          return createApiResponse({ html, quality: 'text-only' });
        }
      }
    } catch (e) {
      console.info('[import-doc] cfb extraction:', (e as Error).message);
    }

    return NextResponse.json(
      {
        error:
          'Could not extract content from this .doc file. ' +
          'Please open it in Microsoft Word or Google Docs and save as .docx, then import again.',
      },
      { status: 422 }
    );
  })
);
