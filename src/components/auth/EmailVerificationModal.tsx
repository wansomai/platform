'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mail, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiService } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Status = 'idle' | 'sending' | 'sent';

const SESSION_KEY = 'wansom_email_verify_shown';

// Parse "Please wait 87s before..." from the API's RESEND_TOO_SOON message.
function parseCooldownFromError(err: any): number | null {
  const msg: string =
    err?.response?.data?.message ?? err?.message ?? '';
  const match = msg.match(/wait (\d+)s/);
  return match ? parseInt(match[1], 10) : null;
}

export default function EmailVerificationModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // `active` prevents stale callbacks from a React Strict Mode double-invocation
    // (or any unmount before the async chain completes) from updating state.
    let active = true;

    apiService.get('/api/auth/me').then((res: any) => {
      if (!active) return;
      const user = res?.data?.data?.user ?? res?.data?.user;
      if (!user || user.authProvider === 'google' || user.emailVerified) return;
      setEmail(user.email ?? '');
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, '1');
      // Auto-send on first open
      apiService.post('/api/auth/send-verification', {}).then(() => {
        if (!active) return;
        setStatus('sent');
        setCooldown(120);
      }).catch((err) => {
        if (!active) return;
        // 429: a valid email was already sent recently — honour whatever cooldown remains
        const secs = parseCooldownFromError(err);
        setStatus('sent');
        setCooldown(secs ?? 120);
      });
    }).catch(() => {});

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (status === 'sending' || cooldown > 0) return;
    setStatus('sending');
    setError(null);
    try {
      await apiService.post('/api/auth/send-verification', {});
      setStatus('sent');
      setCooldown(120);
    } catch (err) {
      const secs = parseCooldownFromError(err);
      if (secs !== null) {
        // Server still enforcing cooldown — apply it client-side
        setStatus('sent');
        setCooldown(secs);
      } else {
        setStatus('idle');
        const msg: string =
          (err as any)?.response?.data?.message ?? (err as any)?.message ?? '';
        setError(msg || 'Failed to send. Please try again.');
      }
    }
  }, [status, cooldown]);

  const isCoolingDown = status === 'sent' && cooldown > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl w-[calc(100%-2rem)] max-w-[380px]">

        <div className="px-7 pt-7 pb-6">

          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center bg-[#eaf4f7]">
              <Mail className="h-5 w-5 text-[#0a4b5e]" />
            </div>
            <DialogTitle className="text-[17px] font-semibold text-gray-900">
              Check your inbox
            </DialogTitle>
          </div>

          {/* Description */}
          <DialogDescription className="text-sm text-gray-500 leading-relaxed mb-6">
            We sent a verification link to{' '}
            <span className="font-medium text-gray-800">{email}</span>.
            Click the link in that email to confirm your account.
          </DialogDescription>

          {/* Resend button — primary CTA */}
          <button
            onClick={handleResend}
            disabled={status === 'sending' || isCoolingDown}
            className="w-full flex items-center justify-center gap-2 bg-[#0a4b5e] hover:bg-[#005c4d] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {status === 'sending' ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
            ) : isCoolingDown ? (
              <><CheckCircle2 className="h-4 w-4" /> Email sent · Resend in {cooldown}s</>
            ) : (
              <><RefreshCw className="h-3.5 w-3.5" /> Resend the email</>
            )}
          </button>

          {error && (
            <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-3.5 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Check your spam folder if you don't see it.{' '}
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              I'll do this later
            </button>
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
}
