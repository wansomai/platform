// src/lib/api.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession } from 'next-auth/react';
import { toast } from 'sonner';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrorCodes: ['ECONNABORTED', 'ERR_NETWORK', 'ETIMEDOUT']
};

// Error messages for different scenarios
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  BAD_GATEWAY: 'Service temporarily unavailable. Please try again.',
  SERVICE_UNAVAILABLE: 'Service is currently down. Please try again later.',
  GATEWAY_TIMEOUT: 'Request took too long. Please try again.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  BAD_REQUEST: 'Invalid request. Please check your input.',
  CONFLICT: 'A conflict occurred. The resource may have been modified.',
  UNKNOWN: 'An unexpected error occurred. Please try again.'
};

// Helper function to check if error is retryable
const isRetryableError = (error: AxiosError): boolean => {
  // Network errors are always retryable
  if (!error.response) {
    return RETRY_CONFIG.retryableErrorCodes.includes(error.code || '');
  }

  // HTTP status codes that are retryable
  const status = error.response.status;
  return RETRY_CONFIG.retryableStatusCodes.includes(status);
};

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get user-friendly error message
const getErrorMessage = (error: AxiosError): string => {
  // Network errors (no response from server)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return ERROR_MESSAGES.TIMEOUT;
    }
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // HTTP status code errors
  const status = error.response.status;
  const responseData = error.response.data as any;

  // Check if server provided a custom error message
  if (responseData?.error) {
    return responseData.error;
  }
  if (responseData?.message) {
    return responseData.message;
  }

  // Default messages based on status code
  switch (status) {
    case 400:
      return ERROR_MESSAGES.BAD_REQUEST;
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 409:
      return ERROR_MESSAGES.CONFLICT;
    case 500:
      return ERROR_MESSAGES.SERVER_ERROR;
    case 502:
      return ERROR_MESSAGES.BAD_GATEWAY;
    case 503:
      return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
    case 504:
      return ERROR_MESSAGES.GATEWAY_TIMEOUT;
    default:
      return ERROR_MESSAGES.UNKNOWN;
  }
};

// Create a custom axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://wansom.ai',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor to add auth token and retry count
apiClient.interceptors.request.use(
  async (config: any) => {
    // Get the session which contains the token
    const session = await getSession();

    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    // Initialize retry count if not present
    if (!config.__retryCount) {
      config.__retryCount = 0;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and retries
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config: any = error.config;
    const status = error.response?.status;
    const errorMessage = getErrorMessage(error);

    // Check if we should retry this request
    if (config && isRetryableError(error) && config.__retryCount < RETRY_CONFIG.maxRetries) {
      config.__retryCount += 1;

      // Calculate exponential backoff delay
      const retryDelay = RETRY_CONFIG.retryDelay * Math.pow(2, config.__retryCount - 1);

      // Show toast notification about retry (only on first retry)
      if (config.__retryCount === 1) {
        toast.info('Connection issue detected. Retrying...', { duration: 2000 });
      }

      // Wait before retrying
      await delay(retryDelay);

      // Retry the request
      return apiClient(config);
    }

    // Handle 401 Unauthorized - session expired
    if (status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        window.dispatchEvent(
          new CustomEvent('session-expired', { detail: { callbackUrl: currentPath } })
        );
      }
      return Promise.reject(error);
    }

    // Handle 403 Forbidden - preserve requiresUpgrade flag
    if (status === 403) {
      const responseData = error.response?.data as any;
      const customError = new Error(responseData?.message || errorMessage) as any;
      customError.status = 403;
      customError.requiresUpgrade = responseData?.requiresUpgrade;
      customError.response = error.response;
      customError.userFriendlyMessage = errorMessage;

      // Don't show toast for 403 with requiresUpgrade - let component handle it
      if (!responseData?.requiresUpgrade) {
        toast.error(errorMessage);
      }

      return Promise.reject(customError);
    }

    // Handle 404 Not Found
    if (status === 404) {
      toast.error(errorMessage);
      const customError = new Error(errorMessage) as any;
      customError.status = 404;
      customError.userFriendlyMessage = errorMessage;
      return Promise.reject(customError);
    }

    // Handle 500+ Server Errors
    if (status && status >= 500) {
      toast.error(errorMessage, {
        description: 'Our team has been notified. Please try again later.',
        duration: 5000
      });
      const customError = new Error(errorMessage) as any;
      customError.status = status;
      customError.userFriendlyMessage = errorMessage;
      return Promise.reject(customError);
    }

    // Handle Network Errors (no response)
    if (!error.response) {
      toast.error(errorMessage, {
        description: 'Please check your connection and try again.',
        duration: 5000
      });
      const customError = new Error(errorMessage) as any;
      customError.isNetworkError = true;
      customError.userFriendlyMessage = errorMessage;
      return Promise.reject(customError);
    }

    // Handle other errors
    const customError = new Error(errorMessage) as any;
    customError.status = status;
    customError.userFriendlyMessage = errorMessage;
    customError.response = error.response;
    return Promise.reject(customError);
  }
);

// Helper for common request patterns
export const apiService = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },
  
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },
  
  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },
  
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },

  upload: <T>(url: string, formData: FormData, onProgress: ((progress: number) => void) | null = null) => {
    return apiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...apiClient.defaults.headers.common
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  },
  
  postMultipart: async <T>(url: string, formData: FormData): Promise<T> => {
    const response = await apiClient.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  
  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },
  
  // Add stream support for SSE
  stream: async (url: string, data?: any, onMessage?: (data: any) => void, onError?: (error: any) => void) => {
    const session = await getSession();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': session?.accessToken ? `Bearer ${session.accessToken}` : '',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('No response body');
    }
    
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;

        try {
          const data = JSON.parse(line);
          if (onMessage) onMessage(data);
        } catch (parseError) {
          // Ignore JSON parse errors from malformed chunks
          console.warn('Stream JSON parse error:', parseError);
        }
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        if (onMessage) onMessage(data);
      } catch (parseError) {
        console.warn('Stream final buffer parse error:', parseError);
      }
    }
  },

  // Download file as blob
  downloadFile: async (url: string): Promise<Blob> => {
    const session = await getSession();

    const fullUrl = url.startsWith('http')
      ? url
      : `${process.env.NEXT_PUBLIC_API_URL || 'https://wansom.ai'}${url}`;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': session?.accessToken ? `Bearer ${session.accessToken}` : '',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      // Handle 401 specifically
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname + window.location.search;
          window.dispatchEvent(
            new CustomEvent('session-expired', { detail: { callbackUrl: currentPath } })
          );
        }
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      // Parse error message
      let errorMessage = ERROR_MESSAGES.UNKNOWN;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.error || errorData?.message || errorMessage;
      } catch {
        switch (response.status) {
          case 404:
            errorMessage = ERROR_MESSAGES.NOT_FOUND;
            break;
          case 403:
            errorMessage = ERROR_MESSAGES.FORBIDDEN;
            break;
          case 500:
            errorMessage = ERROR_MESSAGES.SERVER_ERROR;
            break;
        }
      }

      throw new Error(errorMessage);
    }

    return await response.blob();
  },

  postStream: async (
    url: string,
    data?: any,
    onMessage?: (data: any) => void,
    onError?: (error: any) => void
  ) => {
    try {
      const session = await getSession();
      
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      
      const fullUrl = url.startsWith('http') 
        ? url 
        : `${process.env.NEXT_PUBLIC_API_URL || 'https://wansom.ai'}${url}`;
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(data),
        credentials: 'include', // Important for cookies
      });
      
      if (!response.ok) {
        // Handle 401 specifically
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname + window.location.search;
            window.dispatchEvent(
              new CustomEvent('session-expired', { detail: { callbackUrl: currentPath } })
            );
          }
          return;
        }

        // Handle 403 with possible subscription limit errors
        if (response.status === 403) {
          const errorData = await response.json().catch(() => null);
          const customError = new Error(errorData?.error || errorData?.message || 'Access denied') as any;
          customError.status = 403;
          customError.requiresUpgrade = errorData?.requiresUpgrade;
          throw customError;
        }

        // Parse error response
        let errorMessage = ERROR_MESSAGES.UNKNOWN;
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorData?.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status-based message
          switch (response.status) {
            case 400:
              errorMessage = ERROR_MESSAGES.BAD_REQUEST;
              break;
            case 404:
              errorMessage = ERROR_MESSAGES.NOT_FOUND;
              break;
            case 500:
              errorMessage = ERROR_MESSAGES.SERVER_ERROR;
              break;
            case 502:
              errorMessage = ERROR_MESSAGES.BAD_GATEWAY;
              break;
            case 503:
              errorMessage = ERROR_MESSAGES.SERVICE_UNAVAILABLE;
              break;
            case 504:
              errorMessage = ERROR_MESSAGES.GATEWAY_TIMEOUT;
              break;
          }
        }

        const customError = new Error(errorMessage) as any;
        customError.status = response.status;
        throw customError;
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }
      
      // Read the stream with buffering for partial chunks
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;

          try {
            const data = JSON.parse(line);
            if (onMessage) onMessage(data);
          } catch (parseError) {
            // Ignore JSON parse errors from malformed chunks
            console.warn('Stream JSON parse error:', parseError);
          }
        }
      }

      // Process any remaining data in the buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          if (onMessage) onMessage(data);
        } catch (parseError) {
          console.warn('Stream final buffer parse error:', parseError);
        }
      }
    } catch (error: any) {
      // Handle network errors (internet down, fetch failed)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = new Error(ERROR_MESSAGES.NETWORK_ERROR) as any;
        networkError.isNetworkError = true;
        if (onError) onError(networkError);
        throw networkError;
      }

      // Handle timeout errors
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        const timeoutError = new Error(ERROR_MESSAGES.TIMEOUT) as any;
        if (onError) onError(timeoutError);
        throw timeoutError;
      }

      // Pass through already formatted errors
      if (onError) onError(error);
      throw error;
    }
  }
};

export default apiClient;