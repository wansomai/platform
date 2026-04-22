'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import LogoAnimation from '@/components/commons/LogoAnimation';

interface AssociateSetupProgressModalProps {
  open: boolean;
  associateName?: string;
  messages: string[];
  isComplete?: boolean;
}

const TYPING_SPEED_MS = 18;

export function AssociateSetupProgressModal({
  open,
  associateName,
  messages,
  isComplete = false,
}: AssociateSetupProgressModalProps) {
  const latestMessage = useMemo(
    () => messages[messages.length - 1] ?? 'Initializing associate setup...',
    [messages]
  );
  const previousMessages = useMemo(
    () => messages.slice(0, -1).slice(-4),
    [messages]
  );
  const [typedCurrentLine, setTypedCurrentLine] = useState('');

  useEffect(() => {
    if (!open) {
      setTypedCurrentLine('');
      return;
    }

    let idx = 0;
    setTypedCurrentLine('');
    const timer = window.setInterval(() => {
      idx += 1;
      setTypedCurrentLine(latestMessage.slice(0, idx));
      if (idx >= latestMessage.length) {
        window.clearInterval(timer);
      }
    }, TYPING_SPEED_MS);

    return () => window.clearInterval(timer);
  }, [latestMessage, open]);

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-lg [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Associate setup progress</DialogTitle>
        <div className="flex flex-col items-center text-center py-3">
          <LogoAnimation size="lg" className="mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">
            {isComplete
              ? `${associateName ?? 'Associate'} is ready`
              : `Preparing ${associateName ?? 'your associate'}`}
          </h3>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {isComplete
              ? 'Knowledge base and rules are fully synchronized.'
              : 'Please keep this window open while we process the knowledge base.'}
          </DialogDescription>
        </div>

        <div className="rounded-lg border bg-[#F7FBFA] p-3 space-y-2">
          {previousMessages.map((message, index) => (
            <div key={`done-${index}-${message}`} className="flex items-start gap-2 text-left">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
              <p className="text-xs text-gray-700">{message}</p>
            </div>
          ))}

          <div className="flex items-start gap-2 text-left">
            <span className="mt-[7px] h-2 w-2 rounded-full bg-[#74C6B8] animate-pulse shrink-0" />
            <p className="text-xs text-gray-800 min-h-4">
              {typedCurrentLine}
              {!isComplete && <span className="animate-pulse">|</span>}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
