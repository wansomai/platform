'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mail, CheckCircle2, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { apiService } from '@/lib/api';

type Status = 'idle' | 'sending' | 'sent' | 'verified' | 'gone';

interface Props {
  collapsed?: boolean;
}

export default function EmailVerificationBanner({ collapsed = false }: Props) {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    apiService.get('/api/auth/me').then((res: any) => {
      const user = res?.data?.data?.user ?? res?.data?.user;
      if (!user || user.authProvider === 'google' || user.emailVerified) return;
      setShow(true);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (status !== 'verified') return;
    const t = setTimeout(() => setStatus('gone'), 2500);
    return () => clearTimeout(t);
  }, [status]);

  useEffect(() => {
    if (status !== 'gone') return;
    const t = setTimeout(() => setShow(false), 300);
    return () => clearTimeout(t);
  }, [status]);

  const handleSend = useCallback(async () => {
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

  if (!show) return null;

  const isVerified = status === 'verified';

  /* ── Collapsed: pulsing dot icon only ── */
  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-1.5">
        <div
          className={`relative flex items-center justify-center w-8 h-8 rounded-lg ${isVerified ? 'bg-emerald-50' : 'bg-amber-50'}`}
          title={isVerified ? 'Email verified' : 'Verify your email'}
        >
          {isVerified
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            : <ShieldAlert className="h-4 w-4 text-amber-500" />
          }
          {!isVerified && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ── Expanded: compact inline card ── */
  return (
    <div className="px-3 pb-1">
      <div
        className={`rounded-lg overflow-hidden text-xs transition-all duration-500 ${
          isVerified
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-amber-50 border border-amber-200'
        }`}
        style={!isVerified ? { borderLeft: '3px solid #f59e0b' } : {}}
      >
        {isVerified ? (
          /* Verified */
          <div className="flex items-center gap-2 px-2.5 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="font-semibold text-emerald-700">Email verified!</span>
          </div>
        ) : status === 'sent' ? (
          /* Sent state */
          <div className="px-2.5 py-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-amber-500 shrink-0" />
              <span className="font-semibold text-amber-800">Check your inbox</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCheckVerified}
                className="flex-1 inline-flex items-center justify-center gap-1 font-semibold bg-[#0a4b5e] hover:bg-[#005c4d] text-white py-1 rounded transition-colors"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                Done ✓
              </button>
              {cooldown > 0 ? (
                <span className="text-amber-400 whitespace-nowrap">{cooldown}s</span>
              ) : (
                <button
                  onClick={handleSend}
                  className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 transition-colors"
                >
                  <RefreshCw className="h-2.5 w-2.5" />
                  Resend
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Idle / sending state */
          <div className="flex items-center gap-2 px-2.5 py-2">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-semibold text-amber-800 flex-1 leading-tight">Verify email</span>
            <button
              onClick={handleSend}
              disabled={status === 'sending'}
              className="inline-flex items-center gap-1 font-semibold bg-[#0a4b5e] hover:bg-[#005c4d] text-white px-2 py-1 rounded transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {status === 'sending'
                ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                : <><Mail className="h-2.5 w-2.5" />Send</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
