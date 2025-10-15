'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function OptInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Activating your Wansom Pro account...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid activation link. Please check your email and try again.');
      return;
    }

    // Call the API to activate the account
    const activateAccount = async () => {
      try {
        const response = await fetch(`/api/events/opt-in/activate?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Account activated successfully! Redirecting to dashboard...');

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to activate account. Please try again or contact support.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Something went wrong. Please try again or contact support at law@wansom.ai');
      }
    };

    activateAccount();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary">WANSOM.AI</h1>
          </div>

          {/* Status Icon */}
          <div className="mb-6">
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {status === 'loading' && 'Setting Up Your Account'}
            {status === 'success' && 'Welcome to Wansom Pro!'}
            {status === 'error' && 'Activation Failed'}
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            {message}
          </p>

          {/* Additional Info */}
          {status === 'loading' && (
            <div className="space-y-3 text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span>Creating your account</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                <span>Generating credentials</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                <span>Sending welcome email</span>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              <p className="font-semibold mb-2">Check your email!</p>
              <p>We've sent your login credentials to your email address. You can also access your account settings to change your password once logged in.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Go to Login
              </button>
              <p className="text-sm text-gray-500">
                Need help? Contact us at{' '}
                <a href="mailto:law@wansom.ai" className="text-primary hover:underline">
                  law@wansom.ai
                </a>
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              © 2025 Wansom Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OptInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-primary">WANSOM.AI</h1>
            </div>
            <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
          </div>
        </div>
      </div>
    }>
      <OptInContent />
    </Suspense>
  );
}
