// src/store/canvas.store.ts
import { create } from 'zustand'
import { apiService } from '@/lib/api'

export interface CanvasDocument {
  id: string;
  projectId: string;
  content: any; // Lexical EditorState JSON
  htmlContent: string;
  plainText: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingSuggestion {
  suggestedHtml: string;
  originalHtml: string;
  changeDescription: string;
}

interface CanvasState {
  canvasDocument: CanvasDocument | null;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  currentEditorHtml: string;
  pendingSuggestion: PendingSuggestion | null;

  // Canvas management
  setCanvasDocument: (document: CanvasDocument | null) => void;
  refreshCanvasDocument: (projectId: string) => Promise<void>;
  handleRealTimeUpdate: (document: CanvasDocument) => void;

  // API interactions
  fetchCanvasDocument: (projectId: string) => Promise<CanvasDocument | null>;
  saveCanvasDocument: (projectId: string, content: any, htmlContent: string, plainText: string) => Promise<CanvasDocument | null>;
  deleteCanvasDocument: (projectId: string) => Promise<boolean>;

  // State management
  setLoading: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setCurrentEditorHtml: (html: string) => void;
  setPendingSuggestion: (s: PendingSuggestion) => void;
  clearPendingSuggestion: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvasDocument: null,
  isLoading: false,
  error: null,
  isSaving: false,
  currentEditorHtml: '',
  pendingSuggestion: null,
  
  // Basic state setters
  setCanvasDocument: (document) => set({ canvasDocument: document }),
  
  refreshCanvasDocument: async (projectId) => {
    // Refresh without showing loading spinner
    await get().fetchCanvasDocument(projectId);
  },
  
  handleRealTimeUpdate: (newDocument: CanvasDocument) => {
    // Direct update from real-time events (like chat updates)
    set({ canvasDocument: newDocument });
  },
  
  // API interactions
  fetchCanvasDocument: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      const document = await apiService.get<CanvasDocument>(
        `/api/projects/${projectId}/canvas`
      );
      set({ canvasDocument: document, isLoading: false });
      return document;
    } catch (error: any) {
      // If document doesn't exist (404), it's not an error
      if (error.response?.status === 404) {
        set({ canvasDocument: null, isLoading: false, error: null });
        return null;
      }
      
      set({ 
        error: error.message || 'Failed to fetch canvas document', 
        isLoading: false 
      });
      return null;
    }
  },
  
  saveCanvasDocument: async (projectId, content, htmlContent, plainText) => {
    try {
      set({ isSaving: true, error: null });
      const document = await apiService.post<CanvasDocument>(
        `/api/projects/${projectId}/canvas`,
        { content, htmlContent, plainText }
      );
      set({ canvasDocument: document, isSaving: false });
      return document;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to save canvas document', 
        isSaving: false 
      });
      return null;
    }
  },
  
  deleteCanvasDocument: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      await apiService.delete(`/api/projects/${projectId}/canvas`);
      set({ canvasDocument: null, isLoading: false });
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to delete canvas document', 
        isLoading: false 
      });
      return false;
    }
  },
  
  // State management
  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setCurrentEditorHtml: (html) => set({ currentEditorHtml: html }),
  setPendingSuggestion: (s) => set({ pendingSuggestion: s }),
  clearPendingSuggestion: () => set({ pendingSuggestion: null }),
}));

// Selector hooks for better performance
export const useCanvasDocument = () => {
  const canvasDocument = useCanvasStore(state => state.canvasDocument);
  const isLoading = useCanvasStore(state => state.isLoading);
  const error = useCanvasStore(state => state.error);
  const fetchCanvasDocument = useCanvasStore(state => state.fetchCanvasDocument);
  const refreshCanvasDocument = useCanvasStore(state => state.refreshCanvasDocument);
  
  return { canvasDocument, isLoading, error, fetchCanvasDocument, refreshCanvasDocument };
};

export const useCanvasSaving = () => {
  const isSaving = useCanvasStore(state => state.isSaving);
  const saveCanvasDocument = useCanvasStore(state => state.saveCanvasDocument);
  const deleteCanvasDocument = useCanvasStore(state => state.deleteCanvasDocument);
  
  return { 
    isSaving, 
    saveCanvasDocument, 
    deleteCanvasDocument 
  };
};
