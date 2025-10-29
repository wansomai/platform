'use client';

import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useAsyncOperation, useFormState } from '@/hooks/useAsyncOperation';
import api from '@/lib/api';

interface EditProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: {
    id: string;
    title: string;
    description: string;
  };
}

export function EditProjectModal({ open, onClose, onSuccess, project }: EditProjectModalProps) {
  const { isLoading, error, execute, setError } = useAsyncOperation();
  const { data: formData, updateField, setData } = useFormState({
    title: '',
    description: '',
  });

  // Sync form data when project changes
  useEffect(() => {
    if (project) {
      setData({
        title: project.title,
        description: project.description,
      });
    }
  }, [project, setData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const result = await execute(async () => {
      return api.put(`/projects/${project.id}`, formData);
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
      title="Edit Project"
      description="Update your project details"
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
            type="submit"
            form="edit-project-form"
            disabled={isLoading || !formData.title.trim()}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="edit-project-form" onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert error={error} onDismiss={() => setError(null)} />

        <div className="space-y-2">
          <Label htmlFor="title">
            Project Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Enter project title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Enter project description (optional)"
          />
        </div>
      </form>
    </BaseModal>
  );
}

export default EditProjectModal;
