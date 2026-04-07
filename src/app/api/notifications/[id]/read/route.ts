// src/app/api/notifications/[id]/read/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { AppError } from '@/types/error';

/**
 * PATCH /api/notifications/[id]/read
 * Marks a notification as read. Only the owning user may do this.
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
      data: { read: true },
    });

    return createApiResponse(null, 'Marked as read');
  })
);
