// types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
  timestamp: string;
  status: number;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}