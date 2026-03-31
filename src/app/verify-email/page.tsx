'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const success = params.get('success') === 'true';
  const error = params.get('error');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!success) return;
    const interval = setInterval(() => {
      setCountdown((n) => Math.max(0, n - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [success]);

  useEffect(() => {
    if (!success || countdown > 0) return;
    router.push('/dashboard');
  }, [success, countdown, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image src="/logo-lg.png" alt="Wansom AI" width={140} height={40} className="mx-auto h-10 w-auto object-contain" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {success ? (
            <>
              {/* Success state */}
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h1>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Your email address has been confirmed. Your workspace is now fully secured.
              </p>
              <div className="inline-flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-full px-4 py-2 mb-6">
                <Loader2 className="h-3 w-3 animate-spin" />
                Redirecting to dashboard in {countdown}s…
              </div>
              <br />
              <Button onClick={() => router.push('/dashboard')} className="bg-primary hover:bg-primary/90">
                Go to dashboard now
              </Button>
            </>
          ) : error ? (
            <>
              {/* Error state */}
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {error === 'missing_token' ? 'Invalid link' : 'Link expired'}
              </h1>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                {error === 'missing_token'
                  ? 'This verification link is not valid.'
                  : 'This link has expired or was already used. Request a new one from your account settings.'}
              </p>
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Back to dashboard
              </Button>
            </>
          ) : (
            <>
              {/* Neutral / direct visit */}
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Checking…</h1>
              <p className="text-gray-500 text-sm">Please wait a moment.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
