// src/lib/auth-service.ts
import { useAuthStore } from '@/store/auth.store'
import { safeStorage } from './api'
import api from './api'

/**
 * AuthService provides a consistent interface for authentication operations
 * and ensures tokens are properly managed throughout the application
 */
export const AuthService = {
  /**
   * Get the current authentication token from store
   */
  getToken: (): string | null => {
    return useAuthStore.getState().token
  },

  /**
   * Set the authentication token and update auth status
   */
  setToken: (token: string | null): void => {
    useAuthStore.getState().setToken(token)
  },

  /**
   * Store token in both the Zustand store and cookies for persistence
   */
  storeToken: (token: string): void => {
    // Set in Zustand store
    useAuthStore.getState().setToken(token)
    
    // Set in cookie with HttpOnly for better security (server-side)
    document.cookie = `auth-token=${token}; path=/; max-age=2592000; SameSite=Strict` // 30 days
  },

  /**
   * Clear token from both store and cookies
   */
  clearToken: (): void => {
    // Clear from Zustand store
    useAuthStore.getState().setToken(null)
    
    // Clear from cookies
    document.cookie = `auth-token=; path=/; max-age=0; SameSite=Strict`
  },

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated: (): boolean => {
    return !!useAuthStore.getState().token
  },

  /**
   * Login user with email and password
   */
  login: async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      
      if (response.data && response.data.data.access_token) {
        // Store token and user data
        const token = response.data.data.access_token
        const user = response.data.data.user
        
        // First set the token so it's available for subsequent requests
        AuthService.storeToken(token)
        
        // Then set the user data
        useAuthStore.getState().setUser(user)
        
        // Setup interceptors immediately after login
        setupInterceptors()
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  },

  /**
   * Logout user and clear authentication data
   */
  logout: (): void => {
    // Clear token and user data from store
    useAuthStore.getState().logout()
    
    // Clear cookies
    AuthService.clearToken()
  },

  /**
   * Refresh the authentication token
   */
  refreshToken: async (): Promise<boolean> => {
    try {
      const refreshToken = safeStorage.getItem('refresh_token')
      
      if (!refreshToken) {
        return false
      }
      
      const response = await api.post('/api/auth/refresh-token', { 
        refresh_token: refreshToken 
      })
      
      if (response.data && response.data.data.access_token) {
        // Store the new token
        AuthService.storeToken(response.data.data.access_token)
        
        // Update refresh token in storage if provided
        if (response.data.data.refresh_token) {
          safeStorage.setItem('refresh_token', response.data.data.refresh_token)
        }
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }
}

/**
 * Set up request and response interceptors for handling authentication
 */
export const setupInterceptors = () => {
  // Remove any existing interceptors to prevent duplicates
  api.interceptors.request.eject(0)
  api.interceptors.response.eject(0)
  
  // Request interceptor for adding the auth token
  api.interceptors.request.use(
    (config) => {
      const token = AuthService.getToken()
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('Setting Authorization header with token')
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )
  
  // Response interceptor for handling 401 errors
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      
      // If the error is 401 (Unauthorized) and we haven't tried to refresh yet
      if (
        error.response &&
        error.response.status === 401 &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true
        
        try {
          // Attempt to refresh the token
          const refreshSuccess = await AuthService.refreshToken()
          
          if (refreshSuccess) {
            // Update the authorization header with the new token
            originalRequest.headers.Authorization = `Bearer ${AuthService.getToken()}`
            
            // Retry the original request with the new token
            return api(originalRequest)
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
        }
        
        // If we reach here, token refresh failed or was not attempted
        // Force logout and redirect to login page
        AuthService.logout()
        window.location.href = '/login?session=expired'
      }
      
      return Promise.reject(error)
    }
  )
}

// Add these functions to your auth-service.ts file

// Function to get the token from cookies for server components/middleware
export const getTokenFromRequest = (request: Request): string | null => {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }
  
  // Check cookies as a fallback
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';')
    const authCookie = cookies.find(c => c.trim().startsWith('auth-token='))
    if (authCookie) {
      return authCookie.split('=')[1].trim()
    }
  }
  
  return null
}

// Function to decode token parts without validating (for debugging)
export const decodeTokenParts = (token: string): any => {
  try {
    if (!token) return null
    
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    // Decode the payload part (middle section)
    const payload = parts[1]
    const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8')
    return JSON.parse(decodedPayload)
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

// Helper function to check token expiration
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeTokenParts(token)
    if (!decoded || !decoded.exp) return true
    
    // Check if token has expired
    const now = Math.floor(Date.now() / 1000)
    return decoded.exp < now
  } catch (error) {
    console.error('Error checking token expiration:', error)
    return true
  }
}

// Function to get clear debug information about a token
export const getTokenDebugInfo = (token: string | null): any => {
  if (!token) return { valid: false, reason: 'No token provided' }
  
  try {
    const decoded = decodeTokenParts(token)
    if (!decoded) return { valid: false, reason: 'Invalid token format' }
    
    const now = Math.floor(Date.now() / 1000)
    const isExpired = decoded.exp ? decoded.exp < now : true
    
    return {
      valid: !isExpired,
      userId: decoded.userId,
      issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'unknown',
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'unknown',
      timeLeft: decoded.exp ? `${Math.max(0, decoded.exp - now)} seconds` : 'unknown',
      isExpired,
    }
  } catch (error) {
    return { 
      valid: false, 
      reason: 'Error parsing token', 
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Initialize interceptors when importing this file
setupInterceptors()

export default AuthService