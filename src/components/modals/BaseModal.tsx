// src/components/modals/BaseModal.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[550px]',
  lg: 'sm:max-w-[700px]',
  xl: 'sm:max-w-[900px]'
};

/**
 * Base modal component wrapper using shadcn Dialog
 *
 * @example
 * <BaseModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Create Project"
 *   description="Fill in the details below"
 *   size="md"
 *   footer={<Button>Submit</Button>}
 * >
 *   <div>Form content here</div>
 * </BaseModal>
 */
export function BaseModal({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  size = 'md',
  className
}: BaseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {children}
        </div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
