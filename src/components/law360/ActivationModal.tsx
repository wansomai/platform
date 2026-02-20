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
import { COUNTRIES } from '@/lib/country-picker/countries';
import MultiCountrySelector from '@/components/commons/multi-country-selector';
import { toast } from 'sonner';
import { Globe, Clock, Mail, ArrowLeft, ArrowRight, CreditCard, Loader2, Eye, EyeOff } from 'lucide-react';

interface ActivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ActivationModal({ open, onOpenChange }: ActivationModalProps) {
  const [step, setStep] = useState(1);

  // Step 1 - Preferences
  const [jurisdictions, setJurisdictions] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [topics, setTopics] = useState<string[]>([PracticeArea.GENERAL_PRACTICE]);
  const [jurisdictionSelectorOpen, setJurisdictionSelectorOpen] = useState(false);

  // Step 2 - Account details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  // Auth token from login/register
  const [accessToken, setAccessToken] = useState('');

  // Step 3 - Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTopic = (topic: string) => {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleStep1Next = () => {
    if (jurisdictions.length === 0) {
      toast.error('Please select at least one jurisdiction');
      return;
    }
    if (topics.length === 0) {
      toast.error('Please select at least one practice area');
      return;
    }
    setStep(2);
  };

  const handleStep2Next = async () => {
    // Validate fields
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsAuthenticating(true);

    try {
      // First, check if email exists
      const checkRes = await fetch('/api/law360/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const checkData = await checkRes.json();
      const emailExists = checkData.data?.exists;

      if (emailExists) {
        // Login existing user
        setIsExistingUser(true);
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });
        const loginData = await loginRes.json();

        if (!loginRes.ok) {
          toast.error(loginData.message || 'Invalid credentials. Please check your password and try again.');
          return;
        }

        setAccessToken(loginData.data.access_token);
        if (loginData.data.user?.fullName) {
          setFullName(loginData.data.user.fullName);
        }
        toast.success('Logged in successfully!');
      } else {
        // Register new user
        if (fullName.trim().length < 2) {
          toast.error('Please enter your full name (at least 2 characters)');
          return;
        }

        setIsExistingUser(false);
        const registerRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
          }),
        });
        const registerData = await registerRes.json();

        if (!registerRes.ok) {
          toast.error(registerData.message || 'Registration failed. Please try again.');
          return;
        }

        setAccessToken(registerData.data.access_token);
        toast.success('Account created successfully!');
      }

      setStep(3);
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleActivate = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/law360/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          frequency,
          topics,
          jurisdictions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || data.error?.message || 'Something went wrong. Please try again.');
        return;
      }

      // Redirect to Paystack checkout
      if (data.data?.authorizationUrl) {
        window.location.href = data.data.authorizationUrl;
      }
    } catch (error) {
      console.error('Activation error:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getJurisdictionNames = () => {
    return jurisdictions.map((code) => {
      const country = COUNTRIES.find((c) => c.value === code);
      return country?.title || code;
    });
  };

  const getTopicLabels = () => {
    return topics.map(
      (t) => (PRACTICE_AREA_LABELS as Record<string, string>)[t] || t
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep(1);
      setJurisdictions([]);
      setFrequency('weekly');
      setTopics([PracticeArea.GENERAL_PRACTICE]);
      setFullName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setIsSubmitting(false);
      setIsAuthenticating(false);
      setIsExistingUser(false);
      setAccessToken('');
      setJurisdictionSelectorOpen(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === 1 && 'Customize Your Legal Digest'}
            {step === 2 && 'Your Account Details'}
            {step === 3 && 'Activate Briefly by Wansom'}
          </DialogTitle>
          {/* Progress indicator */}
          <div className="flex items-center gap-2 pt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-[#0a4b5e]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Step {step} of 3
          </p>
        </DialogHeader>

        {/* Step 1: Preferences */}
        {step === 1 && (
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
                How frequently do you want to receive updates?
              </Label>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setFrequency('daily')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors text-left ${
                    frequency === 'daily'
                      ? 'border-[#0a4b5e] bg-[#0a4b5e]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-sm">Daily</p>
                  <p className="text-xs text-muted-foreground">Every morning</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency('weekly')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors text-left ${
                    frequency === 'weekly'
                      ? 'border-[#0a4b5e] bg-[#0a4b5e]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-sm">Weekly</p>
                  <p className="text-xs text-muted-foreground">Every Monday</p>
                </button>
              </div>
            </div>

            {/* Topics */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Practice Areas
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Select the topics you want covered
              </p>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-44 overflow-y-auto">
                {Object.entries(PRACTICE_AREA_LABELS).map(([area, label]) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={`modal-topic-${area}`}
                      checked={topics.includes(area)}
                      onCheckedChange={() => toggleTopic(area)}
                    />
                    <label
                      htmlFor={`modal-topic-${area}`}
                      className="text-xs cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleStep1Next} className="w-full">
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Account Details */}
        {step === 2 && (
          <div className="space-y-5 py-2">
            <div>
              <Label htmlFor="activation-name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="activation-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="activation-email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="activation-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5"
              />
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
                  placeholder="Min. 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                New here? We&apos;ll create your account. Already registered? We&apos;ll log you in.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1" disabled={isAuthenticating}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleStep2Next} className="flex-1" disabled={isAuthenticating}>
                {isAuthenticating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Pay */}
        {step === 3 && (
          <div className="space-y-5 py-2">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-sm">Subscription Summary</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Account:</span>{' '}
                  <span className="font-medium">{email}</span>
                  {isExistingUser && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      Existing account
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Frequency:</span>{' '}
                  <span className="font-medium capitalize">{frequency}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Jurisdictions:</span>{' '}
                  <span className="font-medium">{getJurisdictionNames().join(', ')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Topics:</span>{' '}
                  <span className="font-medium">{getTopicLabels().join(', ')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={isSubmitting}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleActivate}
                disabled={isSubmitting}
                className="flex-1 bg-[#0a4b5e] hover:bg-[#0a4b5e]/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Activate Briefly by Wansom
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
