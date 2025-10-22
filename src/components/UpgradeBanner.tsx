'use client';

import { X, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UpgradeBannerProps {
  message?: string;
  onDismiss?: () => void;
}

export default function UpgradeBanner({
  message = "Upgrade to Enterprise to invite team members and collaborate",
  onDismiss
}: UpgradeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    router.push('/profile?tab=general#account-settings');
  };

  if (!isVisible) return null;

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900">{message}</h4>
            <p className="text-sm text-blue-700">Get unlimited projects, team collaboration, and more</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleUpgrade}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
          {onDismiss && (
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
