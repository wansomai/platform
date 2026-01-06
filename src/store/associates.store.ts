// src/store/associates.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiService } from '@/lib/api';
import { AIAssociate, CreateAssociateInput, UpdateAssociateInput } from '@/types/associates';
import { ApiResponse } from '@/types';

interface AssociatesState {
  associates: AIAssociate[];
  associatesMap: Map<string, AIAssociate>;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Methods
  fetchAssociates: (forceRefresh?: boolean) => Promise<AIAssociate[]>;
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
  invalidateCache: () => void;

  // Optimized getters
  getAssociateById: (id: string) => AIAssociate | undefined;
}

// Helper function for optimized data structure
const createAssociatesMap = (associates: AIAssociate[]): Map<string, AIAssociate> => {
  return new Map(associates.map(associate => [associate.id, associate]));
};

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useAssociatesStore = create<AssociatesState>()(
  persist(
    (set, get) => ({
      associates: [],
      associatesMap: new Map(),
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchAssociates: async (forceRefresh = false): Promise<AIAssociate[]> => {
        const state = get();

        // Cache check
        const now = Date.now();
        const hasRecentData = state.lastFetched && (now - state.lastFetched) < CACHE_DURATION;

        if (hasRecentData && !forceRefresh && state.associates.length > 0) {
          return state.associates;
        }

        try {
          set({ isLoading: true, error: null });

          const response = await apiService.get<ApiResponse<{ associates: AIAssociate[] }>>(
            '/api/associates'
          );

          const associates = response.data.associates ?? [];
          console.log(associates,"found these associates")

          set({
            associates,
            associatesMap: createAssociatesMap(associates),
            isLoading: false,
            lastFetched: now
          });

          return associates;

        } catch (error: any) {
          const errorMessage = error.message || 'Failed to fetch associates';
          set({ error: errorMessage, isLoading: false });
          return state.associates;
        }
      },

      createAssociate: async (input: CreateAssociateInput) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiService.post<ApiResponse<AIAssociate>>(
            '/api/associates',
            input
          );

          const newAssociate = response.data;

          // Add the new associate to the store
          set((state) => {
            const newAssociates = [newAssociate, ...state.associates];
            return {
              associates: newAssociates,
              associatesMap: createAssociatesMap(newAssociates),
              isLoading: false,
              lastFetched: Date.now()
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

          const response = await apiService.put<ApiResponse<AIAssociate>>(
            `/api/associates/${id}`,
            input
          );

          const updatedAssociate = response.data;

          // Update the associate in the store
          set((state) => {
            const newAssociates = state.associates.map(a =>
              a.id === id ? updatedAssociate : a
            );
            return {
              associates: newAssociates,
              associatesMap: createAssociatesMap(newAssociates),
              isLoading: false,
              lastFetched: Date.now()
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
              associatesMap: createAssociatesMap(newAssociates),
              lastFetched: Date.now()
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
        associatesMap: createAssociatesMap(associates),
        lastFetched: Date.now()
      }),

      addAssociate: (associate) => set((state) => {
        const newAssociates = [associate, ...state.associates];
        return {
          associates: newAssociates,
          associatesMap: createAssociatesMap(newAssociates),
          lastFetched: Date.now()
        };
      }),

      removeAssociate: (id) => set((state) => {
        const newAssociates = state.associates.filter(a => a.id !== id);
        return {
          associates: newAssociates,
          associatesMap: createAssociatesMap(newAssociates),
          lastFetched: Date.now()
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

      // Clear cache to force next fetch
      invalidateCache: () => {
        set({ lastFetched: null });
      }
    }),
    {
      name: 'associates-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        associates: state.associates,
        lastFetched: state.lastFetched,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recreate Map from persisted array
          state.associatesMap = createAssociatesMap(state.associates);
        }
      },
      version: 1,
    }
  )
);
