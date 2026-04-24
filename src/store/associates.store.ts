// src/store/associates.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';
import { AIAssociate, AssociateMutationResult, CreateAssociateInput, UpdateAssociateInput } from '@/types/associates';
import { ApiResponse } from '@/types';

interface AssociatesState {
  associates: AIAssociate[];
  associatesMap: Map<string, AIAssociate>;
  /** True only while a list-fetch is in flight. Does NOT reflect mutation state. */
  isFetching: boolean;
  /** True while a create/update/toggle mutation is in flight. */
  isLoading: boolean;
  error: string | null;

  // Methods
  fetchAssociates: (forceRefresh?: boolean) => Promise<AIAssociate[]>;
  createAssociate: (input: CreateAssociateInput) => Promise<AssociateMutationResult | null>;
  updateAssociate: (id: string, input: UpdateAssociateInput) => Promise<AssociateMutationResult | null>;
  deleteAssociate: (id: string, options?: { force?: boolean }) => Promise<{
    success: boolean;
    requiresForce?: boolean;
    details?: {
      projectCount: number;
      conversationCount: number;
      projects: Array<{ id: string; title: string }>;
    };
    error?: string;
  }>;
  toggleAssociateStatus: (id: string) => Promise<boolean>;
  setAssociates: (associates: AIAssociate[]) => void;
  addAssociate: (associate: AIAssociate) => void;
  removeAssociate: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  refreshAssociates: () => Promise<void>;
  clearAssociates: () => void;

  // Optimized getters
  getAssociateById: (id: string) => AIAssociate | undefined;
}

const createAssociatesMap = (associates: AIAssociate[]): Map<string, AIAssociate> => {
  return new Map(associates.map((a) => [a.id, a]));
};

const dedupeById = (list: AIAssociate[]): AIAssociate[] => {
  const seen = new Set<string>();
  return list.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
};

export const useAssociatesStore = create<AssociatesState>((set, get) => ({
  associates: [],
  associatesMap: new Map(),
  isFetching: false,
  isLoading: false,
  error: null,

  fetchAssociates: async (forceRefresh = false): Promise<AIAssociate[]> => {
    const state = get();

    // Skip if we already have data and aren't forcing a refresh
    if (!forceRefresh && state.associates.length > 0 && !state.isFetching) {
      return state.associates;
    }

    // Prevent concurrent list-fetches (isFetching is ONLY for this, not for mutations)
    if (state.isFetching) {
      return state.associates;
    }

    try {
      set({ isFetching: true, error: null });

      const response = await apiService.get<ApiResponse<{ associates: AIAssociate[] }>>(
        '/api/associates'
      );

      const associates = dedupeById(response.data.associates ?? []);

      set({
        associates,
        associatesMap: createAssociatesMap(associates),
        isFetching: false,
      });

      return associates;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch associates', isFetching: false });
      return [];
    }
  },

  createAssociate: async (input: CreateAssociateInput) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiService.post<ApiResponse<AssociateMutationResult>>(
        '/api/associates',
        input
      );

      const mutationResult = response.data;
      const newAssociate = mutationResult.associate;

      set((state) => {
        // Skip if already present (e.g. double-submit race)
        if (state.associates.some((a) => a.id === newAssociate.id)) {
          return { isLoading: false };
        }
        const updated = [newAssociate, ...state.associates];
        return {
          associates: updated,
          associatesMap: createAssociatesMap(updated),
          isLoading: false,
        };
      });

      return mutationResult;
    } catch (error: any) {
      const msg = error?.response?.data?.error || error.message || 'Failed to create associate';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  updateAssociate: async (id: string, input: UpdateAssociateInput) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiService.put<ApiResponse<AssociateMutationResult>>(
        `/api/associates/${id}`,
        input
      );

      const mutationResult = response.data;
      const updatedAssociate = mutationResult.associate;

      set((state) => {
        const updated = state.associates.map((a) => (a.id === id ? updatedAssociate : a));
        return {
          associates: updated,
          associatesMap: createAssociatesMap(updated),
          isLoading: false,
        };
      });

      return mutationResult;
    } catch (error: any) {
      const msg = error?.response?.data?.error || error.message || 'Failed to update associate';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  deleteAssociate: async (id: string, options?: { force?: boolean }) => {
    try {
      const query = options?.force ? '?force=true' : '';
      await apiService.delete(`/api/associates/${id}${query}`);

      // Remove optimistically after the API confirms the delete
      set((state) => {
        const updated = state.associates.filter((a) => a.id !== id);
        return { associates: updated, associatesMap: createAssociatesMap(updated) };
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete associate';
      set({ error: errorMessage });
      const responseData = error?.response?.data;
      if (responseData?.code === 'ASSOCIATE_IN_USE') {
        return {
          success: false,
          requiresForce: true,
          details: responseData.details,
          error: responseData.error ?? errorMessage,
        };
      }
      return { success: false, error: errorMessage };
    }
  },

  toggleAssociateStatus: async (id: string) => {
    const associate = get().getAssociateById(id);
    if (!associate) return false;
    const updated = await get().updateAssociate(id, { isActive: !associate.isActive });
    return !!updated;
  },

  setAssociates: (associates) =>
    set({ associates, associatesMap: createAssociatesMap(associates) }),

  addAssociate: (associate) =>
    set((state) => {
      if (state.associates.some((a) => a.id === associate.id)) return {};
      const updated = [associate, ...state.associates];
      return { associates: updated, associatesMap: createAssociatesMap(updated) };
    }),

  removeAssociate: (id) =>
    set((state) => {
      const updated = state.associates.filter((a) => a.id !== id);
      return { associates: updated, associatesMap: createAssociatesMap(updated) };
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  getAssociateById: (id) => get().associatesMap.get(id),

  refreshAssociates: async () => {
    await get().fetchAssociates(true);
  },

  clearAssociates: () =>
    set({ associates: [], associatesMap: new Map(), error: null, isFetching: false, isLoading: false }),
}));
