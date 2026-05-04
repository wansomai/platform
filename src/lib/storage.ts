import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = process.env.GOOGLE_CLOUD_STORAGE_BUCKET!;

// Singleton GCS client — reused across requests in the same process
let _storage: Storage | null = null;
function getStorage(): Storage {
  if (!_storage) _storage = new Storage();
  return _storage;
}

function gcsUrl(pathname: string): string {
  return `https://storage.googleapis.com/${BUCKET_NAME}/${pathname}`;
}

function pathnameFromGcsUrl(url: string): string | null {
  const prefix = `https://storage.googleapis.com/${BUCKET_NAME}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

export class BlobStorageService {
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    const file = getStorage().bucket(BUCKET_NAME).file(fileName);
    await file.save(fileBuffer, { metadata: { contentType }, resumable: false });
    await file.makePublic();
    return gcsUrl(fileName);
  }

  async deleteFile(url: string): Promise<void> {
    const pathname = pathnameFromGcsUrl(url);
    if (!pathname) return; // unrecognised URL — skip silently
    await getStorage().bucket(BUCKET_NAME).file(pathname).delete({ ignoreNotFound: true });
  }

  async getFileUrl(url: string): Promise<string> {
    return url;
  }

  async downloadFile(url: string): Promise<Buffer> {
    const MAX_ATTEMPTS = 3;
    const ATTEMPT_TIMEOUT_MS = 20_000;
    const BACKOFF_MS = [0, 500, 1_000];

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
          if (response.status === 404) throw err;
          throw err;
        }

        return Buffer.from(await response.arrayBuffer());
      } catch (error) {
        clearTimeout(timer);
        lastError = error;

        if (error instanceof Error && error.message.includes('404')) break;
        if (attempt === MAX_ATTEMPTS - 1) break;
      }
    }

    throw lastError;
  }
}

export const blobStorageService = new BlobStorageService();