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
  downloadGeneratedDocument: (htmlContent: string, format: 'PDF' | 'DOCX' | 'MD', title: string) => Promise<void>;

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

// Helper function to sanitize filename for download
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .substring(0, 100);
};

// Helper function to convert HTML to Markdown
const htmlToMarkdown = (html: string): string => {
  let text = html
    .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
    .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<i>(.*?)<\/i>/g, '*$1*')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<li>(.*?)<\/li>/g, '- $1\n')
    .replace(/<[^>]+>/g, ''); // Remove remaining HTML tags
  return text;
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
            const error = `File size exceeds ${Math.round(API_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024))}MB limit. Please select a smaller file.`;
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
      },

      // Download generated document (DOCX, PDF, MD)
      downloadGeneratedDocument: async (htmlContent: string, format: 'PDF' | 'DOCX' | 'MD', title: string) => {
        try {
          if (!htmlContent) {
            throw new Error('No content to download');
          }

          if (format === 'DOCX') {
            // Client-side DOCX generation (same as CanvasInterface)
            const htmlDocx = await import('html-docx-js/dist/html-docx');

            // Clean and prepare HTML content for Word export
            let cleanHtml = htmlContent;

            // Basic HTML cleanup for better Word compatibility
            const htmlHeader = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 40px; } h1 { font-size: 20pt; font-weight: bold; margin-bottom: 12pt; } h2 { font-size: 16pt; font-weight: bold; margin-bottom: 10pt; } h3 { font-size: 14pt; font-weight: bold; margin-bottom: 8pt; } p { margin-bottom: 10pt; text-align: justify; } ul, ol { margin-bottom: 10pt; } li { margin-bottom: 4pt; } strong { font-weight: bold; } em { font-style: italic; }</style></head><body>`;
            cleanHtml = htmlHeader + htmlContent + '</body></html>'
              // Convert common classes to inline styles
              .replace(/class="ql-align-center"/g, 'style="text-align: center;"')
              .replace(/class="ql-align-right"/g, 'style="text-align: right;"')
              .replace(/class="ql-align-justify"/g, 'style="text-align: justify;"');

            // Convert HTML to Word document
            const docx = htmlDocx.asBlob(cleanHtml);

            // Create download link
            const url = URL.createObjectURL(docx);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${sanitizeFilename(title)}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } else if (format === 'MD') {
            // Convert HTML to Markdown
            const markdown = htmlToMarkdown(htmlContent);
            const blob = new Blob([markdown], { type: 'text/markdown' });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${sanitizeFilename(title)}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } else if (format === 'PDF') {
            // For PDF, create an HTML file that user can print to PDF
            const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1, h2, h3 { color: #333; }
    p { margin-bottom: 12px; }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  ${htmlContent}
  <script>
    // Auto-print dialog on load (user can cancel if they want)
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>`;

            const blob = new Blob([htmlDoc], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${sanitizeFilename(title)}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        } catch (error: any) {
          console.error('Download error:', error);
          throw error;
        }
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