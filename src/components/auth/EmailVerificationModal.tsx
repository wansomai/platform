'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mail, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { apiService } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Status = 'idle' | 'sending' | 'sent' | 'verified';

const SESSION_KEY = 'wansom_email_verify_shown';

export default function EmailVerificationModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    apiService.get('/api/auth/me').then((res: any) => {
      const user = res?.data?.data?.user ?? res?.data?.user;
      if (!user || user.authProvider === 'google' || user.emailVerified) return;
      setEmail(user.email ?? '');
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, '1');
      // Auto-send verification email — silently ignored if recently sent (cooldown)
      apiService.post('/api/auth/send-verification', {}).then(() => {
        setStatus('sent');
        setCooldown(120);
      }).catch(() => {
        // Already sent recently — that's fine, user still has a valid link
        setStatus('sent');
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (status !== 'verified') return;
    const t = setTimeout(() => setOpen(false), 2000);
    return () => clearTimeout(t);
  }, [status]);

  const handleResend = useCallback(async () => {
    setStatus('sending');
    try {
      await apiService.post('/api/auth/send-verification', {});
      setStatus('sent');
      setCooldown(120);
    } catch {
      setStatus('idle');
    }
  }, []);

  const handleCheckVerified = useCallback(async () => {
    try {
      const res: any = await apiService.get('/api/auth/me');
      const user = res?.data?.data?.user ?? res?.data?.user;
      if (user?.emailVerified) setStatus('verified');
    } catch {}
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl w-[calc(100%-2rem)] max-w-[380px]">

        <div className="px-7 pt-7 pb-6">

          {/* Icon */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-5 transition-colors duration-500 ${
            status === 'verified' ? 'bg-emerald-50' : 'bg-[#eaf4f7]'
          }`}>
            {status === 'verified'
              ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              : <Mail className="h-5 w-5 text-[#0a4b5e]" />
            }
          </div>

          {/* Title */}
          <DialogTitle className="text-[17px] font-semibold text-gray-900 mb-1.5">
            {status === 'verified' ? 'Email verified' : 'Check your inbox'}
          </DialogTitle>

          {/* Description */}
          <DialogDescription className="text-sm text-gray-500 leading-relaxed mb-6">
            {status === 'verified' ? (
              'Your account is now fully secured. You have access to all Wansom features.'
            ) : (
              <>
                We sent a verification link to{' '}
                <span className="font-medium text-gray-800">{email}</span>.
                Click the link in that email to confirm your account.
              </>
            )}
          </DialogDescription>

          {status !== 'verified' && (
            <>
              {/* Primary action */}
              <button
                onClick={handleCheckVerified}
                className="w-full bg-[#0a4b5e] hover:bg-[#005c4d] text-white text-sm font-medium py-2.5 rounded-lg transition-colors mb-3"
              >
                I've verified my email
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Resend */}
              {status === 'sent' ? (
                <p className="text-center text-xs text-gray-400">
                  <span className="text-emerald-600 font-medium">Email sent.</span>
                  {cooldown > 0
                    ? ` Resend available in ${cooldown}s`
                    : (
                      <> <button onClick={handleResend} className="text-[#0a4b5e] font-medium hover:underline">Resend again</button></>
                    )
                  }
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={status === 'sending'}
                  className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {status === 'sending' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  ) : (
                    <><RefreshCw className="h-3.5 w-3.5" /> Resend verification email</>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {status !== 'verified' && (
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
        )}

      </DialogContent>
    </Dialog>
  );
}
