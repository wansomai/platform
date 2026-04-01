'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function MagicLoginInner() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const { status }    = useSession();
  const attempted     = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    if (status === 'loading') return; // wait for session check

    const token = searchParams.get('token');
    if (!token) { router.replace('/login'); return; }

    attempted.current = true;

    const proceed = async () => {
      // Sign out any existing session first so the new account takes over
      if (status === 'authenticated') {
        await signOut({ redirect: false });
      }
      await signIn('credentials', {
        magicToken:  token,
        callbackUrl: '/dashboard',
        redirect:    true,
      });
    };

    proceed();
  }, [status, searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-[#0a4b5e]" />
      <p className="text-sm text-gray-500">Opening your Wansom workspace…</p>
    </div>
  );
}

export default function MagicLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#0a4b5e]" />
      </div>
    }>
      <MagicLoginInner />
    </Suspense>
  );
}
