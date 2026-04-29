'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';

interface EnterpriseDowngradeModalProps {
  open: boolean;
  onClose: () => void;
  organizationName?: string;
}

export default function EnterpriseDowngradeModal({
  open,
  onClose,
  organizationName,
}: EnterpriseDowngradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 overflow-visible rounded-2xl w-[calc(100%-2rem)] max-w-[440px]">
        <div className="px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5">

          {/* Header */}
          <div className="flex items-start gap-2.5 mb-5">
            <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-[#0a4b5e]/10 mt-0.5">
              <Crown className="h-3.5 w-3.5 text-[#0a4b5e]" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm sm:text-[15px] font-semibold text-gray-900 leading-snug">
                Workspace plan has lapsed
              </DialogTitle>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                {organizationName
                  ? `${organizationName}'s subscription is no longer active.`
                  : "Your organization's subscription is no longer active."}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 mb-5">
            <p className="text-[12.5px] text-amber-800 leading-relaxed">
              As a team member, you aren&apos;t able to manage billing for this workspace. Please
              contact the{' '}
              <span className="font-semibold">
                {organizationName ? `${organizationName} owner` : 'organization owner'}
              </span>{' '}
              and ask them to renew the subscription to restore full access.
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={onClose}
            className="w-full bg-[#0a4b5e] hover:bg-[#005c4d] text-white text-sm min-h-[42px]"
          >
            Got it
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}
