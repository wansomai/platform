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
   * Download a file from storage
   * @param url The URL of the file to download
   * @returns Buffer containing the file data
   */
  async downloadFile(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
export const blobStorageService = new BlobStorageService();