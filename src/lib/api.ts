// src/lib/api.ts
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { useAuthStore } from '@/store/auth.store'

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    
    // If error is 401 and we haven't already tried to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        
        if (!refreshToken) {
          // No refresh token, logout user
          useAuthStore.getState().logout()
          return Promise.reject(error)
        }
        
        // Attempt to refresh token
        const response = await axios.post('/api/auth/refresh-token', {
          refresh_token: refreshToken
        })
        
        const { access_token, refresh_token } = response.data
        
        // Update tokens in store
        useAuthStore.getState().setTokens({
          access_token,
          refresh_token
        })
        
        // Retry original request with new token
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${access_token}`
        }
        
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh token failed, logout user
        useAuthStore.getState().logout()
        
        // Redirect to login page on client side
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

// Helper methods
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    api.get(url, config).then(response => response.data),
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.post(url, data, config).then(response => response.data),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.put(url, data, config).then(response => response.data),
    
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    api.delete(url, config).then(response => response.data),
    
  // Special method for file uploads with progress tracking
  upload: <T>(
    url: string, 
    file: File, 
    onProgress?: (percentage: number) => void, 
    additionalData?: Record<string, any>
  ): Promise<T> => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }
    
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted)
        }
      },
    }).then(response => response.data)
  }
}

export default api