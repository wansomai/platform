'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useAsyncOperation, useFormState } from '@/hooks/useAsyncOperation';

interface RegisterFormData {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get('invitationToken');
  const invitationEmail = searchParams.get('email');
  const callbackUrl = searchParams.get('callbackUrl');

  const { isLoading, error, execute, setError } = useAsyncOperation();
  const { data: formData, updateField } = useFormState<RegisterFormData>({
    email: invitationEmail ? decodeURIComponent(invitationEmail) : '',
    password: '',
    fullName: '',
    organizationName: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateField(name as keyof RegisterFormData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await execute(async () => {
      // Prepare registration data
      const registrationData: any = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      };

      // Add invitationToken if present
      if (invitationToken) {
        registrationData.invitationToken = invitationToken;
      } else {
        // Only add organizationName if not invited
        registrationData.organizationName = formData.organizationName;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    });

    if (result) {
      // If there's an invitation token, the invitation was already accepted during registration
      // Redirect to dashboard instead of back to accept-invitation page
      if (invitationToken) {
        // Auto-sign in after registration
        const signInResult = await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        if (signInResult?.ok) {
          // Redirect to dashboard since invitation is already accepted
          router.push('/dashboard?invited=true');
        } else {
          // If auto-signin fails, redirect to login
          router.push('/login');
        }
      } else if (callbackUrl) {
        // Other callback URL scenarios (not invitation)
        const signInResult = await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        if (signInResult?.ok) {
          router.push(decodeURIComponent(callbackUrl));
        } else {
          router.push(`/login?callbackUrl=${callbackUrl}`);
        }
      } else {
        // Normal registration flow - auto sign in and redirect to dashboard
        const signInResult = await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        if (signInResult?.ok) {
          router.push('/dashboard');
        } else {
          router.push('/login?registered=true');
        }
      }
    }
  };

  const handleGoogleSignUp = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className=" min-h-screen flex items-center justify-center bg-white">

      {/* Form Side */}
      <div className="flex flex-1 flex-col justify-center bg-white px-4 py-12 lg:pt-24 md:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 text-center">Create your account</h1>
          </div>

          {invitationToken && (
            <div className="mb-6 rounded-md bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700">You've been invited!</p>
                  <p className="text-blue-600">
                    Complete your registration to join the organization.
                  </p>
                </div>
              </div>
            </div>
          )}

          <ErrorAlert error={error} onDismiss={() => setError(null)} />

          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Sign up with Google
            </Button>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1"
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1"
                placeholder="you@example.com"
                disabled={isLoading || !!invitationEmail}
                readOnly={!!invitationEmail}
              />
              {invitationEmail && (
                <p className="mt-1 text-xs text-gray-500">
                  Email is pre-filled from your invitation
                </p>
              )}
            </div>

            {!invitationToken && (
              <div>
                <Label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                  Organization Name
                </Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required={!invitationToken}
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Your Company"
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="pr-10"
                  placeholder="Password (min 8 characters)"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005c4d]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
              <p className="text-gray-600 text-center mt-4">
                Already have an account? <Link href="/login" className="text-[#005c4d] font-medium">Sign in</Link>
              </p>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
