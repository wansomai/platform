// src/app/api/cron/notification-cleanup/route.ts
//
// Deletes dismissed notification records older than 30 days.
// Schedule (vercel.json): { "path": "/api/cron/notification-cleanup", "schedule": "0 2 * * *" }

import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import prisma from '@/lib/prisma';

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

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { count } = await prisma.notification.deleteMany({
    where: {
      dismissed: true,
      dismissedAt: { lt: cutoff },
    },
  });

  console.log(`[notification-cleanup] Deleted ${count} dismissed notification(s) older than 30 days`);

  return createApiResponse({ deleted: count }, `Deleted ${count} old dismissed notification(s)`);
}
