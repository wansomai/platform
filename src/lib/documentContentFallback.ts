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
const SCANNED_PDF_TYPES = new Set(['pdf']);
const IMAGE_TYPES = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']);

/**
 * If the document has no content in DB, extract and persist it. For text-based files
 * (DOCX, XLSX, CSV, TXT) the extracted text is returned and stored. For image files and
 * PDFs (which may be scanned), the appropriate sentinel string is written to DB so the
 * messages route knows to send them to Gemini as inline data parts.
 *
 * Returns the content string (or sentinel) on success, null on unrecoverable failure.
 */
export async function tryExtractDocumentContentOnDemand(
  doc: DocumentForExtraction
): Promise<string | null> {
  const ext = (doc.file_type || '').toLowerCase().trim();

  // For image types, write the sentinel so Gemini processes them as inline data
  if (IMAGE_TYPES.has(ext)) {
    const sentinel = '[SCANNED_IMAGE_REQUIRES_PROCESSING]';
    await persistContent(doc.id, sentinel);
    return sentinel;
  }

  // For PDFs, attempt text extraction first; fall back to scanned sentinel if it fails or yields nothing
  if (SCANNED_PDF_TYPES.has(ext)) {
    const mimeType = getMimeTypeFromFileExtension(ext);
    if (mimeType) {
      try {
        const fileBuffer = await blobStorageService.downloadFile(doc.file_url);
        const extractedText = await extractTextFromFile(fileBuffer, mimeType);
        if (extractedText && extractedText.trim().length > 50) {
          await persistContent(doc.id, extractedText);
          return extractedText;
        }
      } catch {
        // Fall through to scanned sentinel
      }
    }
    const sentinel = '[SCANNED_PDF_REQUIRES_PROCESSING]';
    await persistContent(doc.id, sentinel);
    return sentinel;
  }

  // For all other text-extractable types (DOCX, XLSX, CSV, TXT, DOC, XLS)
  const mimeType = getMimeTypeFromFileExtension(ext);
  if (!mimeType) return null;

  try {
    const fileBuffer = await blobStorageService.downloadFile(doc.file_url);
    const extractedText = await extractTextFromFile(fileBuffer, mimeType);
    await persistContent(doc.id, extractedText);
    return extractedText;
  } catch (error) {
    console.error(`[documentContentFallback] On-demand extraction failed for document ${doc.id}:`, error);
    // Fall back to scanned sentinel so Gemini can still process the file natively
    // rather than silently dropping the document from the context.
    const sentinel = '[SCANNED_PDF_REQUIRES_PROCESSING]';
    await persistContent(doc.id, sentinel);
    return sentinel;
  }
}

/**
 * Run extraction for multiple documents in parallel and update each docRef in-place.
 * Call this before the document processing loop in the messages route so all content
 * is ready before building the Gemini prompt.
 */
export async function extractMissingDocumentContents(
  docRefs: Array<{ document: { id: string; file_url: string; file_type: string; content: { content: string } | null } }>
): Promise<void> {
  const missing = docRefs.filter(d => !d.document.content?.content?.trim());
  if (missing.length === 0) return;

  await Promise.all(
    missing.map(async (docRef) => {
      const extracted = await tryExtractDocumentContentOnDemand({
        id: docRef.document.id,
        file_url: docRef.document.file_url,
        file_type: docRef.document.file_type,
      });
      if (extracted != null) {
        docRef.document.content = { content: extracted };
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
