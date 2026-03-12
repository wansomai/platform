// POST /api/documents/[id]/reprocess
// Re-attempts content extraction for a vault document that previously failed.
// Always resolves content_extracted to true so the Vault stops polling.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';
import { blobStorageService } from '@/lib/storage';
import { extractTextFromFile, getMimeTypeFromFileExtension } from '@/lib/documentParser';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: 'Authentication required', error: true }, { status: 401 });
    }

    const { id: documentId } = await params;
    const organizationId = await getActiveOrganizationId(userId);

    // Verify the document exists and belongs to the user's active organization
    const document = await prisma.document.findFirst({
      where: { id: documentId, organization_id: organizationId },
      select: {
        id: true,
        file_url: true,
        file_type: true,
        content_extracted: true,
        content: { select: { content: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ message: 'Document not found', error: true }, { status: 404 });
    }

    // If already fully extracted with content, nothing to do
    const alreadyExtracted =
      document.content_extracted != null &&
      typeof document.content_extracted === 'object' &&
      'Bool' in (document.content_extracted as object) &&
      (document.content_extracted as { Bool: boolean }).Bool === true;

    if (alreadyExtracted && document.content?.content?.trim()) {
      return NextResponse.json({
        status: 200,
        message: 'Content already extracted',
        data: { contentExtracted: true },
      });
    }

    // Attempt re-extraction
    const mimeType = getMimeTypeFromFileExtension(document.file_type);
    let extractedText = '';

    if (mimeType) {
      try {
        const fileBuffer = await blobStorageService.downloadFile(document.file_url);
        extractedText = await extractTextFromFile(fileBuffer, mimeType);
      } catch (err) {
        console.error(`[reprocess] Extraction error for ${documentId}:`, err);
        // Falls through — we still mark content_extracted=true below to stop polling
      }
    }

    // Persist content if we got something useful
    if (extractedText && extractedText.trim().length > 0) {
      await prisma.documentContent.upsert({
        where: { documentId },
        create: { documentId, content: extractedText },
        update: { content: extractedText },
      });
    }

    // Always mark content_extracted=true so the Vault stops the infinite polling.
    // If extraction still failed, on-demand re-extraction runs again at chat time.
    await prisma.document.update({
      where: { id: documentId },
      data: { content_extracted: { Bool: true, Valid: true } },
    });

    return NextResponse.json({
      status: 200,
      message: extractedText.trim().length > 0
        ? 'Content extracted successfully'
        : 'Extraction attempted; document will be processed at chat time',
      data: { contentExtracted: true },
    });
  } catch (error) {
    console.error('[reprocess] Unexpected error:', error);
    return NextResponse.json({ message: 'Failed to reprocess document', error: true }, { status: 500 });
  }
}
