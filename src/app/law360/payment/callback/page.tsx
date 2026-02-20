'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

type PaymentStatus = 'verifying' | 'success' | 'failed' | 'error';

function Law360PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  const reference = searchParams.get('reference') || searchParams.get('trxref');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setStatus('error');
        setMessage('No payment reference found. Please contact support.');
        return;
      }

      try {
        const response = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
        const data = await response.json();

        if (response.ok && data.data?.status === 'success') {
          setStatus('success');
          setMessage(data.data.alreadyProcessed
            ? 'Payment was already processed successfully!'
            : 'Briefly by Wansom Activated! Your legal intelligence digest is now active.');
        } else if (response.ok && data.data?.status) {
          setStatus('failed');
          setMessage(data.data?.message || 'Payment was not successful. Please try again.');
        } else {
          setStatus('error');
          setMessage(data.message || data.error || 'Failed to verify payment. Please contact support.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage('Failed to verify payment. Please contact support.');
      }
    };

    verifyPayment();
  }, [reference]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'verifying' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="h-16 w-16 text-amber-500 animate-spin" />
              </div>
              <CardTitle>Verifying Payment</CardTitle>
              <CardDescription>Please wait while we confirm your payment...</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-green-700">Briefly by Wansom Activated!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-red-700">Payment Failed</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4">
                <AlertCircle className="h-16 w-16 text-amber-500" />
              </div>
              <CardTitle className="text-amber-700">Verification Error</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {status === 'success' && (
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                Go to Dashboard
              </Button>
            )}

            {(status === 'failed' || status === 'error') && (
              <>
                <Button
                  onClick={() => window.location.href = '/law-360'}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.href = 'mailto:law@wansom.ai'}
                  variant="outline"
                  className="w-full"
                >
                  Contact Support
                </Button>
              </>
            )}

            {status === 'verifying' && (
              <p className="text-center text-sm text-gray-500">
                This may take a few moments...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Law360PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="h-16 w-16 text-amber-500 animate-spin" />
            </div>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <Law360PaymentCallbackContent />
    </Suspense>
  );
}
