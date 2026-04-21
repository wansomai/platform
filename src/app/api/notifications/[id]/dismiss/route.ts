// src/app/api/notifications/[id]/dismiss/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { AppError } from '@/types/error';

/**
 * PATCH /api/notifications/[id]/dismiss
 * Marks a notification as dismissed so it no longer appears in the active list.
 * The record is kept in the DB for history; a cleanup cron removes records older than 30 days.
 */
export const PATCH = withErrorHandler(
  withAuth(async (req: NextRequest, userId: string) => {
    const id = req.nextUrl.pathname.split('/').at(-2)!;

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!notification) {
      return createErrorResponse(new AppError('Notification not found', 'NOT_FOUND', 404));
    }
    if (notification.userId !== userId) {
      return createErrorResponse(new AppError('Forbidden', 'ACCESS_DENIED', 403));
    }

    await prisma.notification.update({
      where: { id },
      data: { dismissed: true, dismissedAt: new Date(), read: true },
    });

    return createApiResponse(null, 'Notification dismissed');
  })
);
