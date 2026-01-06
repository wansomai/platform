// src/hooks/useProjectAssociates.ts
import { useState, useCallback } from 'react';
import { apiService } from '@/lib/api';
import { AIAssociate } from '@/types/associates';
import { ApiResponse } from '@/types';

interface UseProjectAssociatesOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function useProjectAssociates(options: UseProjectAssociatesOptions = {}) {
  const { onSuccess, onError } = options;

  const [projectAssociates, setProjectAssociates] = useState<AIAssociate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch associates assigned to a project
  const fetchProjectAssociates = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.get<ApiResponse<{ associates: AIAssociate[] }>>(
        `/api/projects/${projectId}/associates`
      );

      const associates = response.data.associates ?? [];
      setProjectAssociates(associates);
      return associates;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch project associates';
      setError(errorMessage);
      onError?.(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Assign an associate to a project
  const assignAssociate = useCallback(async (projectId: string, associateId: string) => {
    try {
      setError(null);

      await apiService.post(
        `/api/projects/${projectId}/associates`,
        { associateId }
      );

      // Update local state
      setProjectAssociates(prev => {
        // Fetch the full associate data would be better, but for now just add the ID
        // The parent should refetch to get the full data
        return prev;
      });

      onSuccess?.('Associate assigned successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to assign associate';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    }
  }, [onSuccess, onError]);

  // Remove an associate from a project
  const removeAssociate = useCallback(async (projectId: string, associateId: string) => {
    try {
      setError(null);

      await apiService.delete(
        `/api/projects/${projectId}/associates/${associateId}`
      );

      // Update local state
      setProjectAssociates(prev => prev.filter(a => a.id !== associateId));

      onSuccess?.('Associate removed successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to remove associate';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    }
  }, [onSuccess, onError]);

  return {
    projectAssociates,
    isLoading,
    error,
    fetchProjectAssociates,
    assignAssociate,
    removeAssociate
  };
}
