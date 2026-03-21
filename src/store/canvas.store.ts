// src/store/canvas.store.ts
import { create } from 'zustand'
import { apiService } from '@/lib/api'

export interface CanvasDocument {
  id: string;
  projectId: string;
  title: string;
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
  canvasDocumentId?: string;
}

interface CanvasState {
  // Multi-document support
  canvasDocuments: CanvasDocument[];
  activeCanvasId: string | null;
  canvasDocument: CanvasDocument | null; // derived: the active document

  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  currentEditorHtml: string;
  pendingSuggestion: PendingSuggestion | null;

  // Canvas management
  setCanvasDocument: (document: CanvasDocument | null) => void;
  setActiveCanvasId: (id: string | null) => void;
  refreshCanvasDocument: (projectId: string) => Promise<void>;
  handleRealTimeUpdate: (document: CanvasDocument) => void;
  resetForProject: () => void;
  switchToStreamingDocument: (docId: string, projectId: string, title: string) => void;

  // API interactions
  fetchCanvasDocument: (projectId: string) => Promise<CanvasDocument | null>;
  fetchCanvasDocuments: (projectId: string, nextActiveId?: string) => Promise<CanvasDocument[]>;
  saveCanvasDocument: (projectId: string, content: any, htmlContent: string, plainText: string) => Promise<CanvasDocument | null>;
  saveDocumentById: (projectId: string, docId: string, content: any, htmlContent: string, plainText: string) => Promise<CanvasDocument | null>;
  createCanvasDocument: (projectId: string, title?: string) => Promise<CanvasDocument | null>;
  deleteCanvasDocument: (projectId: string) => Promise<boolean>;
  renameCanvasDocument: (docId: string, title: string) => Promise<void>;

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
  canvasDocuments: [],
  activeCanvasId: null,
  canvasDocument: null,
  isLoading: false,
  error: null,
  isSaving: false,
  currentEditorHtml: '',
  pendingSuggestion: null,

  setCanvasDocument: (document) => set({
    canvasDocument: document,
    activeCanvasId: document?.id ?? null
  }),

  setActiveCanvasId: (id) => {
    const doc = id ? get().canvasDocuments.find(d => d.id === id) ?? null : null;
    set({ activeCanvasId: id, canvasDocument: doc });
  },

  refreshCanvasDocument: async (projectId) => {
    await get().fetchCanvasDocuments(projectId);
  },

  resetForProject: () => set({
    canvasDocuments: [],
    activeCanvasId: null,
    canvasDocument: null,
    currentEditorHtml: '',
    pendingSuggestion: null,
    isLoading: false,
    error: null,
  }),

  // Called on the first streaming chunk for a new document.
  // Inserts a placeholder at the top of the list and activates it immediately,
  // so the LexicalComposer remounts with the correct key before any content arrives.
  switchToStreamingDocument: (docId, projectId, title) => {
    const existing = get().canvasDocuments.find(d => d.id === docId);
    if (existing) {
      // Doc already in list (e.g. fast network) — just activate it
      set({ activeCanvasId: docId, canvasDocument: existing });
      return;
    }
    const placeholder: CanvasDocument = {
      id: docId,
      projectId,
      title,
      content: {},
      htmlContent: '',
      plainText: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(state => ({
      canvasDocuments: [placeholder, ...state.canvasDocuments],
      activeCanvasId: docId,
      canvasDocument: placeholder,
    }));
  },

  handleRealTimeUpdate: (newDocument: CanvasDocument) => {
    const docs = get().canvasDocuments.map(d => d.id === newDocument.id ? newDocument : d);
    const exists = docs.some(d => d.id === newDocument.id);
    set({
      canvasDocuments: exists ? docs : [newDocument, ...docs],
      canvasDocument: get().activeCanvasId === newDocument.id ? newDocument : get().canvasDocument
    });
  },

  fetchCanvasDocuments: async (projectId, nextActiveId?) => {
    try {
      set({ isLoading: true, error: null });
      const docs = await apiService.get<CanvasDocument[]>(`/api/projects/${projectId}/canvas`);
      const list = Array.isArray(docs) ? docs : [];
      const currentActiveId = get().activeCanvasId;
      // Priority: explicit nextActiveId > preserved current (if still in list) > most recent
      let activeId: string | null;
      if (nextActiveId && list.some(d => d.id === nextActiveId)) {
        activeId = nextActiveId;
      } else if (currentActiveId && list.some(d => d.id === currentActiveId)) {
        activeId = currentActiveId;
      } else {
        activeId = list[0]?.id ?? null;
      }
      set({
        canvasDocuments: list,
        activeCanvasId: activeId,
        canvasDocument: list.find(d => d.id === activeId) ?? null,
        isLoading: false
      });
      return list;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch canvas documents', isLoading: false });
      return [];
    }
  },

  // Kept for backwards-compat — fetches list and returns first/active doc
  fetchCanvasDocument: async (projectId) => {
    const list = await get().fetchCanvasDocuments(projectId);
    return get().canvasDocument;
  },

  saveCanvasDocument: async (projectId, content, htmlContent, plainText) => {
    const activeId = get().activeCanvasId;
    if (!activeId) {
      // No active document — skip the save.
      // Documents must be created explicitly (AI generation or the "+" button).
      // Auto-creating here would produce duplicate blank documents during race
      // conditions between project mount and the first fetchCanvasDocuments return.
      return null;
    }

    try {
      set({ isSaving: true, error: null });
      const doc = await apiService.put<CanvasDocument>(
        `/api/projects/${projectId}/canvas/${activeId}`,
        { content, htmlContent, plainText }
      );
      // Update the list in place
      const docs = get().canvasDocuments.map(d => d.id === doc.id ? doc : d);
      set({ canvasDocuments: docs, canvasDocument: doc, isSaving: false });
      return doc;
    } catch (error: any) {
      set({ error: error.message || 'Failed to save canvas document', isSaving: false });
      return null;
    }
  },

  saveDocumentById: async (projectId, docId, content, htmlContent, plainText) => {
    try {
      set({ isSaving: true });
      const doc = await apiService.put<CanvasDocument>(
        `/api/projects/${projectId}/canvas/${docId}`,
        { content, htmlContent, plainText }
      );
      const existing = get().canvasDocuments;
      const exists = existing.some(d => d.id === doc.id);
      const docs = exists ? existing.map(d => d.id === doc.id ? doc : d) : [doc, ...existing];
      const currentActiveId = get().activeCanvasId;
      // Activate this document if nothing is active yet, or it's already the active one
      if (!currentActiveId || currentActiveId === doc.id) {
        set({ canvasDocuments: docs, activeCanvasId: doc.id, canvasDocument: doc, isSaving: false });
      } else {
        set({ canvasDocuments: docs, isSaving: false });
      }
      return doc;
    } catch {
      set({ isSaving: false });
      return null;
    }
  },

  createCanvasDocument: async (projectId, title) => {
    try {
      set({ isSaving: true, error: null });
      const doc = await apiService.post<CanvasDocument>(
        `/api/projects/${projectId}/canvas`,
        { title: title || 'Untitled Document', htmlContent: '', plainText: '', content: {} }
      );
      set(state => ({
        canvasDocuments: [doc, ...state.canvasDocuments],
        activeCanvasId: doc.id,
        canvasDocument: doc,
        isSaving: false
      }));
      return doc;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create canvas document', isSaving: false });
      return null;
    }
  },

  deleteCanvasDocument: async (projectId) => {
    const activeId = get().activeCanvasId;
    if (!activeId) return false;
    try {
      set({ isLoading: true, error: null });
      await apiService.delete(`/api/projects/${projectId}/canvas/${activeId}`);
      const remaining = get().canvasDocuments.filter(d => d.id !== activeId);
      const nextActive = remaining[0] ?? null;
      set({
        canvasDocuments: remaining,
        activeCanvasId: nextActive?.id ?? null,
        canvasDocument: nextActive,
        isLoading: false
      });
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete canvas document', isLoading: false });
      return false;
    }
  },

  renameCanvasDocument: async (docId, title) => {
    const projectId = get().canvasDocuments.find(d => d.id === docId)?.projectId;
    if (!projectId) return;
    try {
      const doc = await apiService.put<CanvasDocument>(
        `/api/projects/${projectId}/canvas/${docId}`,
        { title }
      );
      const docs = get().canvasDocuments.map(d => d.id === docId ? { ...d, title: doc.title } : d);
      set({
        canvasDocuments: docs,
        canvasDocument: get().activeCanvasId === docId ? { ...get().canvasDocument!, title: doc.title } : get().canvasDocument
      });
    } catch { /* ignore */ }
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
  const canvasDocuments = useCanvasStore(state => state.canvasDocuments);
  const activeCanvasId = useCanvasStore(state => state.activeCanvasId);
  const isLoading = useCanvasStore(state => state.isLoading);
  const error = useCanvasStore(state => state.error);
  const fetchCanvasDocument = useCanvasStore(state => state.fetchCanvasDocument);
  const fetchCanvasDocuments = useCanvasStore(state => state.fetchCanvasDocuments);
  const refreshCanvasDocument = useCanvasStore(state => state.refreshCanvasDocument);

  return { canvasDocument, canvasDocuments, activeCanvasId, isLoading, error, fetchCanvasDocument, fetchCanvasDocuments, refreshCanvasDocument };
};

export const useCanvasSaving = () => {
  const isSaving = useCanvasStore(state => state.isSaving);
  const saveCanvasDocument = useCanvasStore(state => state.saveCanvasDocument);
  const deleteCanvasDocument = useCanvasStore(state => state.deleteCanvasDocument);
  const createCanvasDocument = useCanvasStore(state => state.createCanvasDocument);

  return {
    isSaving,
    saveCanvasDocument,
    deleteCanvasDocument,
    createCanvasDocument
  };
};
