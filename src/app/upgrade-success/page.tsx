'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
function UpgradeSuccessContent() {
  const searchParams = useSearchParams();
  const orgName = searchParams.get('org') || 'your organization';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Upgrade Successful!</CardTitle>
             
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-1">
              {orgName} is now an Enterprise account
            </p>
            <p className="text-sm text-green-700">
              All enterprise features have been activated and are ready to use.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center animate-pulse">
                <CheckCircle2 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <UpgradeSuccessContent />
    </Suspense>
  );
}
