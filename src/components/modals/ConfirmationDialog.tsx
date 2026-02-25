// components/modals/ConfirmationDialog.tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Info, AlertCircle, CheckCircle, Trash2, X } from "lucide-react";
import { useState } from "react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  type?: 'delete' | 'remove' | 'archive' | 'confirm' | 'custom';
  size?: 'sm' | 'md' | 'lg';
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  confirmText,
  cancelText = "Cancel",
  variant = 'default',
  type = 'confirm',
  size = 'md'
}: ConfirmationDialogProps) {
  
  // Get variant configuration
  const getVariantConfig = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          iconBgColor: 'bg-red-50',
          buttonVariant: 'destructive' as const,
          defaultConfirmText: 'Delete'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
          iconBgColor: 'bg-orange-50',
          buttonVariant: 'destructive' as const,
          defaultConfirmText: 'Continue'
        };
      case 'info':
        return {
          icon: <Info className="h-5 w-5 text-green-500" />,
          iconBgColor: 'bg-green-50',
          buttonVariant: 'default' as const,
          defaultConfirmText: 'Confirm'
        };
      default:
        return {
          icon: <CheckCircle className="h-5 w-5 text-gray-500" />,
          iconBgColor: 'bg-gray-50',
          buttonVariant: 'default' as const,
          defaultConfirmText: 'Confirm'
        };
    }
  };

  // Get type-specific content
  const getTypeContent = () => {
    switch (type) {
      case 'delete':
        return {
          defaultTitle: `Delete ${itemName || 'Item'}`,
          defaultDescription: `Are you sure you want to delete ${itemName ? `"${itemName}"` : 'this item'}? This action cannot be undone.`,
          defaultConfirmText: 'Delete',
          icon: <Trash2 className="h-5 w-5" />
        };
      case 'remove':
        return {
          defaultTitle: `Remove ${itemName || 'Item'}`,
          defaultDescription: `Are you sure you want to remove ${itemName ? `"${itemName}"` : 'this item'}? You can add it back later.`,
          defaultConfirmText: 'Remove',
          icon: <X className="h-5 w-5" />
        };
      case 'archive':
        return {
          defaultTitle: `Archive ${itemName || 'Item'}`,
          defaultDescription: `Are you sure you want to archive ${itemName ? `"${itemName}"` : 'this item'}? It will be hidden from the main view.`,
          defaultConfirmText: 'Archive',
          icon: <AlertCircle className="h-5 w-5" />
        };
      default:
        return {
          defaultTitle: 'Confirm Action',
          defaultDescription: 'Are you sure you want to proceed with this action?',
          defaultConfirmText: 'Confirm',
          icon: <CheckCircle className="h-5 w-5" />
        };
    }
  };

  const variantConfig = getVariantConfig();
  const typeContent = getTypeContent();
  
  const finalTitle = title || typeContent.defaultTitle;
  const finalDescription = description || typeContent.defaultDescription;
  const finalConfirmText = confirmText || typeContent.defaultConfirmText;
  const finalIcon = variant === 'default' ? typeContent.icon : variantConfig.icon;

  // Size configurations
  const sizeConfig = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg', 
    lg: 'sm:max-w-xl'
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Confirmation action failed
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${sizeConfig[size]}`}>
        <DialogHeader>
          <div className="flex items-start space-x-4">
            <div className={`rounded-full p-2 ${variantConfig.iconBgColor}`}>
              {finalIcon}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-left">{finalTitle}</DialogTitle>
              <DialogDescription className="text-left mt-2">
                {finalDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variantConfig.buttonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              finalConfirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Specialized confirmation dialogs for common use cases
interface DeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  itemName?: string;
  itemType?: string;
  isLoading?: boolean;
  permanentDelete?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  itemType = 'item',
  isLoading = false,
  permanentDelete = true
}: DeleteConfirmationProps) {
  const truncatedName = itemName && itemName.length > 40
    ? itemName.slice(0, 40) + '...'
    : itemName;

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={`Delete ${itemType}`}
      description={
        permanentDelete
          ? `Are you sure you want to delete ${truncatedName ? `"${truncatedName}"` : `this ${itemType}`}? This action cannot be undone and all associated data will be permanently lost.`
          : `Are you sure you want to delete ${truncatedName ? `"${truncatedName}"` : `this ${itemType}`}? You can restore it from the trash later.`
      }
      itemName={truncatedName}
      isLoading={isLoading}
      variant="destructive"
      type="delete"
    />
  );
}

interface RemoveConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  itemName?: string;
  contextName?: string;
  isLoading?: boolean;
}

export function RemoveConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  contextName = 'this context',
  isLoading = false
}: RemoveConfirmationProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={`Remove ${itemName ? 'Document' : 'Item'}`}
      description={`Are you sure you want to remove ${itemName ? `"${itemName}"` : 'this item'} from ${contextName}? The item will still be available in your vault.`}
      itemName={itemName}
      isLoading={isLoading}
      variant="warning"
      type="remove"
      confirmText="Remove"
    />
  );
}

// Hook for managing confirmation dialog state
export const useConfirmationDialog = () => {
  const [dialogState, setDialogState] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default' as const,
    type: 'confirm' as const,
    isLoading: false
  });

  const openDialog = (config: Partial<typeof dialogState>) => {
    setDialogState({
      ...dialogState,
      ...config,
      open: true
    });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, open: false }));
  };

  const setLoading = (loading: boolean) => {
    setDialogState(prev => ({ ...prev, isLoading: loading }));
  };

  return {
    dialogState,
    openDialog,
    closeDialog,
    setLoading
  };
};