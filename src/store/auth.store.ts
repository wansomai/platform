// src/store/auth.store.ts - Fixed version
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
  login: (email: string, password: string) => Promise<{ success: boolean, user?: User, error?: string }>
  register: (email: string, password: string, fullName: string, organizationName: string) => Promise<boolean>
  logout: () => void
  refreshAccessToken: () => Promise<boolean>
  setError: (error: string | null) => void
}

// Safe localStorage functions
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error retrieving from localStorage:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from localStorage:', e);
      return false;
    }
  }
};

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
        });
        
        // Debug logging to track token status
        console.log('Token set in auth store:', !!token);
      },
      
      setRefreshToken: (refreshToken) => {
        set({ refreshToken });
      },
      
      setUser: (user) => {
        set({ user });
        
        // Also save to localStorage directly for redundancy
        if (user) {
          safeStorage.setItem('current-user', JSON.stringify(user));
        }
      },
      
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          const responseData = await response.json();
          
          if (!response.ok) {
            throw new Error(responseData.message || 'Login failed');
          }
          
          // Check if responseData has the expected structure
          if (!responseData.data) {
            throw new Error('Unexpected response format from server');
          }
          
          // Extract the data from response
          const { access_token, refresh_token, user } = responseData.data;
          
          if (!access_token || !user) {
            throw new Error('Missing authentication data in server response');
          }
          
          // Save token and user directly to localStorage first
          safeStorage.setItem('auth-token', access_token);
          safeStorage.setItem('refresh_token', refresh_token);
          safeStorage.setItem('current-user', JSON.stringify(user));
          
          // Then update the state
          set({
            token: access_token,
            refreshToken: refresh_token,
            user,
            isAuthenticated: true,
            isLoading: false
          });
          return { success: true, user }; 
        } catch (error: any) {
          console.error('Login error:', error);
          
          set({ 
            error: error.message || 'Login failed', 
            isLoading: false,
            isAuthenticated: false
          });
          
          return { success: false, error: error.message || 'Login failed' }; 
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
        });
        
        // Clear tokens from localStorage
        safeStorage.removeItem('auth-token');
        safeStorage.removeItem('refresh_token');
        safeStorage.removeItem('current-user');
        
        // Clear cookies
        document.cookie = `auth-token=; path=/; max-age=0; SameSite=Strict`;
        
        console.log('User logged out, auth state cleared');
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
          
          const { access_token, refresh_token, user } = data.data;
          
          // Save directly to localStorage
          safeStorage.setItem('auth-token', access_token);
          safeStorage.setItem('refresh_token', refresh_token);
          safeStorage.setItem('current-user', JSON.stringify(user));
          
          // Update state
          set({
            token: access_token,
            refreshToken: refresh_token,
            user,
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
      
      refreshAccessToken: async () => {
        const currentRefreshToken = get().refreshToken || safeStorage.getItem('refresh_token');
        
        if (!currentRefreshToken) {
          console.error('No refresh token available');
          return false;
        }
        
        try {
          set({ isLoading: true });
          
          const response = await api.post('/api/auth/refresh-token', {
            refresh_token: currentRefreshToken
          });
          
          if (response.data && response.data.data && response.data.data.access_token) {
            const newToken = response.data.data.access_token;
            const newRefreshToken = response.data.data.refresh_token || currentRefreshToken;
            
            safeStorage.setItem('auth-token', newToken);
            safeStorage.setItem('refresh_token', newRefreshToken);
            
            set({
              token: newToken,
              refreshToken: newRefreshToken,
              isAuthenticated: true,
              isLoading: false
            });
            
            console.log('Token refreshed successfully');
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Failed to refresh token:', error);
          set({ isLoading: false });
          return false;
        }
      },
      
      setError: (error) => set({ error })
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            if (typeof window === 'undefined') return null;
            
            const value = localStorage.getItem(name);
            if (value) return value;
            
            // Fall back to cookies if necessary
            const cookie = document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${name}=`));
            
            return cookie ? cookie.split('=')[1] : null;
          } catch (e) {
            console.error('Error retrieving auth data:', e);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            if (typeof window === 'undefined') return;
            
            localStorage.setItem(name, value);
            console.log(`Stored ${name} in localStorage`);
          } catch (e) {
            console.error('Error storing auth data:', e);
          }
        },
        removeItem: (name) => {
          try {
            if (typeof window === 'undefined') return;
            
            localStorage.removeItem(name);
          } catch (e) {
            console.error('Error removing auth data:', e);
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
);

// Initialize auth from localStorage on client-side
if (typeof window !== 'undefined') {
  // Try to recover user from localStorage
  try {
    const savedUser = localStorage.getItem('current-user');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        useAuthStore.getState().setUser(user);
        console.log('Recovered user from localStorage:', user);
        
        if (refreshToken) {
          useAuthStore.getState().setRefreshToken(refreshToken);
          // Trigger a token refresh
          setTimeout(() => {
            useAuthStore.getState().refreshAccessToken();
          }, 100);
        }
      } catch (e) {
        console.error('Error parsing saved user:', e);
      }
    }
  } catch (e) {
    console.error('Error initializing auth from localStorage:', e);
  }
}

// Export helper functions
export const getAuthToken = (): string | null => {
  return useAuthStore.getState().token || safeStorage.getItem('auth-token');
};

export const isAuthenticated = (): boolean => {
  return !!useAuthStore.getState().token || !!safeStorage.getItem('auth-token');
};

export const getCurrentUser = (): User | null => {
  const storeUser = useAuthStore.getState().user;
  if (storeUser) return storeUser;
  
  // Try to get from localStorage if not in store
  try {
    const savedUser = safeStorage.getItem('current-user');
    if (savedUser) {
      return JSON.parse(savedUser);
    }
  } catch (e) {
    console.error('Error getting user from localStorage:', e);
  }
  
  return null;
};