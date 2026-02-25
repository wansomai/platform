"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Eye, EyeOff, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ErrorAlert } from "@/components/ui/error-alert"
import { useAsyncOperation, useFormState } from "@/hooks/useAsyncOperation"
import Head from "next/head"

// Create a separate component that uses useSearchParams
function LoginPageContent() {
  const { isLoading, error, execute, setError } = useAsyncOperation();
  const { data: formData, updateField } = useFormState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const invitationEmail = searchParams?.get('email');
  const isInvitation = searchParams?.get('invitation') === 'true';

  // Pre-fill email from invitation link
  useEffect(() => {
    if (invitationEmail && !formData.email) {
      updateField('email', decodeURIComponent(invitationEmail));
    }
  }, [invitationEmail]);

  // If already authenticated, redirect to callback URL
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    const result = await execute(async () => {
      const res = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (!res?.ok) {
        throw new Error(res?.error || 'Invalid email or password');
      }

      return res;
    });

    if (result) {
      router.push(callbackUrl);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signIn('google', { callbackUrl });
    } catch (err) {
      setError("Google authentication failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      {/* Form Side */}
      <div className="flex flex-1 flex-col justify-center bg-white px-4 py-12 md:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 text-center">Sign in to your account</h1>
          </div>

          {isInvitation && (
            <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-700">You've been invited to join an organization!</p>
                  <p className="text-green-600">
                    Sign in to accept your invitation. {invitationEmail && <>Use <strong>{decodeURIComponent(invitationEmail)}</strong> to sign in.</>}
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
              onClick={handleGoogleLogin}
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
              Sign in with Google
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

          <form className="mt-6 space-y-6" onSubmit={handleEmailLogin}>
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
                onChange={(e) => updateField('email', e.target.value)}
                className="mt-1"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs font-medium text-[#005c4d] hover:text-[#004a3d]">
                  Forgot your password?
                </Link>
              </div>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="pr-10"
                  placeholder="••••••••"
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
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
              <p className="text-gray-600 text-center mt-4">
                Don't have an account?{' '}
                <Link
                  href={
                    callbackUrl && callbackUrl !== '/dashboard'
                      ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}${invitationEmail ? `&email=${invitationEmail}` : ''}`
                      : "/register"
                  }
                  className="text-[#005c4d] font-medium"
                >
                  Register
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
      {/* Creative Side */}
    </div>
  );
}

// Main component that wraps the content in Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Head>
        <title>Create Your Account | Wansom AI</title>
        <meta name="description" content="create you wansom.ai account and start automating your legal processes" />
        <meta name="keywords" content="login wansom.ai, legal ai,ai law,legal ai companies " />
        <meta property="og:title" content="Create Your Account | Wansom AI"/>
        <meta property="og:description" content="create you wansom.ai account and start automating your legal processes" />
        <meta property="og:image" content="/images/features-2.jpg" />
        <meta name="twitter:card" content="Legal AI Assistant pricing for wansom AI" />
        <meta name="twitter:title" content="Create Your Account | Wansom AI" />
        <meta name="twitter:description" content="create you wansom.ai account and start automating your legal processes" />
        <meta name="twitter:image"  content="/images/features-2.jpg"/>
      </Head>
      <LoginPageContent />
    </Suspense>
  );
}
