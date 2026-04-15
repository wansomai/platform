// src/services/kbSummaryService.ts
// Generates and manages document summaries for Associate knowledge bases.

import { GoogleGenAI } from '@google/genai';
import prisma from '@/lib/prisma';
import { blobStorageService } from '@/lib/storage';
import { tryExtractDocumentContentOnDemand } from '@/lib/documentContentFallback';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MAX_TEXT_FOR_SUMMARY = 200_000;

export interface KBDocumentStatus {
  documentId: string;
  title: string;
  fileType: string;
  textExtracted: boolean;
  summaryGenerated: boolean;
  rulesGenerated: boolean;
  rulesForThinking?: string;
  contentLength: number;
  error?: string;
}

export interface KBProcessingResult {
  processed: KBDocumentStatus[];
  allExtracted: boolean;
  allSummarized: boolean;
}

/**
 * Generates a concise, high-quality summary of a document's content using Gemini.
 * Returns null if generation fails (caller decides what to do).
 */
async function generateSummary(title: string, content: string): Promise<string | null> {
  try {
    const truncated = content.length > MAX_TEXT_FOR_SUMMARY
      ? content.slice(0, MAX_TEXT_FOR_SUMMARY) + '\n\n[... remainder truncated for summarization]'
      : content;

    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17',
      contents: [{
        role: 'user',
        parts: [{ text: `You are a legal document analyst. Produce a comprehensive summary of the following document.

**Document title**: ${title}

**Requirements**:
1. Capture ALL key facts, parties, dates, obligations, conditions, and legal provisions.
2. Preserve the document's logical structure (sections, clauses, schedules).
3. Highlight any definitions, thresholds, deadlines, or unusual/non-standard provisions.
4. Note the document type, governing law/jurisdiction if stated, and effective dates.
5. Keep the summary between 500–2000 words depending on document complexity.
6. Use clear headings and bullet points for scannability.
7. Do NOT add opinions or analysis — only factual extraction.

**Document content**:
${truncated}` }],
      }],
      config: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    });

    const summary = result?.candidates?.[0]?.content?.parts
      ?.filter((p: any) => p.text)
      ?.map((p: any) => p.text)
      ?.join('') ?? '';

    return summary.trim() || null;
  } catch (err) {
    console.error(`[kbSummaryService] Failed to generate summary for "${title}":`, err);
    return null;
  }
}

async function generateGroundedRules(
  title: string,
  content: string,
  summary: string
): Promise<string | null> {
  try {
    const contentSlice = content.length > 120_000
      ? `${content.slice(0, 120_000)}\n\n[... remainder truncated for rule extraction]`
      : content;

    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17',
      contents: [{
        role: 'user',
        parts: [{ text: `Convert this legal KB into grounded operating rules for the agent.

Document title: ${title}

Summary:
${summary}

Content:
${contentSlice}

Output 8-15 concise bullet rules grounded ONLY in this document.
Focus on obligations, constraints, drafting standards, risk checks, and conditional instructions ("When X, do Y").
No intro/outro.` }],
      }],
      config: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    const rules = result?.candidates?.[0]?.content?.parts
      ?.filter((p: any) => p.text)
      ?.map((p: any) => p.text)
      ?.join('') ?? '';

    const normalized = normalizeRulesForThinking(rules);
    return normalized || null;
  } catch (err) {
    console.error(`[kbSummaryService] Failed to generate grounded rules for "${title}":`, err);
    return null;
  }
}

function normalizeRulesForThinking(rawRules: string): string {
  if (!rawRules) return '';

  const cleanedLines = rawRules
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^#{1,6}\s+/, '')) // markdown headers
    .map((line) => line.replace(/^[-*]\s+/, '')) // bullets
    .map((line) => line.replace(/^\d+[.)]\s+/, '')) // numbering
    .map((line) => line.replace(/^\*\*(.+?)\*\*:\s*/, '$1: ')) // bold lead label
    .map((line) => line.replace(/^\*\*(.+?)\*\*$/, '$1')) // whole-line bold
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^rules for thinking:?$/i.test(line))
    .filter((line) => !/^document( title)?:/i.test(line));

  // Deduplicate and cap to keep outputs concise and scannable.
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const line of cleanedLines) {
    const key = line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(line);
    }
  }

  return unique
    .slice(0, 20)
    .map((line, idx) => `${idx + 1}. ${line}`)
    .join('\n');
}

function getMimeTypeFromFileType(fileType: string): string | null {
  const ext = (fileType || '').toLowerCase().trim();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'gif': return 'image/gif';
    case 'bmp': return 'image/bmp';
    case 'webp': return 'image/webp';
    default: return null;
  }
}

async function generateSummaryFromBinary(
  title: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string | null> {
  try {
    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17',
      contents: [{
        role: 'user',
        parts: [
          {
            text: `You are a legal document analyst. The attached file may be scanned.
Produce a comprehensive factual summary.

**Document title**: ${title}

**Requirements**:
1. Capture key facts, parties, dates, obligations, conditions, and legal provisions.
2. Preserve structure (sections/clauses where identifiable).
3. Note governing law/jurisdiction and effective dates if present.
4. Mention any unclear/illegible portions explicitly.
5. Keep between 300-1500 words depending on complexity.
6. Use headings and bullets.
7. Do not invent missing details.`
          },
          {
            inlineData: {
              mimeType,
              data: fileBuffer.toString('base64'),
            },
          },
        ],
      }],
      config: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    });

    const summary = result?.candidates?.[0]?.content?.parts
      ?.filter((p: any) => p.text)
      ?.map((p: any) => p.text)
      ?.join('') ?? '';

    return summary.trim() || null;
  } catch (err) {
    console.error(`[kbSummaryService] Failed to generate binary summary for "${title}":`, err);
    return null;
  }
}

/**
 * Processes KB documents for an associate: validates extraction, generates
 * summaries for documents that don't have one yet, and stores summaries
 * in Document.metadata.kbSummary.
 *
 * Runs summary generation in parallel across all documents for speed.
 */
export async function processKBDocuments(documentIds: string[]): Promise<KBProcessingResult> {
  if (!documentIds || documentIds.length === 0) {
    return { processed: [], allExtracted: true, allSummarized: true };
  }

  const documents = await prisma.document.findMany({
    where: { id: { in: documentIds } },
    include: { content: { select: { content: true } } },
    orderBy: { created_at: 'asc' },
  });

  const statusPromises = documents.map(async (doc): Promise<KBDocumentStatus> => {
    const rawText = doc.content?.content ?? '';
    const rawIsSentinel = rawText === '[SCANNED_PDF_REQUIRES_PROCESSING]'
      || rawText === '[SCANNED_IMAGE_REQUIRES_PROCESSING]';
    const rawHasText = rawText.length > 0 && !rawIsSentinel;
    const existingMetadata = (doc.metadata as Record<string, any>) ?? {};
    const existingSummary = existingMetadata.kbSummary as string | undefined;
    const existingRules = existingMetadata.kbAgentRules as string | undefined;

    // Reuse the same extraction fallback used by chat/review.
    let effectiveText = rawHasText ? rawText : '';
    let isSentinel = rawIsSentinel;
    if (!effectiveText) {
      const extracted = await tryExtractDocumentContentOnDemand({
        id: doc.id,
        file_url: doc.file_url,
        file_type: doc.file_type,
      });
      if (extracted) {
        isSentinel = extracted === '[SCANNED_PDF_REQUIRES_PROCESSING]'
          || extracted === '[SCANNED_IMAGE_REQUIRES_PROCESSING]';
        if (!isSentinel && extracted.trim().length > 0) {
          effectiveText = extracted;
        }
      }
    }
    const hasText = effectiveText.length > 0;

    if (existingSummary && existingSummary.length > 50 && existingRules && existingRules.length > 20) {
      return {
        documentId: doc.id,
        title: doc.title,
        fileType: doc.file_type,
        textExtracted: hasText,
        summaryGenerated: true,
        rulesGenerated: true,
        rulesForThinking: existingRules,
        contentLength: hasText ? effectiveText.length : 0,
      };
    }

    if (!hasText) {
      // Fallback: for scanned/image docs, attempt direct binary summarization with Gemini.
      if (isSentinel) {
        const mimeType = getMimeTypeFromFileType(doc.file_type);
        if (mimeType) {
          try {
            const fileBuffer = await blobStorageService.downloadFile(doc.file_url);
            const binarySummary = await generateSummaryFromBinary(doc.title, fileBuffer, mimeType);
            if (binarySummary) {
              const groundedRules = await generateGroundedRules(doc.title, binarySummary, binarySummary);
              try {
                await prisma.document.update({
                  where: { id: doc.id },
                  data: {
                    metadata: {
                      ...existingMetadata,
                      kbSummary: binarySummary,
                      ...(groundedRules ? { kbAgentRules: groundedRules } : {}),
                      ...(groundedRules ? { kbRuleVersion: 1 } : {}),
                      kbSummaryGeneratedAt: new Date().toISOString(),
                    },
                  },
                });
              } catch (err) {
                console.error(`[kbSummaryService] Failed to persist binary summary for doc ${doc.id}:`, err);
              }

              return {
                documentId: doc.id,
                title: doc.title,
                fileType: doc.file_type,
                textExtracted: false,
                summaryGenerated: true,
                rulesGenerated: !!groundedRules,
                ...(groundedRules ? { rulesForThinking: groundedRules } : {}),
                contentLength: 0,
              };
            }
          } catch (err) {
            console.error(`[kbSummaryService] Failed binary summary download/process for doc ${doc.id}:`, err);
          }
        }
      }

      return {
        documentId: doc.id,
        title: doc.title,
        fileType: doc.file_type,
        textExtracted: false,
        summaryGenerated: false,
        rulesGenerated: false,
        contentLength: 0,
        error: isSentinel
          ? 'Document is scanned/image-based and summary could not be generated automatically'
          : 'No text could be extracted from this document',
      };
    }

    const summary = await generateSummary(doc.title, effectiveText);
    const groundedRules = summary
      ? await generateGroundedRules(doc.title, effectiveText, summary)
      : null;

    if (summary || groundedRules) {
      try {
        await prisma.document.update({
          where: { id: doc.id },
          data: {
            metadata: {
              ...existingMetadata,
              ...(summary ? { kbSummary: summary, kbSummaryGeneratedAt: new Date().toISOString() } : {}),
              ...(groundedRules ? { kbAgentRules: groundedRules } : {}),
              ...(groundedRules ? { kbRuleVersion: 1 } : {}),
            },
          },
        });
      } catch (err) {
        console.error(`[kbSummaryService] Failed to persist summary for doc ${doc.id}:`, err);
      }
    }

    return {
      documentId: doc.id,
      title: doc.title,
      fileType: doc.file_type,
      textExtracted: true,
      summaryGenerated: !!summary,
      rulesGenerated: !!groundedRules,
      ...(groundedRules ? { rulesForThinking: groundedRules } : {}),
      contentLength: effectiveText.length,
      ...(!summary && { error: 'Summary generation failed — document content is still available' }),
    };
  });

  const processed = await Promise.all(statusPromises);

  return {
    processed,
    allExtracted: processed.every(p => p.textExtracted),
    allSummarized: processed.every(p => p.summaryGenerated),
  };
}

/**
 * Loads KB documents with both raw text and summary for runtime injection
 * into an associate's system prompt. Returns structured data per document
 * preserving the original ID order from the associate's knowledgeBase array.
 */
export async function loadKBDocumentsWithSummaries(
  documentIds: string[]
): Promise<Array<{
  id: string;
  title: string;
  fileType: string;
  summary: string | null;
  groundedRules: string | null;
  content: string | null;
  contentLength: number;
}>> {
  if (!documentIds || documentIds.length === 0) return [];

  const documents = await prisma.document.findMany({
    where: { id: { in: documentIds } },
    include: { content: { select: { content: true } } },
  });

  const docMap = new Map(documents.map(d => [d.id, d]));

  return documentIds
    .map(id => docMap.get(id))
    .filter(Boolean)
    .map(doc => {
      const rawText = doc!.content?.content ?? '';
      const isSentinel = rawText === '[SCANNED_PDF_REQUIRES_PROCESSING]'
        || rawText === '[SCANNED_IMAGE_REQUIRES_PROCESSING]';
      const usableText = (rawText && !isSentinel) ? rawText : null;
      const metadata = (doc!.metadata as Record<string, any>) ?? {};
      const summary = (metadata.kbSummary as string) ?? null;
      const groundedRules = (metadata.kbAgentRules as string) ?? null;

      return {
        id: doc!.id,
        title: doc!.title,
        fileType: doc!.file_type,
        summary,
        groundedRules,
        content: usableText,
        contentLength: usableText?.length ?? 0,
      };
    });
}
