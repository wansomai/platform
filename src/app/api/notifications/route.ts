// src/app/api/notifications/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createApiResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

/**
 * GET /api/notifications
 * ?history=true  → read, non-dismissed notifications (history log)
 * (default)      → unread, non-dismissed notifications (active inbox)
 */
export const GET = withErrorHandler(
  withAuth(async (req: NextRequest, userId: string) => {
    const history = req.nextUrl.searchParams.get('history') === 'true';

    const notifications = await prisma.notification.findMany({
      where: { userId, dismissed: false, read: history },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return createApiResponse(notifications);
  })
);
