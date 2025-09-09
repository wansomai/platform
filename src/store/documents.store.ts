// src/store/documents.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiService } from '@/lib/api';
import { Document, DocumentFilters } from '@/types/documents';
import { ApiResponse, DocumentsState } from '@/types';
import { API_CONSTANTS } from '@/lib/utils/constants';

// Extend ApiResponse to include pagination for documents
interface DocumentApiResponse<T> extends ApiResponse<T> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ExtendedDocumentsState extends DocumentsState {
  documents: Document[];
  documentsMap: Map<string, Document>;
  selectedDocuments: string[];
  selectedDocumentsSet: Set<string>;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null; // Track when documents were last fetched
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  
  // Methods
  fetchDocuments: (filters?: DocumentFilters, forceRefresh?: boolean) => Promise<Document[]>;
  uploadDocument: (fileData: FormData, onProgress?: ((progress: number) => void) | null) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<boolean>;
  selectDocument: (id: string) => void;
  unselectDocument: (id: string) => void;
  toggleDocumentSelection: (id: string) => void;
  clearSelectedDocuments: () => void;
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  removeDocument: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  refreshDocuments: () => Promise<void>; // Force refresh current documents
  invalidateCache: () => void; // Clear cache to force next fetch
  
  // Optimized getters
  getDocumentById: (id: string) => Document | undefined;
  isDocumentSelected: (id: string) => boolean;
}

// Helper functions for optimized data structures
const createDocumentsMap = (documents: Document[]): Map<string, Document> => {
  return new Map(documents.map(doc => [doc.id, doc]));
};

const createSelectedDocumentsSet = (selectedDocuments: string[]): Set<string> => {
  return new Set(selectedDocuments);
};

export const useDocumentsStore = create<ExtendedDocumentsState>()(
  persist(
    (set, get) => ({
      documents: [],
      documentsMap: new Map(),
      selectedDocuments: [],
      selectedDocumentsSet: new Set(),
      isLoading: false,
      error: null,
      lastFetched: null,
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        pages: 0,
      },
      folders: [],
      currentDocument: null,
      uploadProgress: {},
      
      fetchDocuments: async (filters: DocumentFilters = {}, forceRefresh = false): Promise<Document[]> => {
        const state = get();
        
        // OPTIMIZATION 1: Simple cache check
        const now = Date.now();
        const hasRecentData = state.lastFetched && (now - state.lastFetched) < API_CONSTANTS.CACHE_DURATION;
        const isSimilarRequest = !filters.search && !filters.type && !filters.folder && filters.page === 1;
        
        // Skip fetch if we have recent data and it's a simple request (dashboard)
        if (hasRecentData && isSimilarRequest && !forceRefresh && state.documents.length > 0) {
          return state.documents;
        }
        
        try {
          set({ isLoading: true, error: null });
          
          // Build query params
          const params = new URLSearchParams();
          if (filters.search) params.append('search', filters.search);
          if (filters.type) params.append('type', filters.type);
          if (filters.sort) params.append('sort', filters.sort);
          if (filters.folder) params.append('folder', filters.folder);
          if (filters.page) params.append('page', filters.page.toString());
          if (filters.limit) params.append('limit', filters.limit.toString());
          
          const response = await apiService.get<DocumentApiResponse<Document[]>>(
            `/api/documents${params.toString() ? `?${params.toString()}` : ''}`
          );
          
          const documents = response.data ?? [];
          
          set({ 
            documents, 
            documentsMap: createDocumentsMap(documents),
            isLoading: false, 
            lastFetched: now,
            pagination: response.pagination || state.pagination
          });
          
          return documents;
          
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch documents', isLoading: false });
          // Return cached documents on error if available, otherwise return empty array
          return Array.isArray(state.documents) ? state.documents : [];
        }
      },
      
      uploadDocument: async (fileData: FormData, onProgress: ((progress: number) => void) | null = null) => {
        try {
          // Check file size before uploading
          const file = fileData.get('file') as File;
          
          if (file && file.size > API_CONSTANTS.MAX_FILE_SIZE) {
            const error = 'File size exceeds 5MB limit. Please upgrade your plan to upload larger files.';
            set({ error, isLoading: false });
            throw new Error(error);
          }
          
          set({ isLoading: true, error: null });
          
          // Use the upload method with progress tracking
          const response = await apiService.upload<{status: number, message: string, data: Document}>('/api/documents', fileData, onProgress);
          
          const newDocument = response.data.data; // Extract the document from the data wrapper
          
          // Add the new document to the store immediately
          set((state) => {
            const newDocuments = [newDocument, ...state.documents];
            return {
              documents: newDocuments,
              documentsMap: createDocumentsMap(newDocuments),
              pagination: {
                ...state.pagination,
                total: state.pagination.total + 1
              },
              isLoading: false,
              lastFetched: Date.now() // Update cache timestamp
            };
          });
          
          return newDocument;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to upload document';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          throw error;
        }
      },
      
      deleteDocument: async (id) => {
        try {
          await apiService.delete(`/api/documents/${id}`);
          
          // Remove document from list
          set((state) => {
            const newDocuments = state.documents.filter(d => d.id !== id);
            const newSelected = state.selectedDocuments.filter(docId => docId !== id);
            return {
              documents: newDocuments,
              documentsMap: createDocumentsMap(newDocuments),
              selectedDocuments: newSelected,
              selectedDocumentsSet: createSelectedDocumentsSet(newSelected),
              pagination: {
                ...state.pagination,
                total: Math.max(0, state.pagination.total - 1)
              },
              lastFetched: Date.now() // Update cache timestamp
            };
          });
          
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete document' });
          return false;
        }
      },
      
      // Document selection methods for UI
      selectDocument: (id) => {
        set((state) => {
          const newSelected = [...state.selectedDocuments, id];
          return {
            selectedDocuments: newSelected,
            selectedDocumentsSet: createSelectedDocumentsSet(newSelected)
          };
        });
      },
      
      unselectDocument: (id) => {
        set((state) => {
          const newSelected = state.selectedDocuments.filter(docId => docId !== id);
          return {
            selectedDocuments: newSelected,
            selectedDocumentsSet: createSelectedDocumentsSet(newSelected)
          };
        });
      },
      
      toggleDocumentSelection: (id) => {
        set((state) => {
          let newSelected;
          if (state.selectedDocumentsSet.has(id)) {
            newSelected = state.selectedDocuments.filter(docId => docId !== id);
          } else {
            newSelected = [...state.selectedDocuments, id];
          }
          return {
            selectedDocuments: newSelected,
            selectedDocumentsSet: createSelectedDocumentsSet(newSelected)
          };
        });
      },
      
      clearSelectedDocuments: () => {
        set({ 
          selectedDocuments: [],
          selectedDocumentsSet: new Set()
        });
      },
      
      setDocuments: (documents) => set({ 
        documents, 
        documentsMap: createDocumentsMap(documents),
        lastFetched: Date.now() 
      }),
      
      addDocument: (document) => set((state) => {
        const newDocuments = [document, ...state.documents];
        return { 
          documents: newDocuments,
          documentsMap: createDocumentsMap(newDocuments),
          pagination: {
            ...state.pagination,
            total: state.pagination.total + 1
          },
          lastFetched: Date.now()
        };
      }),
      
      removeDocument: (id) => set((state) => {
        const newDocuments = state.documents.filter(d => d.id !== id);
        return { 
          documents: newDocuments,
          documentsMap: createDocumentsMap(newDocuments),
          pagination: {
            ...state.pagination,
            total: Math.max(0, state.pagination.total - 1)
          },
          lastFetched: Date.now()
        };
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // Optimized getters using Map/Set for O(1) lookups
      getDocumentById: (id) => {
        return get().documentsMap.get(id);
      },
      
      isDocumentSelected: (id) => {
        return get().selectedDocumentsSet.has(id);
      },
      
      // Force refresh current documents with same filters
      refreshDocuments: async () => {
        const state = get();
        // Use current pagination state to refresh with same filters
        await state.fetchDocuments({
          page: state.pagination.page,
          limit: state.pagination.limit
        }, true); // Force refresh
      },
      
      // Clear cache to force next fetch
      invalidateCache: () => {
        set({ lastFetched: null });
      }
    }),
    {
      name: 'documents-store', // Storage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        documents: state.documents,
        selectedDocuments: state.selectedDocuments,
        lastFetched: state.lastFetched,
        pagination: state.pagination,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recreate Map and Set from persisted arrays
          state.documentsMap = createDocumentsMap(state.documents);
          state.selectedDocumentsSet = createSelectedDocumentsSet(state.selectedDocuments);
        }
      },
      version: 1,
    }
  )
);