// src/hooks/useAuth.ts
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  
  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };
  
  const requireAuth = () => {
    if (status === 'loading') return;
    
    if (!isAuthenticated) {
      router.push('/login');
    }
  };
  
  return {
    user: session?.user,
    isAuthenticated,
    isLoading,
    logout,
    requireAuth,
  };
}

// User role hook
export function useAuthorization() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  
  const isAdmin = userRole === 'admin';
  
  const hasRole = (role: string | string[]) => {
    if (!userRole) return false;
    
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    
    return role === userRole;
  };
  
  return {
    userRole,
    isAdmin,
    hasRole,
  };
}