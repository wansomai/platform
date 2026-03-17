// src/lib/documentContentFallback.ts
// On-demand document content extraction when DB has no content (e.g. new DOCX from Vault).
// Used by the messages route so Gemini can review documents even if DocumentContent was never populated.

import prisma from '@/lib/prisma';
import { blobStorageService } from '@/lib/storage';
import { extractTextFromFile, getMimeTypeFromFileExtension } from '@/lib/documentParser';

export type DocumentForExtraction = {
  id: string;
  file_url: string;
  file_type: string;
};

// File types that Gemini processes natively as inline data — no text extraction possible.
const IMAGE_TYPES = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']);
// PDF may be text-based (extract) or scanned (sentinel for Gemini vision).
const PDF_TYPES = new Set(['pdf']);

// ─── Concurrency limiter ────────────────────────────────────────────────────
// Caps the number of simultaneous document downloads + extractions so we don't
// exhaust the network connection pool or run out of memory on large batches.
// Each concurrent slot: 1 Blob download (up to 20 MB) + in-memory extraction.
// 5 concurrent = safe for Vercel's 1 GB serverless memory limit.
const MAX_CONCURRENT_EXTRACTIONS = 5;

class Semaphore {
  private available: number;
  private readonly queue: Array<() => void> = [];

  constructor(maxConcurrent: number) {
    this.available = maxConcurrent;
  }

  acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return Promise.resolve();
    }
    return new Promise<void>(resolve => this.queue.push(resolve));
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.available++;
    }
  }
}

// ─── Per-document timeout ────────────────────────────────────────────────────
// Prevents a single slow/hung extraction from blocking the entire batch.
// 40 s covers: up to 3 download attempts (20 s each with backoff) + extraction.
const PER_DOCUMENT_TIMEOUT_MS = 40_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`extraction timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ────────────────────────────────────────────────────────────────────────────

/**
 * If the document has no content in DB, extract and persist it.
 *
 * - Images → [SCANNED_IMAGE_REQUIRES_PROCESSING] sentinel (Gemini handles natively)
 * - PDFs → text extraction; scanned PDFs get [SCANNED_PDF_REQUIRES_PROCESSING]
 * - DOCX/XLSX/CSV/TXT → mammoth / xlsx / csv-parse text extraction
 *   If extraction fails or returns nothing, we return null WITHOUT writing to DB
 *   so the next message can retry (instead of caching a bad sentinel permanently).
 *
 * Returns the content string (or sentinel) on success, null on unrecoverable failure.
 */
export async function tryExtractDocumentContentOnDemand(
  doc: DocumentForExtraction
): Promise<string | null> {
  const ext = (doc.file_type || '').toLowerCase().trim();

  // ── Images ──────────────────────────────────────────────────────────────
  if (IMAGE_TYPES.has(ext)) {
    const sentinel = '[SCANNED_IMAGE_REQUIRES_PROCESSING]';
    await persistContent(doc.id, sentinel);
    return sentinel;
  }

  // ── PDFs ────────────────────────────────────────────────────────────────
  if (PDF_TYPES.has(ext)) {
    const mimeType = getMimeTypeFromFileExtension(ext);
    if (mimeType) {
      try {
        const fileBuffer = await blobStorageService.downloadFile(doc.file_url);
        const extractedText = await extractTextFromFile(fileBuffer, mimeType);
        // Meaningful text was extracted from a text-based PDF
        if (extractedText && extractedText.trim().length > 50 &&
            extractedText !== '[SCANNED_PDF_REQUIRES_PROCESSING]') {
          await persistContent(doc.id, extractedText);
          return extractedText;
        }
      } catch {
        // Network or parsing error — fall through to scanned sentinel
      }
    }
    // Scanned or unreadable PDF — let Gemini handle it natively via inline data
    const sentinel = '[SCANNED_PDF_REQUIRES_PROCESSING]';
    await persistContent(doc.id, sentinel);
    return sentinel;
  }

  // ── Text-extractable types: DOCX, XLSX, CSV, TXT, DOC, XLS ─────────────
  const mimeType = getMimeTypeFromFileExtension(ext);
  if (!mimeType) return null;

  try {
    const fileBuffer = await blobStorageService.downloadFile(doc.file_url);
    const extractedText = await extractTextFromFile(fileBuffer, mimeType);

    // Only persist if we got real content (not an empty string or a sentinel).
    // Returning null (without persisting) keeps the document eligible for retry
    // on the next message, rather than caching a permanently broken state.
    if (extractedText && extractedText.trim().length > 50 &&
        !extractedText.startsWith('[SCANNED_')) {
      await persistContent(doc.id, extractedText);
      return extractedText;
    }

    // Extraction yielded nothing useful — do not persist, allow future retry
    return null;
  } catch (error) {
    console.error(`[documentContentFallback] On-demand extraction failed for document ${doc.id}:`, error);
    // Do not persist a sentinel for Office documents — Gemini cannot accept them
    // as inline data anyway, and caching a bad sentinel blocks all future retries.
    return null;
  }
}

/**
 * Run extraction for multiple documents with bounded concurrency and per-document
 * timeouts. Updates each docRef in-place so content is ready before building
 * the Gemini prompt.
 *
 * Uses a Semaphore so at most MAX_CONCURRENT_EXTRACTIONS documents are downloaded
 * and processed simultaneously, preventing connection-pool exhaustion and OOM on
 * large batches. Each individual extraction is capped at PER_DOCUMENT_TIMEOUT_MS
 * so a single hung download cannot block the entire request.
 */
export async function extractMissingDocumentContents(
  docRefs: Array<{ document: { id: string; file_url: string; file_type: string; content: { content: string } | null } }>
): Promise<void> {
  const missing = docRefs.filter(d => !d.document.content?.content?.trim());
  if (missing.length === 0) return;

  // One semaphore per call — scoped to this batch so concurrent requests don't
  // share state (each serverless invocation is isolated anyway).
  const semaphore = new Semaphore(MAX_CONCURRENT_EXTRACTIONS);

  await Promise.all(
    missing.map(async (docRef) => {
      await semaphore.acquire();
      try {
        const extracted = await withTimeout(
          tryExtractDocumentContentOnDemand({
            id: docRef.document.id,
            file_url: docRef.document.file_url,
            file_type: docRef.document.file_type,
          }),
          PER_DOCUMENT_TIMEOUT_MS
        );
        if (extracted != null) {
          docRef.document.content = { content: extracted };
        }
      } catch (err) {
        // Per-document timeout or unexpected error — log and skip this document
        // so the rest of the batch can still complete.
        console.error(
          `[documentContentFallback] Skipping document ${docRef.document.id} (${docRef.document.file_type}):`,
          err instanceof Error ? err.message : err
        );
      } finally {
        semaphore.release();
      }
    })
  );
}

async function persistContent(documentId: string, content: string): Promise<void> {
  try {
    await prisma.documentContent.upsert({
      where: { documentId },
      create: { documentId, content },
      update: { content },
    });
    await prisma.document.update({
      where: { id: documentId },
      data: { content_extracted: { Bool: true, Valid: true } },
    });
  } catch (error) {
    console.error(`[documentContentFallback] Failed to persist content for ${documentId}:`, error);
  }
}
