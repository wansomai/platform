// src/lib/api.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession, signOut } from 'next-auth/react';

// Create a custom axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://wansom.ai',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get the session which contains the token
    const session = await getSession();
    
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {

      try {
        await signOut({ redirect: true, callbackUrl: '/login?session=expired' });
      } catch (signOutError) {

        if (typeof window !== 'undefined') {
          window.location.href = '/login?session=expired';
        }
      }
    }

    // For 403 errors, preserve the response data which may contain requiresUpgrade flag
    if (error.response?.status === 403) {
      const responseData = error.response.data as any;
      const customError = new Error(responseData?.message || 'Access denied') as any;
      customError.status = 403;
      customError.requiresUpgrade = responseData?.requiresUpgrade;
      customError.response = error.response;
      return Promise.reject(customError);
    }

    return Promise.reject(error);
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
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        try {
          const data = JSON.parse(line);
          if (onMessage) onMessage(data);
        } catch (parseError) {
          if (onError) onError(parseError);
        }
      }
    }
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
          await signOut({ redirect: true, callbackUrl: '/login?session=expired' });
          return;
        }

        // Handle 403 with possible subscription limit errors
        if (response.status === 403) {
          const errorData = await response.json().catch(() => null);
          const customError = new Error(errorData?.message || 'Access denied') as any;
          customError.status = 403;
          customError.requiresUpgrade = errorData?.requiresUpgrade;
          throw customError;
        }

        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }
      
      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            const data = JSON.parse(line);
            if (onMessage) onMessage(data);
          } catch (parseError) {
            
            if (onError) onError(parseError);
          }
        }
      }
    } catch (error) {
      
      if (onError) onError(error);
      throw error;
    }
  }
};

export default apiClient;