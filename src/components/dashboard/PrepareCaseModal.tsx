'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Check, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiService } from '@/lib/api';

const CAPABILITIES = [
  'Research relevant case law, statutes, and legal precedents',
  'Analyse fact patterns and identify applicable legal principles',
  'Draft case summaries, legal memoranda, and research reports',
  'Identify strengths and weaknesses in legal arguments',
  'Suggest litigation strategies based on precedent and legal analysis',
];

interface PrepareCaseModalProps {
  open: boolean;
  onClose: () => void;
  /** Called when the API returns 403 — parent should open the upgrade modal */
  onUpgradeRequired: () => void;
}

export default function PrepareCaseModal({
  open,
  onClose,
  onUpgradeRequired,
}: PrepareCaseModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Synchronous guard — prevents double-submission before React re-renders
  const pendingRef = useRef(false);

  // Reset state whenever the modal opens so a re-opened modal is always clean
  useEffect(() => {
    if (open) {
      pendingRef.current = false;
      setIsLoading(false);
      setError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.post<{ data: { projectId: string } }>(
        '/api/associates/start-premade-session',
        { premadeId: 'litigation-assistant' }
      );
      onClose();
      router.push(`/projects/${res.data.projectId}`);
    } catch (err: any) {
      const code = err?.response?.status ?? err?.status;
      if (code === 403) {
        onClose();
        onUpgradeRequired();
      } else {
        setError(
          err?.response?.data?.message ??
            err?.message ??
            'Failed to create session. Please try again.'
        );
        setIsLoading(false);
        pendingRef.current = false;
      }
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {/*
        flex-col + max-h-[90vh]: caps height on any screen so the modal never
        overflows the viewport. The body scrolls; the footer stays pinned.
        w-[calc(100%-1.5rem)] gives a small side margin on very narrow phones;
        sm: widens to the standard 1rem each side.
      */}
      <DialogContent className="p-0 gap-0 flex flex-col overflow-hidden rounded-2xl w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[420px] max-h-[90vh]">

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-5 sm:px-7 sm:pt-7 sm:pb-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full flex items-center justify-center bg-purple-50">
              <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-[17px] font-semibold text-gray-900">
                Litigation Research Assistant
              </DialogTitle>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                AI Associate · Legal Research & Strategy
              </p>
            </div>
          </div>

          {/* Description */}
          <DialogDescription className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-4 sm:mb-5">
            This AI Associate will be created for your workspace and assigned to this
            session. It specialises in case law analysis, legal research, and litigation
            strategy — ask it anything about your case.
          </DialogDescription>

          {/* Capabilities */}
          <ul className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-6">
            {CAPABILITIES.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm text-gray-700"
              >
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5 text-purple-600" />
                {item}
              </li>
            ))}
          </ul>

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-2 mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Primary CTA */}
          <Button
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full bg-[#0a4b5e] hover:bg-[#005c4d] text-white text-sm min-h-[44px]"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating session…</>
            ) : (
              <><ArrowRight className="mr-2 h-4 w-4" /> Create & Start Session</>
            )}
          </Button>
        </div>

        {/* Footer — always visible, never scrolls away */}
        <div className="shrink-0 px-4 sm:px-7 py-3 sm:py-3.5 bg-gray-50 border-t border-gray-100">
          <p className="text-[11px] sm:text-xs text-gray-400 text-center">
            The associate will also appear in your{' '}
            <button
              type="button"
              onClick={() => { handleClose(); router.push('/workflows'); }}
              className="text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              AI Associates
            </button>
            {' '}after creation.{' '}
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              Cancel
            </button>
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
}
