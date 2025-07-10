// lib/utils/api.ts - API and request utilities

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data: T;
  error?: boolean;
  timestamp?: string;
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: PaginationMeta;
}

/**
 * Common API error types
 */
export type ApiErrorType = 
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED' 
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR';

/**
 * Structured API error
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  details?: any;
  statusCode?: number;
}

/**
 * Axios-like error structure for type safety
 */
interface AxiosLikeError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
  message?: string;
}

/**
 * Extract error message from various error formats
 */
export function extractErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (!error) {
    return 'An unexpected error occurred';
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Type guard for object with response property
  const hasResponse = (err: any): err is AxiosLikeError => {
    return typeof err === 'object' && err !== null;
  };
  
  if (hasResponse(error)) {
    // Handle structured API errors (Axios-style)
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    // Handle axios errors with error field
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    // Handle standard error objects
    if (error.message) {
      return error.message;
    }
  }
  
  // Handle Error instances
  if (error instanceof Error) {
    return error.message;
  }
  
  // Fallback
  return 'An unexpected error occurred';
}

/**
 * Get user-friendly error message based on status code
 */
export function getUserFriendlyErrorMessage(statusCode: number, defaultMessage?: string): string {
  const errorMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Authentication required. Please log in.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This action conflicts with existing data.',
    422: 'The data provided is invalid.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Service temporarily unavailable.',
    503: 'Service temporarily unavailable.',
    504: 'Request timeout. Please try again later.',
  };
  
  return errorMessages[statusCode] || defaultMessage || 'An error occurred';
}

/**
 * Create standardized API response
 */
export function createApiResponse<T>(
  data: T,
  message: string = 'Success',
  status: number = 200
): ApiResponse<T> {
  return {
    status,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create error API response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
): ApiResponse<null> {
  return {
    status,
    message,
    data: null,
    error: true,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, any>): string {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [key, String(value)]);
  
  if (filteredParams.length === 0) return '';
  
  const searchParams = new URLSearchParams(filteredParams);
  return `?${searchParams.toString()}`;
}

/**
 * Parse query string to object
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
  const result: Record<string, string> = {};
  
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  
  return result;
}

/**
 * Retry failed requests with exponential backoff
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Type guard for axios-like errors
      const hasResponseStatus = (err: any): err is AxiosLikeError => {
        return typeof err === 'object' && err?.response?.status;
      };
      
      // Don't retry on client errors (4xx)
      if (hasResponseStatus(error) && 
          error.response!.status! >= 400 && 
          error.response!.status! < 500) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Handle file upload progress
 */
export interface UploadProgressHandler {
  (progress: number): void;
}

/**
 * Create upload progress handler
 */
export function createUploadProgressHandler(
  onProgress?: UploadProgressHandler
): ((progressEvent: any) => void) | undefined {
  if (!onProgress) return undefined;
  
  return (progressEvent: any) => {
    if (progressEvent.lengthComputable) {
      const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(progress);
    }
  };
}

/**
 * Validate API response structure
 */
export function validateApiResponse(response: any): response is ApiResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.status === 'number' &&
    typeof response.message === 'string' &&
    'data' in response
  );
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
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

/**
 * Get pagination offset
 */
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for API calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Create cache key from request parameters
 */
export function createCacheKey(endpoint: string, params?: Record<string, any>): string {
  const paramString = params ? JSON.stringify(params) : '';
  return `${endpoint}:${paramString}`;
}

/**
 * Check if request should be cached
 */
export function shouldCacheRequest(method: string): boolean {
  return ['GET', 'HEAD'].includes(method.toUpperCase());
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    return err.code === 'NETWORK_ERROR' || 
           err.message?.includes('Network Error') ||
           err.message?.includes('fetch');
  }
  return false;
}

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Common API endpoints patterns
 */
export const API_PATTERNS = {
  PAGINATION_DEFAULTS: {
    page: 1,
    limit: 20,
  },
  MAX_RETRIES: 3,
  DEFAULT_TIMEOUT: 10000,
  UPLOAD_TIMEOUT: 60000,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
} as const;




/**
 * Check if response is successful
 */
export function isApiSuccess(response: ApiResponse): boolean {
  return response.status >= 200 && response.status < 300 && !response.error;
}

/**
 * Handle file upload progress
 */
export interface UploadProgressHandler {
  (progress: number): void;
}
