// src/store/associates.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';
import { AIAssociate, CreateAssociateInput, UpdateAssociateInput } from '@/types/associates';
import { ApiResponse } from '@/types';

interface AssociatesState {
  associates: AIAssociate[];
  associatesMap: Map<string, AIAssociate>;
  isLoading: boolean;
  error: string | null;

  // Methods
  fetchAssociates: () => Promise<AIAssociate[]>;
  createAssociate: (input: CreateAssociateInput) => Promise<AIAssociate | null>;
  updateAssociate: (id: string, input: UpdateAssociateInput) => Promise<AIAssociate | null>;
  deleteAssociate: (id: string) => Promise<boolean>;
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

  fetchAssociates: async (): Promise<AIAssociate[]> => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiService.get<ApiResponse<{ associates: AIAssociate[] }>>(
        '/api/associates'
      );
      console.log(response,"associate response")

      const associates = response.data.associates ?? [];
      console.log(associates,"found these associates")

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

          const response = await apiService.post<ApiResponse<{ associate: AIAssociate }>>(
            '/api/associates',
            input
          );

          const newAssociate = response.data.associate;

          // Add the new associate to the store
          set((state) => {
            const newAssociates = [newAssociate, ...state.associates];
            return {
              associates: newAssociates,
              associatesMap: createAssociatesMap(newAssociates),
              isLoading: false
            };
          });

          return newAssociate;
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to create associate';
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      updateAssociate: async (id: string, input: UpdateAssociateInput) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiService.put<ApiResponse<{ associate: AIAssociate }>>(
            `/api/associates/${id}`,
            input
          );

          const updatedAssociate = response.data.associate;

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

          return updatedAssociate;
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to update associate';
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      deleteAssociate: async (id: string) => {
        try {
          await apiService.delete(`/api/associates/${id}`);

          // Remove associate from store
          set((state) => {
            const newAssociates = state.associates.filter(a => a.id !== id);
            return {
              associates: newAssociates,
              associatesMap: createAssociatesMap(newAssociates)
            };
          });

          return true;
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to delete associate';
          set({ error: errorMessage });
          return false;
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
        await get().fetchAssociates();
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
