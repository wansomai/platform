'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, Mail } from 'lucide-react';
import Link from 'next/link';

export default function UpgradeErrorPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const getErrorMessage = () => {
    switch (reason) {
      case 'invalid-token':
        return {
          title: 'Invalid Approval Link',
          description: 'This upgrade approval link is invalid or has already been used.',
          details: 'The link may have expired or the organization may have already been upgraded.'
        };
      case 'expired-token':
        return {
          title: 'Expired Approval Link',
          description: 'This upgrade approval link has expired.',
          details: 'Approval links are valid for 7 days. Please request a new upgrade to receive a fresh approval link.'
        };
      default:
        return {
          title: 'Upgrade Failed',
          description: 'We encountered an error while processing the upgrade.',
          details: 'An unexpected error occurred. Please try again or contact support.'
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
              <CardDescription>
                {errorInfo.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-900 mb-1">
              What happened?
            </p>
            <p className="text-sm text-red-700">
              {errorInfo.details}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">How to resolve this:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {reason === 'expired-token' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">1.</span>
                    <span>Log in to your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">2.</span>
                    <span>Navigate to your profile settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">3.</span>
                    <span>Click "Upgrade to Enterprise" to request a new approval link</span>
                  </li>
                </>
              )}
              {reason === 'invalid-token' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">1.</span>
                    <span>Check if the organization has already been upgraded</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">2.</span>
                    <span>If not, request a new upgrade from your profile settings</span>
                  </li>
                </>
              )}
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Contact support at law@wansom.ai if you need assistance</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/profile" className="flex-1">
              <Button variant="outline" className="w-full">
                View Profile
              </Button>
            </Link>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Need help?</span> Our support team is available to assist you with the upgrade process.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
