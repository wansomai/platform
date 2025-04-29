// src/store/documents.store.ts - Modified with file size check
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
  folder?: string | null;  // Add folder filter
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
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

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
        if (filters.folder) params.append('folder', filters.folder); // Add folder param
        
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
  
  uploadDocument: async (fileData: FormData, onProgress: ((progress: number) => void) | null = null) => {
    try {
      // Check file size before uploading
      const file = fileData.get('file') as File;
      
      if (file && file.size > MAX_FILE_SIZE) {
        const error = 'File size exceeds 5MB limit. Please upgrade your plan to upload larger files.';
        set({ error, isLoading: false });
        throw new Error(error);
      }
      
      set({ isLoading: true, error: null });
      
      // Use the upload method with progress tracking
      const response = await apiService.upload<Document>('/api/documents', fileData, onProgress);
      
      set({ isLoading: false });
      
      // Get updated documents list
      await get().fetchDocuments();
      return response.data;
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
  },
  
  setDocuments: (documents) => set({ documents }),
  addDocument: (document) => set((state) => ({ documents: [...state.documents, document] })),
  removeDocument: (id) => set((state) => ({ documents: state.documents.filter(d => d.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));