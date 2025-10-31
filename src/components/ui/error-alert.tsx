// src/components/ui/error-alert.tsx
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  error?: string | null;
  className?: string;
  onDismiss?: () => void;
  variant?: 'default' | 'destructive';
}

/**
 * Reusable error alert component
 *
 * @example
 * <ErrorAlert error={error} onDismiss={() => setError(null)} />
 */
export function ErrorAlert({
  error,
  className,
  onDismiss,
  variant = 'destructive'
}: ErrorAlertProps) {
  if (!error) return null;

  const variantStyles = {
    default: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    destructive: 'bg-red-50 border-red-200 text-red-600'
  };

  return (
    <div
      className={cn(
        'p-3 border rounded-md text-sm',
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <p className="flex-1">{error}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
