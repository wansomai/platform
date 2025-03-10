// src/lib/api.ts (modified)
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Safe storage access
export const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  }
}

// Create a custom Axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - removed auth token logic
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Debug info for request
    if (config.url) {
      console.log(`API Request to: ${config.url}`)
    }
    
    return config
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error.message)
    return Promise.reject(error)
  }
)

// Response interceptor for handling API responses and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle successful responses
    if (response.config.url) {
      console.log(`API Response from ${response.config.url}: Status ${response.status}`)
    }
    return response
  },
  async (error: AxiosError) => {
    // Enhanced error logging
    console.error('API Error:', error.message)
    
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Data:', error.response.data)
    } else if (error.request) {
      console.error('No response received:', error.request)
    }
    
    return Promise.reject(error)
  }
)

// Helper methods with improved type safety
export const apiClient: {
  get: <T>(url: string, config?: object) => Promise<T>;
  post: <T>(url: string, data?: object, config?: object) => Promise<T>;
  put: <T>(url: string, data?: object, config?: object) => Promise<T>;
  delete: <T>(url: string, config?: object) => Promise<T>;
  upload: <T>(url: string, file: File, onProgress?: ((progress: number) => void) | null, additionalData?: object) => Promise<T>;
} = {
  get: <T>(url: string, config = {}) => 
    api.get<T>(url, config).then(response => response.data),
    
  post: <T>(url: string, data = {}, config = {}) => 
    api.post<T>(url, data, config).then(response => response.data),
    
  put: <T>(url: string, data = {}, config = {}) => 
    api.put<T>(url, data, config).then(response => response.data),
    
  delete: <T>(url: string, config = {}) => 
    api.delete<T>(url, config).then(response => response.data),
  
  // Improved file upload with better error handling
  upload: <T>(url: string, file: File, onProgress: ((progress: number) => void) | null = null, additionalData = {}) => {
    const formData = new FormData()
    formData.append('file', file)
    
    // Add any additional data to the form
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }
    
    // Configure the request
    return api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress 
        ? (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              onProgress(percentCompleted)
            }
          } 
        : undefined,
    }).then(response => response.data)
  }
}

// Export the base axios instance as well
export default api