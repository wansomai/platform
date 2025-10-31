'use client';

import { X, Users, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UpgradeBannerProps {
  message?: string;
  onDismiss?: () => void;
  onUpgradeSuccess?: () => void;
  organizationName?: string;
  variant?: 'card' | 'alert';
  upgradeAction?: 'navigate' | 'modal';
  customUpgradeButton?: React.ReactNode;
}

/**
 * Unified UpgradeBanner component supporting both card and alert variants
 *
 * @example Card variant (default)
 * <UpgradeBanner
 *   message="Upgrade to Enterprise"
 *   onDismiss={() => {}}
 * />
 *
 * @example Alert variant with custom action
 * <UpgradeBanner
 *   variant="alert"
 *   organizationName="My Org"
 *   upgradeAction="modal"
 *   onUpgradeSuccess={() => {}}
 * />
 */
export default function UpgradeBanner({
  message = "Upgrade to Enterprise to invite team members and collaborate",
  onDismiss,
  onUpgradeSuccess,
  organizationName,
  variant = 'card',
  upgradeAction = 'navigate',
  customUpgradeButton
}: UpgradeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    if (upgradeAction === 'navigate') {
      router.push('/profile?tab=general#account-settings');
    }
    // Modal action would be handled by customUpgradeButton
  };

  if (!isVisible) return null;

  // Alert variant (compact, inline)
  if (variant === 'alert') {
    return (
      <Alert className="border-primary/50 bg-primary/5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <AlertDescription className="text-sm">
              <strong className="font-semibold">Upgrade to Enterprise</strong> {message}
            </AlertDescription>
          </div>
          <div className="flex items-center gap-2">
            {customUpgradeButton || (
              <Button size="sm" className="gap-2" onClick={handleUpgrade}>
                <Sparkles className="h-3.5 w-3.5" />
                Upgrade
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Alert>
    );
  }

  // Card variant (prominent, detailed)
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
          {customUpgradeButton || (
            <Button
              onClick={handleUpgrade}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          )}
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

// Named export for backwards compatibility
export { UpgradeBanner };
