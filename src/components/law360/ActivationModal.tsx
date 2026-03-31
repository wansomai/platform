'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
import { apiService } from '@/lib/api';
import {
  Globe,
  Clock,
  Mail,
  Loader2,
  CheckCircle2,
  Send,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface ActivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'preferences' | 'confirmed';

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
  const [isSendingPreview, setIsSendingPreview] = useState(false);
  const [previewSent, setPreviewSent] = useState(false);
  const [step, setStep] = useState<Step>('preferences');
  const [isNewUser, setIsNewUser] = useState(false);

  // Authenticated user email-verification state
  const [authEmailVerified, setAuthEmailVerified] = useState<boolean | null>(null);
  const [isSendingAuthVerify, setIsSendingAuthVerify] = useState(false);
  const [authVerifySent, setAuthVerifySent] = useState(false);

  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

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

  // Fetch email verification status for authenticated users when modal opens
  useEffect(() => {
    if (!open || !isAuthenticated) return;
    setAuthEmailVerified(null);
    apiService.get('/api/auth/me').then((res: any) => {
      const user = res?.data?.data?.user ?? res?.data?.user;
      if (!user) return;
      // Google users are always verified
      setAuthEmailVerified(user.authProvider === 'google' || !!user.emailVerified);
    }).catch(() => setAuthEmailVerified(true)); // fail open — backend will catch it
  }, [open, isAuthenticated]);

  const handleSendAuthVerification = async () => {
    setIsSendingAuthVerify(true);
    try {
      await apiService.post('/api/auth/send-verification', {});
      setAuthVerifySent(true);
      toast.success('Verification email sent — check your inbox!');
    } catch {
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setIsSendingAuthVerify(false);
    }
  };

  // Restore preferences saved before a potential OAuth redirect
  useEffect(() => {
    if (!open || !isAuthenticated) return;
    const pending = sessionStorage.getItem('briefly_pending_prefs');
    if (!pending) return;
    try {
      const prefs = JSON.parse(pending);
      if (prefs.jurisdictions?.length) setJurisdictions(prefs.jurisdictions);
      if (prefs.frequency)             setFrequency(prefs.frequency);
      if (prefs.topics?.length)        setTopics(prefs.topics);
      sessionStorage.removeItem('briefly_pending_prefs');
    } catch {}
  }, [open, isAuthenticated]);

  // ─── Preview email ─────────────────────────────────────────────────────────

  const previewEmail = isAuthenticated
    ? (session as any)?.user?.email
    : emailChecked ? email.trim() : '';

  const handleSendPreview = async () => {
    if (jurisdictions.length === 0 || topics.length === 0) {
      setErrors((e) => ({
        ...e,
        jurisdictions: jurisdictions.length === 0,
        topics:        topics.length === 0,
      }));
      return;
    }
    if (!previewEmail) {
      toast.info('Enter and verify your email above to receive a preview.');
      return;
    }
    setIsSendingPreview(true);
    try {
      const res = await fetch('/api/digest/send-preview', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: previewEmail, topics, jurisdictions, frequency }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to send preview.'); return; }
      setPreviewSent(true);
      toast.success(`Preview sent to ${previewEmail} — check your inbox!`);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSendingPreview(false);
    }
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
      email:         !isAuthenticated && !emailChecked,
    };
    if (newErrors.jurisdictions || newErrors.topics || newErrors.email) {
      setErrors(newErrors);
      return;
    }
    if (!isAuthenticated && emailStatus === 'unverified_user') return;

    setErrors({ jurisdictions: false, topics: false, email: false });
    setIsSubmitting(true);

    try {
      if (isAuthenticated) {
        // Authenticated: use the standard subscription API (Bearer token via apiService)
        await apiService.post('/api/digest/subscription', { frequency, topics, jurisdictions });
      } else {
        // Unauthenticated: email-based activation (verified existing user or new user)
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
      setPreviewSent(false);
      setStep('preferences');
      setIsNewUser(false);
      setAuthEmailVerified(null);
      setAuthVerifySent(false);
    }
    onOpenChange(newOpen);
  };

  // ─── Confirmed screen ──────────────────────────────────────────────────────

  if (step === 'confirmed') {
    const confirmedEmail = isAuthenticated ? (session as any)?.user?.email : email.trim();
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <div className="flex flex-col items-center text-center py-6 px-2 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">You're subscribed!</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {isNewUser
                  ? <>Your Wansom account has been created and your first <strong>Briefly</strong> digest is on its way. Check <strong>{confirmedEmail}</strong> for your login details.</>
                  : <>Your <strong>Briefly by Wansom</strong> subscription is active. A confirmation has been sent to <strong>{confirmedEmail}</strong>.</>
                }
              </p>
            </div>

            <div className="w-full bg-gray-50 rounded-lg p-4 text-left space-y-2 text-sm">
              <p className="font-medium text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0a4b5e]" />
                Your digest settings
              </p>
              <p className="text-gray-500">
                <span className="font-medium text-gray-700">Frequency:</span>{' '}
                {frequency === 'daily' ? 'Every morning' : 'Every Monday'}
              </p>
              <p className="text-gray-500">
                <span className="font-medium text-gray-700">Jurisdictions:</span>{' '}
                {jurisdictions.join(', ')}
              </p>
              <p className="text-gray-500">
                <span className="font-medium text-gray-700">First digest:</span>{' '}
                {frequency === 'daily' ? 'Tomorrow at 08:00 UTC' : 'Next Monday at 08:00 UTC'}
              </p>
            </div>

            <Button
              onClick={() => handleOpenChange(false)}
              className="w-full bg-[#0a4b5e] hover:bg-[#0a4b5e]/90"
            >
              Done
            </Button>
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
          <DialogTitle className="text-xl">Set Up Your Legal Digest</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">

          {/* Jurisdictions */}
          <div>
            <Label className={`text-sm font-medium flex items-center gap-2 ${errors.jurisdictions ? 'text-red-600' : ''}`}>
              <Globe className="h-4 w-4" />
              Jurisdictions
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Select countries whose legal updates you want to receive
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
                placeholder="Select jurisdictions..."
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
              Delivery frequency
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
                    {f === 'daily' ? 'Every morning' : 'Every Monday'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Practice Areas */}
          <div>
            <Label className={`text-sm font-medium flex items-center gap-2 ${errors.topics ? 'text-red-600' : ''}`}>
              <Mail className="h-4 w-4" />
              Practice Areas
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Select the topics you want covered
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox id="modal-topic-all" checked={allSelected} onCheckedChange={toggleAllTopics} />
              <label htmlFor="modal-topic-all" className="text-xs font-medium cursor-pointer">All topics</label>
            </div>
            <div className={`grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-24 overflow-y-auto ${errors.topics ? 'border-red-400 ring-2 ring-red-400' : ''}`}>
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

          <div className="h-px bg-gray-100" />

          {/* Account section */}
          {isAuthenticated ? (
            authEmailVerified === false ? (
              // Authenticated but email not verified — show prompt
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <p className="text-sm text-amber-800 font-medium">Email not verified</p>
                    <p className="text-xs text-amber-700">
                      Please verify <strong>{(session as any)?.user?.email}</strong> before subscribing to Briefly.
                    </p>
                    <button
                      onClick={handleSendAuthVerification}
                      disabled={isSendingAuthVerify || authVerifySent}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#0a4b5e] hover:bg-[#0a4b5e]/90 text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-60"
                    >
                      {isSendingAuthVerify
                        ? <><Loader2 className="h-3 w-3 animate-spin" />Sending…</>
                        : authVerifySent
                          ? <><CheckCircle2 className="h-3 w-3" />Email sent — check your inbox</>
                          : <><Mail className="h-3 w-3" />Send verification email</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">
                  Signed in as <strong>{(session as any)?.user?.email}</strong>. Your subscription will be linked to this account.
                </p>
              </div>
            )
          ) : (
            <div>
              <Label htmlFor="activation-email" className={`text-sm font-medium ${errors.email ? 'text-red-600' : ''}`}>
                Email Address
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

              {/* Email status feedback */}
              {emailStatus === 'verified_user' && (
                <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-100 rounded-lg mt-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">
                    Your Wansom account is verified. Click below to start your digest.
                  </p>
                </div>
              )}
              {emailStatus === 'unverified_user' && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg mt-2">
                  <Mail className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Please verify your Wansom email address first — check your inbox for the verification link.
                  </p>
                </div>
              )}
              {emailStatus === 'new_user' && (
                <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-100 rounded-lg mt-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">
                    We'll create your Wansom account and email your login details to <strong>{email}</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleSendPreview}
            disabled={isSendingPreview || isSubmitting}
          >
            {isSendingPreview ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating your preview…</>
            ) : previewSent ? (
              <><CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />Preview sent — send again?</>
            ) : (
              <><Send className="h-4 w-4 mr-2" />Send me a preview digest</>
            )}
          </Button>

          {/* Activate button */}
          <Button
            onClick={handleActivate}
            className="w-full bg-[#0a4b5e] hover:bg-[#0a4b5e]/90"
            disabled={
              isSubmitting ||
              isCheckingEmail ||
              (isAuthenticated && authEmailVerified === false) ||
              (!isAuthenticated && (!emailChecked || emailStatus === 'unverified_user'))
            }
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting up your digest…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Start My Digest</>
            )}
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}
