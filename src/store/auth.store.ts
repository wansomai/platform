// src/store/auth.store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Cookies from 'js-cookie'

export interface User {
  id: string
  email: string
  avatar: string
  fullName: string
  role: string
  organization: {
    id: string
    name: string
  }
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  setTokens: (tokens: AuthTokens) => void
  setUser: (user: User) => void
  logout: () => void
  setError: (error: string | null) => void
  setLoading: (isLoading: boolean) => void
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, fullName: string, organizationName: string) => Promise<boolean>
  refreshUserSession: () => Promise<boolean>
}

// Create a custom storage adapter for cookies
const cookieStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return Cookies.get(name) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    Cookies.set(name, value, {
      expires: 30, // 30 days
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    })
  },
  removeItem: async (name: string): Promise<void> => {
    Cookies.remove(name, { path: '/' })
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setTokens: (tokens) =>
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true
        }),
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: async () => {
        try {
          // Call logout API if needed
          if (typeof window !== 'undefined') {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${get().accessToken}`
              }
            });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ 
            user: null, 
            accessToken: null, 
            refreshToken: null,
            isAuthenticated: false,
            error: null
          });
          
          // Redirect to login page if in browser
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      },
      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),
      
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }
          
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: data.user,
            isAuthenticated: true,
            isLoading: false
          });
          
          return true;
        } catch (error: any) {
          set({ 
            error: error.message || 'Login failed', 
            isLoading: false,
            isAuthenticated: false 
          });
          return false;
        }
      },
      
      register: async (email: string, password: string, fullName: string, organizationName: string) => {
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
          
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: data.user,
            isAuthenticated: true,
            isLoading: false
          });
          
          return true;
        } catch (error: any) {
          set({ 
            error: error.message || 'Registration failed', 
            isLoading: false 
          });
          return false;
        }
      },
      
      refreshUserSession: async () => {
        try {
          const refreshToken = get().refreshToken;
          
          if (!refreshToken) {
            return false;
          }
          
          const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Token refresh failed');
          }
          
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true
          });
          
          return true;
        } catch (error) {
          set({ 
            user: null, 
            accessToken: null, 
            refreshToken: null,
            isAuthenticated: false 
          });
          return false;
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)