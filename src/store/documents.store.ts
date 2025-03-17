// src/store/documents.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';

export interface Document {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdBy: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  contentExtracted: boolean;
}

interface DocumentFilters {
  search?: string;
  type?: string;
  sort?: 'recent' | 'oldest' | 'name' | 'size';
  page?: number;
  limit?: number;
}

interface DocumentsState {
  documents: Document[];
  selectedDocuments: string[]; // For multi-select in UI
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  
  // Methods
  fetchDocuments: (filters?: DocumentFilters) => Promise<Document[]>;
  uploadDocument: (fileData: FormData, description?: string) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<boolean>;
  selectDocument: (id: string) => void;
  unselectDocument: (id: string) => void;
  toggleDocumentSelection: (id: string) => void;
  clearSelectedDocuments: () => void;
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  selectedDocuments: [],
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  },
  
  fetchDocuments: async (filters) => {
    try {
      set({ isLoading: true, error: null });
      
      // Build query string
      let url = '/api/documents';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.type) params.append('type', filters.type);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await apiService.get<{
        data: Document[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      }>(url);
      
      set({ 
        documents: response.data,
        pagination: response.pagination,
        isLoading: false 
      });
      
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch documents', 
        isLoading: false 
      });
      return [];
    }
  },
  
  uploadDocument: async (fileData: FormData, description?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data: document } = await apiService.upload<Document>('/api/documents', fileData);
      
      set((state) => ({
        documents: [document, ...state.documents],
        isLoading: false
      }));
      
      return document;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to upload document', 
        isLoading: false 
      });
      return null;
    }
  },
  
  deleteDocument: async (id) => {
    try {
      await apiService.delete(`/api/documents/${id}`);
      
      // Remove document from list
      set((state) => ({
        documents: state.documents.filter(d => d.id !== id),
        selectedDocuments: state.selectedDocuments.filter(docId => docId !== id)
      }));
      
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete document' });
      return false;
    }
  },
  
  // Document selection methods for UI
  selectDocument: (id) => {
    set((state) => ({
      selectedDocuments: [...state.selectedDocuments, id]
    }));
  },
  
  unselectDocument: (id) => {
    set((state) => ({
      selectedDocuments: state.selectedDocuments.filter(docId => docId !== id)
    }));
  },
  
  toggleDocumentSelection: (id) => {
    set((state) => {
      if (state.selectedDocuments.includes(id)) {
        return {
          selectedDocuments: state.selectedDocuments.filter(docId => docId !== id)
        };
      } else {
        return {
          selectedDocuments: [...state.selectedDocuments, id]
        };
      }
    });
  },
  
  clearSelectedDocuments: () => {
    set({ selectedDocuments: [] });
  }
}));