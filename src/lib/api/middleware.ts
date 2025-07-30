// lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from './response';
import { AppError } from '@/types/error';
import { getUserIdFromRequest } from '../auth/authorization';

export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof AppError) {
        return createErrorResponse(error);
      }
      
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      );
    }
  };
}

export function withAuth(
  handler: (request: NextRequest, userId: string, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return createErrorResponse(
        new AppError('Authentication required', 'AUTH_REQUIRED', 401)
      );
    }
    
    return handler(request, userId, ...args);
  };
}