// lib/api/response.ts
import { NextResponse } from 'next/server';
import { ApiResponse, PaginatedApiResponse } from '@/types/api';
import { AppError, ErrorResponse } from '@/types/error';

/**
 * Standard API error codes for consistent error handling
 */
export const ErrorCodes = {
  // Authentication errors (401)
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Authorization errors (403)
  ACCESS_DENIED: 'ACCESS_DENIED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PROJECT_ACCESS_DENIED: 'PROJECT_ACCESS_DENIED',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',

  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Conflict errors (409)
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

/**
 * Create a standardized success response
 */
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

/**
 * Create a standardized paginated response
 */
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

/**
 * Create a standardized error response
 */
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

/**
 * Shorthand for 201 Created response
 */
export function createCreatedResponse<T>(
  data: T,
  message: string = 'Created successfully'
): NextResponse<ApiResponse<T>> {
  return createApiResponse(data, message, 201);
}

/**
 * Shorthand for 404 Not Found error
 */
export function createNotFoundResponse(
  resource: string = 'Resource'
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    new AppError(`${resource} not found`, ErrorCodes.NOT_FOUND, 404)
  );
}

/**
 * Shorthand for 400 Bad Request error
 */
export function createBadRequestResponse(
  message: string,
  code: string = ErrorCodes.INVALID_INPUT
): NextResponse<ErrorResponse> {
  return createErrorResponse(new AppError(message, code, 400));
}

/**
 * Shorthand for 403 Forbidden error
 */
export function createForbiddenResponse(
  message: string = 'Access denied'
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    new AppError(message, ErrorCodes.ACCESS_DENIED, 403)
  );
}

/**
 * Shorthand for 401 Unauthorized error
 */
export function createUnauthorizedResponse(
  message: string = 'Authentication required'
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    new AppError(message, ErrorCodes.AUTH_REQUIRED, 401)
  );
}

/**
 * Calculate pagination metadata from total count, page, and limit
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const pages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

