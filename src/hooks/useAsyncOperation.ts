// src/hooks/useAsyncOperation.ts
import { useState, useCallback } from 'react';

/**
 * Custom hook for managing async operations with loading and error states
 *
 * @example
 * const { isLoading, error, execute, reset } = useAsyncOperation();
 *
 * const handleSubmit = async () => {
 *   const result = await execute(() => apiCall());
 *   if (result) {
 *     // Handle success
 *   }
 * };
 */
export function useAsyncOperation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fn();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Async operation failed:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    execute,
    reset,
    setError
  };
}

/**
 * Custom hook for managing form state
 *
 * @example
 * const { data, updateField, reset } = useFormState({ name: '', email: '' });
 *
 * <input
 *   value={data.name}
 *   onChange={(e) => updateField('name', e.target.value)}
 * />
 */
export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [data, setData] = useState<T>(initialState);

  const updateField = useCallback((key: keyof T, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setData(initialState);
  }, [initialState]);

  const setMultiple = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    data,
    updateField,
    reset,
    setData,
    setMultiple
  };
}
