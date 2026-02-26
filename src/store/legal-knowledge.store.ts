// src/store/legal-knowledge.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';
import type {
  LegalKnowledge,
  LegalKnowledgeFilter,
  LegalKnowledgeType,
  Jurisdiction
} from '@/types/legalKnowledge';

interface LegalKnowledgeStats {
  total: number;
  published: number;
  byType: Record<string, number>;
  byJurisdiction: Record<string, number>;
  totalChunks: number;
}

interface LegalKnowledgePagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface LegalKnowledgeResponse {
  success: boolean;
  data: LegalKnowledge[];
  pagination: LegalKnowledgePagination;
  stats: LegalKnowledgeStats;
}

interface CreateFromTextInput {
  title: string;
  description?: string;
  type: LegalKnowledgeType;
  jurisdiction: Jurisdiction;
  practiceAreas?: string[];
  content: string;
  sourceType?: string;
  sourceReference?: string;
  effectiveDate?: string;
  tags?: string[];
}

interface LegalKnowledgeState {
  // Data
  items: LegalKnowledge[];
  itemsMap: Map<string, LegalKnowledge>;
  stats: LegalKnowledgeStats;
  pagination: LegalKnowledgePagination;

  // Filters
  filters: LegalKnowledgeFilter;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Methods
  fetchLegalKnowledge: (page?: number) => Promise<void>;
  createFromText: (input: CreateFromTextInput) => Promise<LegalKnowledge | null>;
  uploadFile: (formData: FormData) => Promise<LegalKnowledge | null>;
  publish: (id: string) => Promise<boolean>;
  unpublish: (id: string) => Promise<boolean>;
  archive: (id: string) => Promise<boolean>;
  reprocess: (id: string) => Promise<boolean>;

  // Filter methods
  setFilter: <K extends keyof LegalKnowledgeFilter>(key: K, value: LegalKnowledgeFilter[K]) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;

  // State methods
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  refresh: () => Promise<void>;

  // Optimized getters
  getById: (id: string) => LegalKnowledge | undefined;
}

// Helper function for optimized data structure
const createItemsMap = (items: LegalKnowledge[]): Map<string, LegalKnowledge> => {
  return new Map(items.map(item => [item.id, item]));
};

const defaultStats: LegalKnowledgeStats = {
  total: 0,
  published: 0,
  byType: {},
  byJurisdiction: {},
  totalChunks: 0
};

const defaultPagination: LegalKnowledgePagination = {
  total: 0,
  page: 1,
  limit: 20,
  pages: 0,
  hasNext: false,
  hasPrev: false
};

export const useLegalKnowledgeStore = create<LegalKnowledgeState>((set, get) => ({
  // Initial state
  items: [],
  itemsMap: new Map(),
  stats: defaultStats,
  pagination: defaultPagination,
  filters: {},
  isLoading: false,
  error: null,

  fetchLegalKnowledge: async (page?: number) => {
    const state = get();
    const currentPage = page ?? state.pagination.page;

    try {
      set({ isLoading: true, error: null });

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: state.pagination.limit.toString()
      });

      // Apply filters
      if (state.filters.type) params.set('type', state.filters.type);
      if (state.filters.jurisdiction) params.set('jurisdiction', state.filters.jurisdiction);
      if (state.filters.status) params.set('status', state.filters.status);
      if (state.filters.isPublished !== undefined) {
        params.set('isPublished', state.filters.isPublished.toString());
      }
      if (state.filters.search) params.set('search', state.filters.search);

      const response = await apiService.get<LegalKnowledgeResponse>(
        `/api/admin/legal-knowledge?${params}`
      );

      const items = response.data ?? [];

      set({
        items,
        itemsMap: createItemsMap(items),
        stats: response.stats ?? defaultStats,
        pagination: response.pagination ?? defaultPagination,
        isLoading: false
      });

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch legal knowledge';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createFromText: async (input: CreateFromTextInput) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiService.post<{ success: boolean; data: LegalKnowledge }>(
        '/api/admin/legal-knowledge',
        input
      );

      const newItem = response.data;

      // Add the new item to the store
      set((state) => {
        const newItems = [newItem, ...state.items];
        return {
          items: newItems,
          itemsMap: createItemsMap(newItems),
          stats: {
            ...state.stats,
            total: state.stats.total + 1
          },
          pagination: {
            ...state.pagination,
            total: state.pagination.total + 1
          },
          isLoading: false
        };
      });

      return newItem;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create legal knowledge';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  uploadFile: async (formData: FormData) => {
    try {
      set({ isLoading: true, error: null });

      // apiService.upload returns AxiosResponse<T>
      // API returns { success, data: LegalKnowledge, message }
      const response = await apiService.upload<{ success: boolean; data: LegalKnowledge }>(
        '/api/admin/legal-knowledge/upload',
        formData
      );

      const newItem = response.data.data;

      // Add the new item to the store
      set((state) => {
        const newItems = [newItem, ...state.items];
        return {
          items: newItems,
          itemsMap: createItemsMap(newItems),
          stats: {
            ...state.stats,
            total: state.stats.total + 1
          },
          pagination: {
            ...state.pagination,
            total: state.pagination.total + 1
          },
          isLoading: false
        };
      });

      return newItem;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload file';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  publish: async (id: string) => {
    try {
      await apiService.post(`/api/admin/legal-knowledge/${id}/publish`, {});

      // Update the item in the store
      set((state) => {
        const newItems = state.items.map(item =>
          item.id === id ? { ...item, isPublished: true, status: 'active' } : item
        );
        return {
          items: newItems,
          itemsMap: createItemsMap(newItems),
          stats: {
            ...state.stats,
            published: state.stats.published + 1
          }
        };
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to publish';
      set({ error: errorMessage });
      return false;
    }
  },

  unpublish: async (id: string) => {
    try {
      await apiService.delete(`/api/admin/legal-knowledge/${id}/publish`);

      // Update the item in the store
      set((state) => {
        const newItems = state.items.map(item =>
          item.id === id ? { ...item, isPublished: false } : item
        );
        return {
          items: newItems,
          itemsMap: createItemsMap(newItems),
          stats: {
            ...state.stats,
            published: Math.max(0, state.stats.published - 1)
          }
        };
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to unpublish';
      set({ error: errorMessage });
      return false;
    }
  },

  archive: async (id: string) => {
    try {
      await apiService.delete(`/api/admin/legal-knowledge/${id}`);

      // Update the item in the store
      set((state) => {
        const newItems = state.items.map(item =>
          item.id === id ? { ...item, status: 'archived', isPublished: false } : item
        );
        return {
          items: newItems,
          itemsMap: createItemsMap(newItems),
          stats: {
            ...state.stats,
            total: Math.max(0, state.stats.total - 1),
            published: state.items.find(i => i.id === id)?.isPublished
              ? Math.max(0, state.stats.published - 1)
              : state.stats.published
          }
        };
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to archive';
      set({ error: errorMessage });
      return false;
    }
  },

  reprocess: async (id: string) => {
    try {
      await apiService.post(`/api/admin/legal-knowledge/${id}/reprocess`, {});
      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to start reprocessing';
      set({ error: errorMessage });
      return false;
    }
  },

  // Filter methods
  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      pagination: { ...state.pagination, page: 1 } // Reset to first page on filter change
    }));
    // Auto-fetch after filter change
    get().fetchLegalKnowledge(1);
  },

  clearFilters: () => {
    set({
      filters: {},
      pagination: { ...get().pagination, page: 1 }
    });
    get().fetchLegalKnowledge(1);
  },

  setPage: (page: number) => {
    set((state) => ({
      pagination: { ...state.pagination, page }
    }));
    get().fetchLegalKnowledge(page);
  },

  // State methods
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  refresh: async () => {
    await get().fetchLegalKnowledge();
  },

  // Optimized getter using Map for O(1) lookup
  getById: (id) => {
    return get().itemsMap.get(id);
  }
}));

// Custom hooks for convenience
export const useLegalKnowledgeItems = () => useLegalKnowledgeStore((state) => state.items);
export const useLegalKnowledgeStats = () => useLegalKnowledgeStore((state) => state.stats);
export const useLegalKnowledgePagination = () => useLegalKnowledgeStore((state) => state.pagination);
export const useLegalKnowledgeFilters = () => useLegalKnowledgeStore((state) => state.filters);
export const useLegalKnowledgeLoading = () => useLegalKnowledgeStore((state) => state.isLoading);
export const useLegalKnowledgeError = () => useLegalKnowledgeStore((state) => state.error);
