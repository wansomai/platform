// lib/api/response.ts
import { NextResponse } from 'next/server';
import { ApiResponse, PaginatedApiResponse } from '@/types/api';
import { AppError, ErrorResponse } from '@/types/error';

export function createApiResponse<T>(
  data: T,
  message: string = 'Success',
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      status,
    },
    { status }
  );
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  },
  message: string = 'Success'
): NextResponse<PaginatedApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      pagination,
      timestamp: new Date().toISOString(),
      status: 200,
    },
    { status: 200 }
  );
}

export function createErrorResponse(
  error: string | AppError,
  status: number = 500
): NextResponse<ErrorResponse> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: typeof error === 'string' ? error : 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: typeof error === 'string' ? error : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

