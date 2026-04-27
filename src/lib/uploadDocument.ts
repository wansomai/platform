// src/lib/uploadDocument.ts
// Client-side upload: browser → Vercel Blob directly (no serverless body limit),
// then registers the document via a JSON POST to /api/documents.
import { upload } from '@vercel/blob/client';
import { apiService } from '@/lib/api';
import type { Document } from '@/types/documents';

export interface UploadDocumentOptions {
  description?: string;
  folderId?: string | null;
  customTitle?: string | null;
  organizationId?: string | null;
  onProgress?: ((progress: number) => void) | null;
}

export async function uploadDocumentClientSide(
  file: File,
  options: UploadDocumentOptions = {}
): Promise<Document> {
  const { description = '', folderId = null, customTitle = null, organizationId = null, onProgress } = options;

  onProgress?.(5);

  // Step 1: upload file directly to Vercel Blob — bypasses the serverless function entirely.
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/documents/upload-token',
  });

  onProgress?.(85);

  // Step 2: register the document in the database with the blob URL.
  const payload: Record<string, unknown> = {
    blobUrl: blob.url,
    filename: file.name,
    fileType: file.type,
    fileSize: file.size,
    description,
    folderId,
    customTitle,
  };
  if (organizationId) payload.organizationId = organizationId;

  const response = await apiService.post<{ status: number; message: string; data: Document }>(
    '/api/documents',
    payload
  );

  onProgress?.(100);

  return response.data;
}
