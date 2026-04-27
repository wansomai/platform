// src/app/api/documents/upload-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { ALLOWED_FILE_TYPES, FILE_UPLOAD_CONFIG } from '@/lib/utils/constants';

export const maxDuration = 60;

/**
 * Generates a one-time Vercel Blob client upload token.
 * The browser calls this, then uploads the file directly to Vercel Blob,
 * bypassing the serverless function body size limit entirely.
 * DB record creation is handled separately via POST /api/documents (JSON body).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname) => {
        return {
          allowedContentTypes: ALLOWED_FILE_TYPES,
          maximumSizeInBytes: FILE_UPLOAD_CONFIG.MAX_SIZE,
          tokenPayload: session.user.id,
        };
      },
      onUploadCompleted: async () => {
        // DB record creation is handled client-side via a follow-up POST /api/documents.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('[upload-token]', error);
    return NextResponse.json({ error: 'Failed to generate upload token' }, { status: 400 });
  }
}
