// src/store/documents.store.ts
import { create } from 'zustand'

export interface Document {
  id: string
  project_id: string
  organization_id: string
  title: string
  description: {
    String: string
    Valid: boolean
  }
  file_url: string
  status: string
  section: string
  created_by: string
  metadata: {
    RawMessage: any
    Valid: boolean
  }
  content_extracted: {
    Bool: boolean
    Valid: boolean
  }
  created_at: string
  updated_at: string
  created_by_name: string
}

interface DocumentsState {
  documents: Document[]
  isLoading: boolean
  error: string | null
  setDocuments: (documents: Document[]) => void
  addDocument: (document: Document) => void
  removeDocument: (id: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export const useDocumentsStore = create<DocumentsState>((set) => ({
  documents: [],
  isLoading: false,
  error: null,
  setDocuments: (documents) => set({ documents }),
  addDocument: (document) => 
    set((state) => ({ documents: [...state.documents, document] })),
  removeDocument: (id) => 
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id)
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}))