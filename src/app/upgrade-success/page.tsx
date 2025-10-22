'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function UpgradeSuccessPage() {
  const searchParams = useSearchParams();
  const orgName = searchParams.get('org') || 'your organization';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Upgrade Successful!</CardTitle>
              <CardDescription>
                Your organization has been upgraded to Enterprise
              </CardDescription>
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

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">What's next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Invite team members to collaborate on projects</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Assign roles and manage permissions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Access advanced analytics and reporting</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Enjoy priority support and dedicated resources</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/profile" className="flex-1">
              <Button variant="outline" className="w-full">
                View Profile
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 text-center pt-2">
            Need help getting started? Contact support at law@wansom.ai
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
