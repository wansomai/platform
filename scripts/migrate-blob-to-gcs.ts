/**
 * One-time migration script: Vercel Blob → Google Cloud Storage
 *
 * Run with:
 *   npx ts-node --project tsconfig.json scripts/migrate-blob-to-gcs.ts
 *
 * Prerequisites:
 *   - BLOB_READ_WRITE_TOKEN in env (Vercel Blob token)
 *   - GOOGLE_APPLICATION_CREDENTIALS pointing to a GCS service account JSON key
 *   - GOOGLE_CLOUD_STORAGE_BUCKET set to your target bucket name
 *   - DATABASE_URL set (to update file_url records in Postgres)
 *
 * The script:
 *   1. Lists every blob in Vercel Blob (paginated)
 *   2. Downloads each and uploads to GCS under the same pathname
 *   3. Writes a URL mapping to url-mapping.json
 *   4. Updates Document.file_url and LegalKnowledge.fileUrl in the DB
 */

import { list } from '@vercel/blob';
import { Storage } from '@google-cloud/storage';
import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { PrismaClient } from '../src/prisma/client';

const BUCKET_NAME = process.env.GOOGLE_CLOUD_STORAGE_BUCKET!;
const MAPPING_FILE = 'url-mapping.json';
const CONCURRENCY = 5; // parallel uploads

if (!BUCKET_NAME) {
  console.error('GOOGLE_CLOUD_STORAGE_BUCKET env var is required');
  process.exit(1);
}

const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);
const prisma = new PrismaClient();

interface UrlMapping {
  [vercelUrl: string]: string;
}

async function uploadToGcs(
  pathname: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const file = bucket.file(pathname);
  await file.save(data, {
    metadata: { contentType },
    resumable: false,
  });
  // Make file publicly readable
  await file.makePublic();
  return `https://storage.googleapis.com/${BUCKET_NAME}/${pathname}`;
}

async function downloadBlob(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function runInChunks<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.all(items.slice(i, i + concurrency).map(fn));
  }
}

async function main() {
  const mapping: UrlMapping = {};
  let totalBlobs = 0;
  let failed = 0;

  console.log(`Migrating Vercel Blob → gs://${BUCKET_NAME}`);
  console.log('Listing blobs...\n');

  let cursor: string | undefined;

  do {
    const { blobs, cursor: next } = await list({ limit: 1000, cursor });
    cursor = next;

    console.log(`Processing batch of ${blobs.length} blobs...`);

    await runInChunks(blobs, CONCURRENCY, async (blob) => {
      totalBlobs++;
      try {
        const data = await downloadBlob(blob.url);
        const gcsUrl = await uploadToGcs(
          blob.pathname,
          data,
          blob.contentType ?? 'application/octet-stream'
        );
        mapping[blob.url] = gcsUrl;
        console.log(`  ✓ ${blob.pathname}`);
      } catch (err) {
        failed++;
        console.error(`  ✗ ${blob.pathname}: ${(err as Error).message}`);
        appendFileSync('migration-errors.log', `${blob.url}\n`);
      }
    });
  } while (cursor);

  // Write URL mapping for reference / manual fixes
  writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
  console.log(`\nURL mapping written to ${MAPPING_FILE}`);
  console.log(`Migrated: ${totalBlobs - failed}/${totalBlobs} files`);

  if (failed > 0) {
    console.warn(`${failed} failures logged to migration-errors.log`);
  }

  // Update database URLs
  console.log('\nUpdating database file_url references...');

  let docUpdates = 0;
  let lkUpdates = 0;

  for (const [vercelUrl, gcsUrl] of Object.entries(mapping)) {
    // Documents table
    const docResult = await prisma.document.updateMany({
      where: { file_url: vercelUrl },
      data: { file_url: gcsUrl },
    });
    docUpdates += docResult.count;

    // LegalKnowledge table (fileUrl field)
    const lkResult = await prisma.legalKnowledge.updateMany({
      where: { fileUrl: vercelUrl },
      data: { fileUrl: gcsUrl },
    });
    lkUpdates += lkResult.count;
  }

  console.log(`Updated ${docUpdates} document records`);
  console.log(`Updated ${lkUpdates} legal knowledge records`);
  console.log('\nMigration complete.');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
