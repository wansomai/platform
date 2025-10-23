'use client';

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { UpgradePrompt } from "./UpgradePrompt";

interface UpgradeBannerProps {
  organizationName?: string;
  onUpgradeSuccess?: () => void;
  onDismiss?: () => void;
}

export function UpgradeBanner({ organizationName, onUpgradeSuccess, onDismiss }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Alert className="border-primary/50 bg-primary/5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <AlertDescription className="text-sm">
            <strong className="font-semibold">Upgrade to Enterprise</strong> to invite team members and unlock advanced collaboration features.
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2">
          <UpgradePrompt
            organizationName={organizationName}
            onUpgradeSuccess={onUpgradeSuccess}
            trigger={
              <Button size="sm" className="gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Upgrade
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}
