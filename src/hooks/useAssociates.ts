// src/hooks/useAssociates.ts
import { useState } from 'react';
import { useAssociatesStore } from '@/store/associates.store';
import { useUIStore } from '@/store/ui.store';
import { CreateAssociateInput, UpdateAssociateInput, AIAssociate } from '@/types/associates';

export interface UseAssociatesOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function useAssociates(options: UseAssociatesOptions = {}) {
  const { onSuccess, onError } = options;

  const {
    associates,
    isLoading,
    isFetching,
    error,
    fetchAssociates: storeFetchAssociates,
    createAssociate: storeCreateAssociate,
    updateAssociate: storeUpdateAssociate,
    deleteAssociate: storeDeleteAssociate,
    toggleAssociateStatus: storeToggleAssociateStatus,
    getAssociateById,
    refreshAssociates,
  } = useAssociatesStore();

  const { addToast } = useUIStore();

  const [isProcessing, setIsProcessing] = useState(false);

  // Helper functions
  const handleSuccess = (message: string) => {
    addToast({ message, type: 'success' });
    onSuccess?.(message);
  };

  const handleError = (error: string) => {
    addToast({ message: error, type: 'error' });
    onError?.(error);
  };

  // Fetch associates
  const fetchAssociates = async () => {
    try {
      await storeFetchAssociates();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch associates';
      handleError(errorMessage);
    }
  };

  // Create associate
  const createAssociate = async (input: CreateAssociateInput) => {
    try {
      setIsProcessing(true);
      const result = await storeCreateAssociate(input);

      if (result?.associate) {
        handleSuccess(`${input.name} created successfully`);
        return result;
      } else {
        handleError('Failed to create associate');
        throw new Error('Failed to create associate');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create associate';
      handleError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Update associate
  const updateAssociate = async (id: string, input: UpdateAssociateInput) => {
    try {
      setIsProcessing(true);
      const result = await storeUpdateAssociate(id, input);

      if (result?.associate) {
        handleSuccess('Associate updated successfully');
        return result;
      } else {
        handleError('Failed to update associate');
        throw new Error('Failed to update associate');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update associate';
      handleError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete associate
  const deleteAssociate = async (id: string, options?: { force?: boolean }) => {
    const associate = getAssociateById(id);
    const name = associate?.name || 'Associate';

    try {
      setIsProcessing(true);
      const result = await storeDeleteAssociate(id, options);

      if (result.success) {
        handleSuccess(`${name} deleted successfully`);
        return result;
      }
      if (!result.requiresForce) {
        handleError(result.error || 'Failed to delete associate');
      }
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete associate';
      handleError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle associate active status
  const toggleAssociateStatus = async (id: string) => {
    const associate = getAssociateById(id);
    if (!associate) {
      handleError('Associate not found');
      return false;
    }

    const newStatus = !associate.isActive;
    const statusText = newStatus ? 'activated' : 'deactivated';

    try {
      setIsProcessing(true);
      const success = await storeToggleAssociateStatus(id);

      if (success) {
        handleSuccess(`${associate.name} ${statusText} successfully`);
        return true;
      } else {
        handleError(`Failed to ${statusText.slice(0, -1)} associate`);
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${statusText.slice(0, -1)} associate`;
      handleError(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter associates by practice area
  const filterByPracticeArea = (practiceArea: string) => {
    return associates.filter(a => a.practiceAreas.includes(practiceArea as any));
  };

  // Filter active associates
  const getActiveAssociates = () => {
    return associates.filter(a => a.isActive);
  };

  // Search associates
  const searchAssociates = (searchTerm: string) => {
    const term = searchTerm.toLowerCase();
    return associates.filter(a =>
      a.name.toLowerCase().includes(term) ||
      a.description?.toLowerCase().includes(term) ||
      a.instructions.toLowerCase().includes(term)
    );
  };

  return {
    // Store state
    associates,
    isLoading,
    isFetching,
    error,

    // Core CRUD operations
    fetchAssociates,
    createAssociate,
    updateAssociate,
    deleteAssociate,

    // Additional operations
    toggleAssociateStatus,
    refreshAssociates,
    getAssociateById,

    // Utility functions
    filterByPracticeArea,
    getActiveAssociates,
    searchAssociates,

    // Processing state
    isProcessing
  };
}
