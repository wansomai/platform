'use client';

import { useState } from 'react';
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
  Mail,
  CreditCard,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface ActivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getNameFromEmail(email: string): string {
  const local = email.split('@')[0];
  return local
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export default function ActivationModal({ open, onOpenChange }: ActivationModalProps) {
  // Preferences
  const [jurisdictions, setJurisdictions] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [topics, setTopics] = useState<string[]>([PracticeArea.GENERAL_PRACTICE]);
  const [jurisdictionSelectorOpen, setJurisdictionSelectorOpen] = useState(false);

  // Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const toggleTopic = (topic: string) => {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  // ─── Email check ───────────────────────────────────────────────────────────

  const handleEmailCheck = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsCheckingEmail(true);
    try {
      const res = await fetch('/api/law360/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      setIsExistingUser(data.data?.exists ?? false);
      setEmailChecked(true);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // ─── Activate (auth + subscribe + redirect) ────────────────────────────────

  const handleActivate = async () => {
    if (jurisdictions.length === 0) {
      toast.error('Please select at least one jurisdiction');
      return;
    }
    if (topics.length === 0) {
      toast.error('Please select at least one practice area');
      return;
    }
    if (!emailChecked) {
      toast.error('Please enter and verify your email address');
      return;
    }
    if (isExistingUser && password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      let token = '';
      let tempPwd: string | undefined;

      if (isExistingUser) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || 'Incorrect password. Please try again.');
          return;
        }
        token = data.data.access_token;
      } else {
        tempPwd = generateTempPassword();
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: tempPwd,
            fullName: getNameFromEmail(email.trim()),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || 'Registration failed. Please try again.');
          return;
        }
        token = data.data.access_token;
      }

      const activateRes = await fetch('/api/law360/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          frequency,
          topics,
          jurisdictions,
          ...(tempPwd ? { tempPassword: tempPwd } : {}),
        }),
      });

      const activateData = await activateRes.json();
      if (!activateRes.ok) {
        toast.error(activateData.message || 'Something went wrong. Please try again.');
        return;
      }

      if (activateData.data?.authorizationUrl) {
        window.location.href = activateData.data.authorizationUrl;
      }
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
      setPassword('');
      setShowPassword(false);
      setEmailChecked(false);
      setIsCheckingEmail(false);
      setIsExistingUser(false);
      setIsSubmitting(false);
      setJurisdictionSelectorOpen(false);
    }
    onOpenChange(newOpen);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Set Up Your Legal Digest</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Jurisdictions */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Jurisdictions
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Select countries whose legal updates you want to receive
            </p>
            <MultiCountrySelector
              id="activation-jurisdictions"
              open={jurisdictionSelectorOpen}
              onToggle={() => setJurisdictionSelectorOpen(!jurisdictionSelectorOpen)}
              selectedValues={jurisdictions}
              onChange={setJurisdictions}
              placeholder="Select jurisdictions..."
            />
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
                    frequency === f
                      ? 'border-[#0a4b5e] bg-[#0a4b5e]/5'
                      : 'border-gray-200 hover:border-gray-300'
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
            <Label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Practice Areas
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Select the topics you want covered
            </p>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-24 overflow-y-auto">
              {Object.entries(PRACTICE_AREA_LABELS).map(([area, label]) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={`modal-topic-${area}`}
                    checked={topics.includes(area)}
                    onCheckedChange={() => toggleTopic(area)}
                  />
                  <label htmlFor={`modal-topic-${area}`} className="text-xs cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Email */}
          <div>
            <Label htmlFor="activation-email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="activation-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailChecked) {
                    setEmailChecked(false);
                    setPassword('');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !emailChecked) handleEmailCheck();
                }}
                placeholder="you@example.com"
                disabled={isCheckingEmail || isSubmitting}
              />
              {!emailChecked && (
                <Button
                  onClick={handleEmailCheck}
                  disabled={isCheckingEmail || !email.trim()}
                  className="shrink-0"
                >
                  {isCheckingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                </Button>
              )}
            </div>
          </div>

          {/* Existing user: password */}
          {emailChecked && isExistingUser && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-primary">
                  Welcome back! Enter your Wansom password to continue.
                </p>
              </div>
              <div>
                <Label htmlFor="activation-password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="activation-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleActivate();
                    }}
                    placeholder="Your Wansom password"
                    className="pr-10"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New user: reassurance */}
          {emailChecked && !isExistingUser && (
            <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-100 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">
                We&apos;ll create your account and email your login details to{' '}
                <strong>{email}</strong>.
              </p>
            </div>
          )}

          <Button
            onClick={handleActivate}
            className="w-full bg-[#0a4b5e] hover:bg-[#0a4b5e]/90"
            disabled={isSubmitting || isCheckingEmail || !emailChecked}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Please wait...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Activate Briefly
              </>
            )}
          </Button>

          {/* <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Lock className="h-3 w-3" />
            <span>Secure payment · Cancel anytime</span>
          </div> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
