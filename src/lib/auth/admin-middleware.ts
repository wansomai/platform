import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from './authorization';
import { PrismaClient } from '@/prisma/client';
import { isAdminUser } from './admin';
import { AppError } from '@/types/error';
import { createErrorResponse } from '../api/response';

const prisma = new PrismaClient();

/**
 * Admin authentication middleware
 * Wraps API route handlers to ensure:
 * 1. User is authenticated (has valid JWT token)
 * 2. User's email is in the ADMIN_EMAILS list
 *
 * @param handler - API route handler function
 * @returns Wrapped handler with admin authentication
 */
export function withAdminAuth(
  handler: (request: NextRequest, userId: string, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // First, check if user is authenticated
      const userId = getUserIdFromRequest(request);

      if (!userId) {
        return createErrorResponse(
          new AppError('Authentication required', 'AUTH_REQUIRED', 401)
        );
      }

      // Get user's email from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user || !isAdminUser(user.email)) {
        // Return 403 Forbidden for admin access
        return createErrorResponse(
          new AppError('Admin access required', 'ADMIN_REQUIRED', 403)
        );
      }

      // User is authenticated and is an admin, proceed with the handler
      return handler(request, userId, ...args);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      );
    }
  };
}
