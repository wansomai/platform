'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Users, Shield, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiService } from '@/lib/api';

interface UpgradePromptProps {
  trigger?: React.ReactNode;
  organizationName?: string;
  onUpgradeSuccess?: () => void;
}

export function UpgradePrompt({ trigger, organizationName, onUpgradeSuccess }: UpgradePromptProps) {
  const [open, setOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);

      const response = await apiService.post<{
        data: { authorizationUrl: string; accessCode: string; reference: string };
      }>('/api/payments/initialize', { planType: 'teams' });

      if (response.data?.authorizationUrl) {
        window.location.href = response.data.authorizationUrl;
      } else {
        toast.error('Failed to initialize payment. Please try again.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to start payment';
      toast.error(errorMessage);
      console.error('Error upgrading organization:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger || (
          <Button variant="default" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Upgrade to Teams
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <DialogTitle>Upgrade to Teams</DialogTitle>
            </div>
            <DialogDescription>
              Unlock team collaboration and advanced features for {organizationName || 'your organization'} — $15/seat/month, starts with 1 seat
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current vs Teams Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Badge variant="outline" className="mb-2">Personal</Badge>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-gray-400" />
                    Single user workspace
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-gray-400" />
                    Basic features
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-gray-400" />
                    Limited projects
                  </li>
                </ul>
              </div>

              <div className="space-y-2 border-l-2 border-primary pl-4">
                <Badge variant="default" className="mb-2">Teams</Badge>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span className="font-medium">Invite unlimited members</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span className="font-medium">Role-based access control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span className="font-medium">Workspace-level permissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span className="font-medium">Team collaboration tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span className="font-medium">Advanced features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span className="font-medium">Priority support</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-sm">Team Collaboration</div>
                  <div className="text-xs text-gray-500">Work together seamlessly</div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-sm">Access Control</div>
                  <div className="text-xs text-gray-500">Manage permissions easily</div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-sm">Advanced Features</div>
                  <div className="text-xs text-gray-500">Unlock powerful tools</div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isUpgrading}
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="gap-2"
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Upgrade — $15/seat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
