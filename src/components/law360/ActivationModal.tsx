'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PracticeArea, PRACTICE_AREA_LABELS } from '@/types/associates';
import MultiCountrySelector from '@/components/commons/multi-country-selector';
import { toast } from 'sonner';
import {
  Globe,
  Clock,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  KeyRound,
  Radar,
  ShieldCheck,
  FileSearch,
} from 'lucide-react';

interface ActivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'preferences' | 'confirmed' | 'access';

export default function ActivationModal({ open, onOpenChange }: ActivationModalProps) {
  // Preferences
  const [jurisdictions, setJurisdictions] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [topics, setTopics] = useState<string[]>([PracticeArea.GENERAL_PRACTICE]);
  const [jurisdictionSelectorOpen, setJurisdictionSelectorOpen] = useState(false);

  // Email (for unauthenticated flow)
  const [email, setEmail] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<
    'idle' | 'verified_user' | 'unverified_user' | 'new_user'
  >('idle');

  const [errors, setErrors] = useState({ jurisdictions: false, topics: false, email: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('preferences');
  const [isNewUser, setIsNewUser] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [magicToken, setMagicToken] = useState('');

  // Access step state
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // ─── Google OAuth return ───────────────────────────────────────────────────
  const { data: session, status } = useSession();

  // When the modal opens after a Google OAuth redirect (?ga=1), restore the
  // saved preferences and pre-fill the email from the Google session.
  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('ga') !== '1' || status !== 'authenticated') return;

    const gEmail = (session as any)?.user?.email as string | undefined;
    if (gEmail) {
      setEmail(gEmail);
      setEmailChecked(true);
      setEmailStatus('verified_user');
    }

    const pending = sessionStorage.getItem('briefly_pending_prefs');
    if (pending) {
      try {
        const prefs = JSON.parse(pending);
        if (prefs.jurisdictions?.length) setJurisdictions(prefs.jurisdictions);
        if (prefs.frequency)             setFrequency(prefs.frequency);
        if (prefs.topics?.length)        setTopics(prefs.topics);
      } catch {}
      sessionStorage.removeItem('briefly_pending_prefs');
    }

    // Clean the ?ga=1 param now that we've consumed it
    const url = new URL(window.location.href);
    url.searchParams.delete('ga');
    window.history.replaceState({}, '', url.toString());
  }, [open, status, session]);

  const handleGoogleSignIn = () => {
    sessionStorage.setItem('briefly_pending_prefs', JSON.stringify({ jurisdictions, frequency, topics }));
    const returnUrl = `${window.location.pathname}?ga=1`;
    signIn('google', { callbackUrl: returnUrl });
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const allTopics  = Object.keys(PRACTICE_AREA_LABELS);
  const allSelected = allTopics.every((t) => topics.includes(t));

  const toggleTopic = (topic: string) => {
    setTopics((prev) => {
      const next = prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic];
      if (next.length > 0) setErrors((e) => ({ ...e, topics: false }));
      return next;
    });
  };

  const toggleAllTopics = () => {
    const next = allSelected ? [] : allTopics;
    setTopics(next);
    if (next.length > 0) setErrors((e) => ({ ...e, topics: false }));
  };


  // ─── Email check ───────────────────────────────────────────────────────────

  const handleEmailCheck = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { toast.error('Please enter a valid email address'); return; }

    setIsCheckingEmail(true);
    try {
      const res = await fetch('/api/law360/check-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      const { exists, emailVerified } = data.data ?? {};

      if (!exists) {
        setEmailStatus('new_user');
      } else if (emailVerified) {
        setEmailStatus('verified_user');
      } else {
        setEmailStatus('unverified_user');
      }
      setEmailChecked(true);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // ─── Activate ──────────────────────────────────────────────────────────────

  const handleActivate = async () => {
    const newErrors = {
      jurisdictions: jurisdictions.length === 0,
      topics:        topics.length === 0,
      email:         !emailChecked,
    };
    if (newErrors.jurisdictions || newErrors.topics || newErrors.email) {
      setErrors(newErrors);
      return;
    }

    setErrors({ jurisdictions: false, topics: false, email: false });
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/law360/activate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), frequency, topics, jurisdictions }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Something went wrong. Please try again.');
        return;
      }
      setIsNewUser(data.data?.isNewUser ?? false);
      setSubscribedEmail(data.data?.userEmail ?? email.trim());
      if (data.data?.isNewUser) {
        setTempPassword(data.data?.tempPassword ?? '');
        setMagicToken(data.data?.magicToken ?? '');
      }

      setStep('confirmed');
    } catch {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Reset on close ────────────────────────────────────────────────────────

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setJurisdictions([]);
      setFrequency('weekly');
      setTopics([PracticeArea.GENERAL_PRACTICE]);
      setEmail('');
      setEmailChecked(false);
      setIsCheckingEmail(false);
      setEmailStatus('idle');
      setIsSubmitting(false);
      setErrors({ jurisdictions: false, topics: false, email: false });
      setJurisdictionSelectorOpen(false);
      setStep('preferences');
      setIsNewUser(false);
      setTempPassword('');
      setSubscribedEmail('');
      setMagicToken('');
      setShowPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setPasswordUpdated(false);
      setExistingPasswordError('');
      setIsSigningIn(false);
    }
    onOpenChange(newOpen);
  };

  // ─── Access screen ────────────────────────────────────────────────────────────

  // State used for existing-user password entry (reuse newPassword field)
  const [existingPasswordError, setExistingPasswordError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleOpenWansom = async () => {
    const activeEmail = subscribedEmail || email.trim();

    // ── Existing user: sign in with their Wansom password ──────────────────
    if (!isNewUser) {
      if (!newPassword) {
        setExistingPasswordError('Please enter your Wansom password.');
        return;
      }
      setExistingPasswordError('');
      setIsSigningIn(true);
      const result = await signIn('credentials', {
        email:       activeEmail,
        password:    newPassword,
        callbackUrl: '/dashboard',
        redirect:    false,
      });
      setIsSigningIn(false);
      if (result?.error) {
        setExistingPasswordError('Incorrect password. Please try again.');
        return;
      }
      window.location.href = result?.url || '/dashboard';
      return;
    }

    // ── New user: optional password change, then magic-link login ──────────
    if (newPassword && !passwordUpdated) {
      if (newPassword.length < 8) {
        toast.error('New password must be at least 8 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
      setIsUpdatingPassword(true);
      try {
        const res = await fetch('/api/law360/set-password', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            email:           activeEmail,
            currentPassword: tempPassword,
            newPassword,
          }),
        });
        if (!res.ok) {
          toast.error('Failed to update password. Please change it after logging in.');
        } else {
          setPasswordUpdated(true);
          toast.success('Password updated!');
        }
      } catch {
        toast.error('Network error. Please change your password after logging in.');
      } finally {
        setIsUpdatingPassword(false);
      }
    }

    const loginUrl = magicToken
      ? `/magic-login?token=${magicToken}`
      : `/login?email=${encodeURIComponent(activeEmail)}`;
    window.location.href = loginUrl;
  };

  if (step === 'access') {
    const activeEmail = subscribedEmail || email.trim();
    const displayPassword = passwordUpdated ? newPassword : tempPassword;
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <div className="flex flex-col py-4 px-1 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0a4b5e]/10 flex items-center justify-center shrink-0">
                <KeyRound className="h-5 w-5 text-[#0a4b5e]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isNewUser ? 'Your Intelligence Dashboard Access' : 'Sign in to Wansom AI'}
                </h2>
                <p className="text-xs text-gray-500">
                  {isNewUser ? 'Use these credentials to open your dashboard' : 'Enter your Wansom password to continue'}
                </p>
              </div>
            </div>

            {/* Email — always shown */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
              <div className="flex items-center gap-2 bg-gray-50 border rounded-md px-3 py-2">
                <span className="text-sm text-gray-800 flex-1 truncate">{activeEmail}</span>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(activeEmail); toast.success('Email copied!'); }}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* ── New user: show generated password + optional change ── */}
            {isNewUser && (
              <>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Generated password</p>
                  <div className="flex items-center gap-2 bg-gray-50 border rounded-md px-3 py-2">
                    <span className="text-sm text-gray-800 flex-1 font-mono">
                      {showPassword ? displayPassword : '•'.repeat(displayPassword.length)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(displayPassword); toast.success('Password copied!'); }}
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {!passwordUpdated && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">Choose a new password (optional)</p>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="New password (min. 8 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {newPassword && (
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="text-sm"
                      />
                    )}
                  </div>
                )}

                {passwordUpdated && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-md px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Password updated successfully.
                  </div>
                )}
              </>
            )}

            {/* ── Existing user: password input ── */}
            {!isNewUser && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500">Wansom password</p>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter your Wansom password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setExistingPasswordError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleOpenWansom(); }}
                    className={`pr-10 text-sm ${existingPasswordError ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {existingPasswordError && (
                  <p className="text-xs text-red-500">{existingPasswordError}</p>
                )}
                <p className="text-xs text-gray-400">
                  Forgot your password?{' '}
                  <a
                    href={`/forgot-password?email=${encodeURIComponent(activeEmail)}`}
                    className="text-[#0a4b5e] underline underline-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Reset it here
                  </a>
                </p>
              </div>
            )}

            <Button
              onClick={handleOpenWansom}
              disabled={isUpdatingPassword || isSigningIn}
              className="w-full bg-[#0a4b5e] hover:bg-[#0a4b5e]/90"
            >
              {(isUpdatingPassword || isSigningIn)
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isSigningIn ? 'Signing in…' : 'Updating password…'}</>
                : <><ExternalLink className="h-4 w-4 mr-2" />Open Intelligence Dashboard</>
              }
            </Button>
            <button
              type="button"
              onClick={() => setStep('confirmed')}
              className="text-xs text-gray-400 hover:text-gray-600 text-center w-full"
            >
              ← Back
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Confirmed screen ──────────────────────────────────────────────────────

  if (step === 'confirmed') {
    const confirmedEmail = email.trim();
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <div className="flex flex-col items-center text-center py-6 px-2 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Your intelligence monitor is active.</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {isNewUser
                  ? <>Your Wansom account has been created and your first <strong>Briefly</strong> intelligence brief is being prepared. Check <strong>{confirmedEmail}</strong> for your access details.</>
                  : <>Your <strong>Briefly by Wansom</strong> monitor is now tracking the coverage you selected. A confirmation has been sent to <strong>{confirmedEmail}</strong>.</>
                }
              </p>
            </div>

            <div className="w-full bg-gray-50 rounded-lg p-4 text-left space-y-2 text-sm">
              <p className="font-medium text-gray-700 flex items-center gap-2">
                <Radar className="h-4 w-4 text-[#0a4b5e]" />
                Your monitor profile
              </p>
              <p className="text-gray-500">
                <span className="font-medium text-gray-700">Cadence:</span>{' '}
                {frequency === 'daily' ? 'Morning intelligence brief' : 'Monday strategic brief'}
              </p>
              <p className="text-gray-500">
                <span className="font-medium text-gray-700">Coverage:</span>{' '}
                {jurisdictions.join(', ')}
              </p>
              <p className="text-gray-500">
                <span className="font-medium text-gray-700">Watch areas:</span>{' '}
                {topics.length === allTopics.length ? 'All practice areas' : `${topics.length} selected`}
              </p>
              <p className="text-gray-500">
                <span className="font-medium text-gray-700">Source types:</span>{' '}
                Courts, regulators, gazettes, legal news
              </p>
              <p className="text-gray-500">
                <span className="font-medium text-gray-700">First brief:</span>{' '}
                {frequency === 'daily' ? 'Tomorrow at 09:30 EAT' : 'Next Monday at 09:30 EAT'}
              </p>
            </div>

            <div className="w-full flex flex-col gap-2">
              <Button
                onClick={() => setStep('access')}
                className="w-full bg-[#0a4b5e] hover:bg-[#0a4b5e]/90"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Intelligence Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="w-full text-gray-500"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Preferences screen ────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Configure Your Legal Intelligence Monitor</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">

          {/* Jurisdictions */}
          <div>
            <Label className={`text-sm font-medium flex items-center gap-2 ${errors.jurisdictions ? 'text-red-600' : ''}`}>
              <Globe className="h-4 w-4" />
              Coverage jurisdictions
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Choose the markets Briefly should monitor for legal and regulatory movement.
            </p>
            <div className={errors.jurisdictions ? 'rounded-lg ring-2 ring-red-400' : ''}>
              <MultiCountrySelector
                id="activation-jurisdictions"
                open={jurisdictionSelectorOpen}
                onToggle={() => setJurisdictionSelectorOpen(!jurisdictionSelectorOpen)}
                selectedValues={jurisdictions}
                onChange={(v) => {
                  setJurisdictions(v);
                  if (v.length > 0) setErrors((e) => ({ ...e, jurisdictions: false }));
                }}
                placeholder="Select markets..."
              />
            </div>
            {errors.jurisdictions && (
              <p className="text-xs text-red-500 mt-1">Please select at least one jurisdiction.</p>
            )}
          </div>

          {/* Frequency */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
             How often should we send you updates?
            </Label>
            <div className="flex gap-3 mt-2">
              {(['daily', 'weekly'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors text-left ${
                    frequency === f ? 'border-[#0a4b5e] bg-[#0a4b5e]/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-sm capitalize">{f}</p>
                  <p className="text-xs text-muted-foreground">
                    {f === 'daily' ? 'Morning intelligence brief' : 'Monday strategic brief'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Practice Areas */}
          <div>
            <Label className={`text-sm font-medium flex items-center gap-2 ${errors.topics ? 'text-red-600' : ''}`}>
              <Radar className="h-4 w-4" />
              Watch areas
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Select the risk and practice areas your monitor should track.
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox id="modal-topic-all" checked={allSelected} onCheckedChange={toggleAllTopics} />
              <label htmlFor="modal-topic-all" className="text-xs font-medium cursor-pointer">All topics</label>
            </div>
            <div className={`grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-28 overflow-y-auto ${errors.topics ? 'border-red-400 ring-2 ring-red-400' : ''}`}>
              {Object.entries(PRACTICE_AREA_LABELS).map(([area, label]) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={`modal-topic-${area}`}
                    checked={topics.includes(area)}
                    onCheckedChange={() => toggleTopic(area)}
                  />
                  <label htmlFor={`modal-topic-${area}`} className="text-xs cursor-pointer">{label}</label>
                </div>
              ))}
            </div>
            {errors.topics && (
              <p className="text-xs text-red-500 mt-1">Please select at least one practice area.</p>
            )}
          </div>
{/* 
          <div className="rounded-lg border border-[#0a4b5e]/15 bg-[#0a4b5e]/5 p-4">
            <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0a4b5e]" />
              What your monitor will produce
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs text-gray-600">
              <div className="space-y-1">
                <p className="font-medium text-gray-800">Signal</p>
                <p>Relevant legal developments from your selected markets.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-gray-800">Context</p>
                <p>Plain-language summaries, source links, and why it matters.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-gray-800">Action</p>
                <p>Briefs your legal, compliance, or leadership team can use.</p>
              </div>
            </div>
          </div> */}

          <div className="h-px bg-gray-100" />

          {/* Email */}
          <div>
            <Label htmlFor="activation-email" className={`text-sm font-medium ${errors.email ? 'text-red-600' : ''}`}>
              Work email
            </Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="activation-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((err) => ({ ...err, email: false }));
                  if (emailChecked) { setEmailChecked(false); setEmailStatus('idle'); }
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !emailChecked) handleEmailCheck(); }}
                placeholder="you@example.com"
                disabled={isCheckingEmail || isSubmitting}
                className={errors.email ? 'border-red-400 ring-2 ring-red-400' : ''}
              />
              {!emailChecked && (
                <Button
                  onClick={handleEmailCheck}
                  disabled={isCheckingEmail || !email.trim()}
                  className="shrink-0"
                >
                  {isCheckingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
                </Button>
              )}
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">Please enter and verify your email address.</p>
            )}

            {emailStatus === 'verified_user' && (
              <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-100 rounded-lg mt-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">
                  Your Wansom account is verified. Activate your intelligence monitor below.
                </p>
              </div>
            )}
            {emailStatus === 'new_user' && (
              <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-100 rounded-lg mt-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">
                  We'll create your Wansom account and send access details to <strong>{email}</strong>.
                </p>
              </div>
            )}

            {!emailChecked && (
              <>
                <div className="relative mt-3">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-xs text-gray-400">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="mt-2 w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </>
            )}
          </div>

          {/* Activate button */}
          <Button
            onClick={handleActivate}
            className="w-full bg-[#0a4b5e] hover:bg-[#0a4b5e]/90"
            disabled={
              isSubmitting ||
              isCheckingEmail ||
              !emailChecked
            }
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Building your monitor...</>
            ) : (
              <><FileSearch className="h-4 w-4 mr-2" />Activate Monitor</>
            )}
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}
