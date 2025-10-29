'use client';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import api from '@/lib/api';
import { AlertTriangle } from 'lucide-react';

interface DeleteProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  projectTitle: string;
}

export function DeleteProjectModal({
  open,
  onClose,
  onSuccess,
  projectId,
  projectTitle,
}: DeleteProjectModalProps) {
  const { isLoading, error, execute, setError } = useAsyncOperation();

  const handleDelete = async () => {
    setError(null);

    const result = await execute(async () => {
      return api.delete(`/projects/${projectId}`);
    });

    if (result) {
      onSuccess();
      onClose();
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onClose}
      title="Delete Project"
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Project'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the project{' '}
              <span className="font-semibold text-foreground">"{projectTitle}"</span>? This action
              cannot be undone and all project data will be permanently deleted.
            </p>
          </div>
        </div>

        <ErrorAlert error={error} onDismiss={() => setError(null)} />
      </div>
    </BaseModal>
  );
}

export default DeleteProjectModal;
