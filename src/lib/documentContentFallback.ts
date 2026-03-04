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

/**
 * If the document has no content in DB, download the file, extract text (e.g. via mammoth for DOCX),
 * persist to DocumentContent, update Document.content_extracted, and return the content.
 * Returns null if type is unsupported, download/extraction fails, or content already exists (caller should read from DB).
 * Call this when docRef.document.content?.content is missing or empty; then assign the result to docRef.document.content and use for context.
 */
export async function tryExtractDocumentContentOnDemand(
  doc: DocumentForExtraction
): Promise<string | null> {
  const mimeType = getMimeTypeFromFileExtension(doc.file_type);
  if (!mimeType) return null;

  try {
    const fileBuffer = await blobStorageService.downloadFile(doc.file_url);
    const extractedText = await extractTextFromFile(fileBuffer, mimeType);

    // Persist for future use (upsert so we don't fail if another request just wrote it)
    await prisma.documentContent.upsert({
      where: { documentId: doc.id },
      create: { documentId: doc.id, content: extractedText },
      update: { content: extractedText },
    });

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        content_extracted: { Bool: true, Valid: true },
      },
    });

    return extractedText;
  } catch (error) {
    console.error(`[documentContentFallback] On-demand extraction failed for document ${doc.id}:`, error);
    return null;
  }
}
