// src/lib/blob-storage.ts
import { put, del, list, head } from '@vercel/blob';

export class BlobStorageService {
  /**
   * Upload a file to Vercel Blob storage
   * @param fileBuffer The file buffer
   * @param fileName The name to use for the file (including path)
   * @param contentType The MIME type of the file
   * @returns URL of the uploaded file
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    try {
      const blob = await put(fileName, fileBuffer, {
        contentType,
        access: 'public', // or 'private' if you need access control
      });
      
      return blob.url;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a file from storage
   * @param url The URL of the file to delete
   */
  async deleteFile(url: string): Promise<void> {
    try {
      await del(url);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a file URL
   * @param url The URL of the file
   * @returns URL to access the file
   */
  async getFileUrl(url: string): Promise<string> {
    // For public files, return the URL directly
    return url;
  }

  /**
   * Download a file from storage with automatic retries and a per-attempt timeout.
   * Retries on transient network errors (timeouts, 5xx, connection resets).
   * Does NOT retry on 404 (file genuinely missing).
   *
   * @param url The URL of the file to download
   * @returns Buffer containing the file data
   */
  async downloadFile(url: string): Promise<Buffer> {
    const MAX_ATTEMPTS = 3;
    const ATTEMPT_TIMEOUT_MS = 20_000; // 20 s per attempt
    const BACKOFF_MS = [0, 500, 1_000]; // wait before attempt 1, 2, 3

    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (BACKOFF_MS[attempt] > 0) {
        await new Promise(resolve => setTimeout(resolve, BACKOFF_MS[attempt]));
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (!response.ok) {
          const err = new Error(`Failed to download file: ${response.status} ${response.statusText}`);
          // 404 means the file doesn't exist — no point retrying
          if (response.status === 404) throw err;
          throw err;
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (error) {
        clearTimeout(timer);
        lastError = error;

        // Do not retry on 404
        if (error instanceof Error && error.message.includes('404')) break;
        // Do not retry on the last attempt
        if (attempt === MAX_ATTEMPTS - 1) break;
      }
    }

    throw lastError;
  }
}

// Create and export a singleton instance
export const blobStorageService = new BlobStorageService();