// components/modals/DeleteConfirmationDialog.tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
  destructiveText?: string;
  cancelText?: string;
  variant?: 'default' | 'document' | 'conversation' | 'project';
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  destructiveText = "Delete",
  cancelText = "Cancel",
  variant = 'default'
}: DeleteConfirmationDialogProps) {
  
  // Get variant-specific content
  const getVariantContent = () => {
    switch (variant) {
      case 'document':
        return {
          defaultTitle: "Remove Document",
          defaultDescription: "Are you sure you want to remove this document from the conversation context? The document will still be available in your vault.",
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          confirmText: "Remove"
        };
      case 'conversation':
        return {
          defaultTitle: "Delete Conversation",
          defaultDescription: "Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently lost.",
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          confirmText: "Delete"
        };
      case 'project':
        return {
          defaultTitle: "Delete Project",
          defaultDescription: "Are you sure you want to delete this project? This action cannot be undone and all associated data will be permanently lost.",
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          confirmText: "Delete"
        };
      default:
        return {
          defaultTitle: "Confirm Action",
          defaultDescription: "Are you sure you want to proceed with this action?",
          icon: <AlertTriangle className="h-5 w-5 text-gray-500" />,
          confirmText: "Confirm"
        };
    }
  };

  const variantContent = getVariantContent();
  const finalTitle = title || variantContent.defaultTitle;
  const finalDescription = description || variantContent.defaultDescription;
  const finalConfirmText = destructiveText === "Delete" ? variantContent.confirmText : destructiveText;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error in confirmation action:', error);
      // Don't close dialog on error - let parent component handle error state
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            {variantContent.icon}
            <DialogTitle>{finalTitle}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {itemName ? (
              <span>
                {finalDescription.replace('this', `"${itemName}"`)}
              </span>
            ) : (
              finalDescription
            )}
          </DialogDescription>
        </DialogHeader>
        
        {/* Additional warning for destructive actions */}
        {(variant === 'conversation' || variant === 'project') && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  This action is permanent
                </p>
                <p className="text-xs text-red-600">
                  {variant === 'conversation' 
                    ? 'All messages and conversation history will be lost.'
                    : 'All project data, conversations, and documents will be lost.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'document' ? 'outline' : 'destructive'}
            onClick={handleConfirm}
            disabled={isLoading}
            className={variant === 'document' ? 'text-orange-600 border-orange-300 hover:bg-orange-50' : ''}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {variant === 'document' ? 'Removing...' : 'Deleting...'}
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