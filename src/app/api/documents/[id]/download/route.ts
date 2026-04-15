import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';
import { blobStorageService } from '@/lib/storage';
import { getMimeTypeFromFileExtension } from '@/lib/documentParser';

const sanitizeFileName = (value: string): string =>
  value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, ' ').trim();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const documentId = (await params).id;
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true },
        { status: 401 }
      );
    }

    const organizationId = await getActiveOrganizationId(userId);

    const hasExplicitPermission = (prisma as any).documentPermission
      ? await (prisma as any).documentPermission.findFirst({
          where: { documentId, userId },
          select: { documentId: true },
        })
      : null;

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        organization_id: organizationId,
        OR: [
          { created_by: userId },
          { visibility: 'organization' },
          ...(hasExplicitPermission ? [{ id: documentId }] : []),
        ],
      },
      select: {
        id: true,
        title: true,
        file_type: true,
        file_url: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { message: 'Document not found', error: true },
        { status: 404 }
      );
    }

    const fileBuffer = await blobStorageService.downloadFile(document.file_url);
    const body = new Uint8Array(fileBuffer);
    const extension = (document.file_type || '').toLowerCase();
    const mimeType =
      getMimeTypeFromFileExtension(extension) || 'application/octet-stream';
    const fileName = sanitizeFileName(
      `${document.title}.${extension || 'bin'}`
    );

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { message: 'Failed to download document', error: true },
      { status: 500 }
    );
  }
}
