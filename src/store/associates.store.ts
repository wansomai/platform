// src/store/associates.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';
import { AIAssociate, AssociateMutationResult, CreateAssociateInput, UpdateAssociateInput } from '@/types/associates';
import { ApiResponse } from '@/types';

interface AssociatesState {
  associates: AIAssociate[];
  associatesMap: Map<string, AIAssociate>;
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

// Helper function for optimized data structure
const createAssociatesMap = (associates: AIAssociate[]): Map<string, AIAssociate> => {
  return new Map(associates.map(associate => [associate.id, associate]));
};

export const useAssociatesStore = create<AssociatesState>((set, get) => ({
  associates: [],
  associatesMap: new Map(),
  isLoading: false,
  error: null,

  fetchAssociates: async (forceRefresh = false): Promise<AIAssociate[]> => {
    // Skip fetch if already loaded and not forcing refresh
    const currentState = get();
    if (!forceRefresh && currentState.associates.length > 0 && !currentState.isLoading) {
      return currentState.associates;
    }

    // Prevent concurrent fetches
    if (currentState.isLoading) {
      return currentState.associates;
    }

    try {
      set({ isLoading: true, error: null });

      const response = await apiService.get<ApiResponse<{ associates: AIAssociate[] }>>(
        '/api/associates'
      );

      const raw = response.data.associates ?? [];
      // Deduplicate by id in case of API/Prisma OR-join quirks
      const seen = new Set<string>();
      const associates = raw.filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
      set({
        associates,
        associatesMap: createAssociatesMap(associates),
        isLoading: false
      });

      return associates;

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch associates';
      set({ error: errorMessage, isLoading: false });
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

          // Add the new associate to the store — skip if already present (race guard)
          set((state) => {
            if (state.associates.some((a) => a.id === newAssociate.id)) {
              return { associates: state.associates, associatesMap: state.associatesMap, isLoading: false };
            }
            const newAssociates = [newAssociate, ...state.associates];
            return {
              associates: newAssociates,
              associatesMap: createAssociatesMap(newAssociates),
              isLoading: false
            };
          });

          return mutationResult;
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to create associate';
          set({ error: errorMessage, isLoading: false });
          return null;
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

          // Update the associate in the store
          set((state) => {
            const newAssociates = state.associates.map(a =>
              a.id === id ? updatedAssociate : a
            );
            return {
              associates: newAssociates,
              associatesMap: createAssociatesMap(newAssociates),
              isLoading: false
            };
          });

          return mutationResult;
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to update associate';
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      deleteAssociate: async (id: string, options?: { force?: boolean }) => {
        try {
          const query = options?.force ? '?force=true' : '';
          await apiService.delete(`/api/associates/${id}${query}`);

          // Remove associate from store
          set((state) => {
            const newAssociates = state.associates.filter(a => a.id !== id);
            return {
              associates: newAssociates,
              associatesMap: createAssociatesMap(newAssociates)
            };
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
              error: responseData.error ?? errorMessage
            };
          }
          return { success: false, error: errorMessage };
        }
      },

      toggleAssociateStatus: async (id: string) => {
        const associate = get().getAssociateById(id);
        if (!associate) return false;

        const updated = await get().updateAssociate(id, {
          isActive: !associate.isActive
        });

        return !!updated;
      },

      setAssociates: (associates) => set({
        associates,
        associatesMap: createAssociatesMap(associates)
      }),

      addAssociate: (associate) => set((state) => {
        const newAssociates = [associate, ...state.associates];
        return {
          associates: newAssociates,
          associatesMap: createAssociatesMap(newAssociates)
        };
      }),

      removeAssociate: (id) => set((state) => {
        const newAssociates = state.associates.filter(a => a.id !== id);
        return {
          associates: newAssociates,
          associatesMap: createAssociatesMap(newAssociates)
        };
      }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Optimized getter using Map for O(1) lookup
      getAssociateById: (id) => {
        return get().associatesMap.get(id);
      },

      // Force refresh associates
      refreshAssociates: async () => {
        await get().fetchAssociates(true);
      },

      // Clear all associates (useful for logout)
      clearAssociates: () => {
        set({
          associates: [],
          associatesMap: new Map(),
          error: null
        });
      }
    }
));
