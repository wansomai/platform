// src/app/api/cron/digest-cleanup/route.ts
//
// Weekly cleanup — deletes DigestItem rows older than 14 days.
// Runs Sunday at 03:00 UTC, before Monday's weekly digest send.
//
// Add to vercel.json:
//   { "path": "/api/cron/digest-cleanup", "schedule": "0 3 * * 0" }

import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import { pruneDigestItems, pruneDigestCache } from '@/services/digestIngestService';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && !cronSecret) {
    return createErrorResponse(new AppError('CRON_SECRET is not configured', 'AUTH_REQUIRED', 401));
  }
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return createErrorResponse(new AppError('Unauthorized', 'AUTH_REQUIRED', 401));
  }

  const [deletedItems, deletedCache] = await Promise.all([
    pruneDigestItems(),
    pruneDigestCache(),
  ]);

  return createApiResponse(
    { deletedItems, deletedCache },
    `Cleanup complete: ${deletedItems} digest item(s) and ${deletedCache} expired cache row(s) removed`,
  );
}
