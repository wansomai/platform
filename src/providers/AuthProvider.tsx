// src/providers/AuthProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProviderProps } from '@/types';

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}