'use client';

import { Check, X, HardDrive } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const FREE_PLAN_VAULT_LIMIT = 3;

interface VaultLimitModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const FREE_ITEMS = [
  '2 workspaces',
  '8 AI responses/mo',
  `${FREE_PLAN_VAULT_LIMIT} vault documents`,
  'Basic drafting',
];

const PRO_ITEMS = [
  'Unlimited vault uploads',
  'AI Associates',
  'Unlimited AI responses',
  'Calendar & Gmail',
  'Advanced analysis',
];

export default function VaultLimitModal({ open, onClose, onUpgrade }: VaultLimitModalProps) {
  const handleUpgrade = () => {
    onClose();
    onUpgrade();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 overflow-visible rounded-2xl w-[calc(100%-2rem)] max-w-[460px]">

        <div className="px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5">

          {/* Header */}
          <div className="flex items-start gap-2.5 mb-4">
            <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-[#0a4b5e]/10 mt-0.5">
              <HardDrive className="h-3.5 w-3.5 text-[#0a4b5e]" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm sm:text-[15px] font-semibold text-gray-900 leading-snug">
                You've reached your {FREE_PLAN_VAULT_LIMIT}-document vault limit
              </DialogTitle>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                Upgrade to upload unlimited documents.
              </p>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-2 gap-2 mb-4 mt-3">

            {/* Free card */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-3 min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Free
              </p>
              <ul className="space-y-1.5">
                {FREE_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 min-w-0">
                    <Check className="h-3 w-3 shrink-0 mt-0.5 text-gray-400" />
                    <span className="text-[11px] text-gray-500 leading-normal">{item}</span>
                  </li>
                ))}
                <li className="flex items-start gap-1.5 min-w-0">
                  <X className="h-3 w-3 shrink-0 mt-0.5 text-gray-300" />
                  <span className="text-[11px] text-gray-400 line-through leading-normal">Unlimited uploads</span>
                </li>
              </ul>
            </div>

            {/* Explorer card */}
            <div className="rounded-xl border border-[#0a4b5e]/20 bg-[#0a4b5e]/5 px-2.5 py-3 relative min-w-0">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#0a4b5e] text-white text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                RECOMMENDED
              </span>
              <p className="text-[10px] font-semibold text-[#0a4b5e] uppercase tracking-wide mb-2 mt-1">
                Explorer · 14 days
              </p>
              <ul className="space-y-1.5">
                {PRO_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 min-w-0">
                    <Check className="h-3 w-3 shrink-0 mt-0.5 text-[#0a4b5e]" />
                    <span className="text-[11px] text-gray-700 leading-normal">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-[#0a4b5e] hover:bg-[#005c4d] text-white text-sm min-h-[42px]"
            >
              Try Explorer — Start Free Trial
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-xs text-gray-400 hover:text-gray-700 min-h-[36px]"
            >
              Continue with Free Plan
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
