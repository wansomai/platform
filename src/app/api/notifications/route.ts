// src/app/api/notifications/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createApiResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

/**
 * GET /api/notifications
 * Returns the current user's unread (and recent read) notifications.
 */
export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, userId: string) => {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return createApiResponse(notifications);
  })
);
