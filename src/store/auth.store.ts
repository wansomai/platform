// src/store/auth.store.ts
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import api from '@/lib/api'

export interface User {
  id: string
  email: string
  fullName: string
  role: string
  avatar?: string
  organization: {
    id: string
    name: string
  }
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setToken: (token: string | null) => void
  setRefreshToken: (token: string | null) => void
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, fullName: string, organizationName: string) => Promise<boolean>
  logout: () => void
  refreshAccessToken: () => Promise<boolean>
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      setToken: (token) => {
        set({ 
          token,
          isAuthenticated: !!token
        })
        
        // Debug logging to track token status
        console.log('Token set in auth store:', !!token)
      },
      
      setRefreshToken: (refreshToken) => {
        set({ refreshToken })
      },
      
      setUser: (user) => set({ user }),
      
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.message || 'Login failed')
          }
          
          // Set token and user data
          const token = data.data.access_token
          const refreshToken = data.data.refresh_token
          const user = data.data.user
          
          // First set the tokens so they're available for subsequent requests
          set({
            token,
            refreshToken,
            user,
            isAuthenticated: true,
            isLoading: false
          })
          
          // Store tokens in localStorage for recovery if needed
          localStorage.setItem('refresh_token', refreshToken)
          
          // Debug logging
          console.log('Login successful. Token saved:', !!token)
          console.log('Auth state after login:', { 
            isAuthenticated: true,
            hasToken: !!token,
            hasUser: !!user
          })
          
          return true
        } catch (error: any) {
          set({ 
            error: error.message || 'Login failed', 
            isLoading: false,
            isAuthenticated: false
          })
          
          console.error('Login error:', error)
          return false
        }
      },
      
      logout: () => {
        // Clear all auth data
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null
        })
        
        // Clear tokens from localStorage
        localStorage.removeItem('refresh_token')
        
        // Clear cookies
        document.cookie = `auth-token=; path=/; max-age=0; SameSite=Strict`
        
        console.log('User logged out, auth state cleared')
      },
      register: async (email, password, fullName, organizationName) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName, organizationName })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
          }
          
          const token = data.data.access_token
          const refreshToken = data.data.refresh_token
          const user = data.data.user
          
          // First set the tokens so they're available for subsequent requests
          set({
            token,
            refreshToken,
            user,
            isAuthenticated: true,
            isLoading: false
          })
          
          return true;
        } catch (error: any) {
          set({ 
            error: error.message || 'Registration failed', 
            isLoading: false 
          });
          return false;
        }
      },
      
      refreshAccessToken: async () => {
        const currentRefreshToken = get().refreshToken
        
        if (!currentRefreshToken) {
          console.error('No refresh token available')
          return false
        }
        
        try {
          set({ isLoading: true })
          
          const response = await api.post('/api/auth/refresh-token', {
            refresh_token: currentRefreshToken
          })
          
          if (response.data && response.data.data.access_token) {
            const newToken = response.data.data.access_token
            const newRefreshToken = response.data.data.refresh_token || currentRefreshToken
            
            set({
              token: newToken,
              refreshToken: newRefreshToken,
              isAuthenticated: true,
              isLoading: false
            })
            
            // Update refresh token in localStorage
            localStorage.setItem('refresh_token', newRefreshToken)
            
            console.log('Token refreshed successfully')
            return true
          }
          
          return false
        } catch (error) {
          console.error('Failed to refresh token:', error)
          set({ isLoading: false })
          return false
        }
      },
      
      setError: (error) => set({ error })
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            // Try to get from localStorage first (more reliable for web apps)
            const value = localStorage.getItem(name)
            if (value) return value
            
            // Fall back to cookies if necessary
            const cookie = document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${name}=`))
            
            return cookie ? cookie.split('=')[1] : null
          } catch (e) {
            console.error('Error retrieving auth data:', e)
            return null
          }
        },
        setItem: (name, value) => {
          try {
            // Store in both localStorage and cookies for redundancy
            localStorage.setItem(name, value)
            document.cookie = `${name}=${value}; path=/; max-age=2592000; SameSite=Strict` // 30 days
          } catch (e) {
            console.error('Error storing auth data:', e)
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name)
            document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict`
          } catch (e) {
            console.error('Error removing auth data:', e)
          }
        },
      })),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Export a helper function to get the current token outside of React components
export const getAuthToken = (): string | null => {
  return useAuthStore.getState().token
}