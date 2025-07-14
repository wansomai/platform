// src/store/workspace-documents.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';

export interface ProjectDocument {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdBy: string;
  createdAt: string;
  addedAt: string;
}

interface ProjectDocumentsState {
  documents: ProjectDocument[];
  isLoading: boolean;
  error: string | null;
  
  // Methods
  fetchProjectDocuments: (projectId: string) => Promise<ProjectDocument[]>;
  attachDocumentsToProject: (projectId: string, documentIds: string[]) => Promise<boolean>;
  removeDocumentFromProject: (projectId: string, documentId: string) => Promise<boolean>;
}

export const useProjectDocumentsStore = create<ProjectDocumentsState>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,
  
  fetchProjectDocuments: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.get<{data: ProjectDocument[]}>(`/api/projects/${projectId}/documents`);
      console.log('Fetched documents:', response.data);
      set({ 
        documents: response.data,
        isLoading: false 
      });
      
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch project documents', 
        isLoading: false 
      });
      return [];
    }
  },
  
  attachDocumentsToProject: async (projectId, documentIds) => {
    try {
      set({ isLoading: true, error: null });
      
      await apiService.post(`/api/projects/${projectId}/documents`, {
        documentIds
      });
      
      // Refresh document list
      const response = await apiService.get<{data: ProjectDocument[]}>(`/api/projects/${projectId}/documents`);
      set({ documents: response.data, isLoading: false });
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to attach documents to conversation', 
        isLoading: false 
      });
      return false;
    }
  },
  
  removeDocumentFromProject: async (projectId, documentId) => {
    try {
      set({ isLoading: true, error: null });
      
      // ✅ Updated to use the correct DELETE endpoint
      await apiService.delete(`/api/projects/${projectId}/documents/${documentId}`);
      
      // Remove document from list
      set((state) => ({
        documents: state.documents.filter(doc => doc.id !== documentId),
        isLoading: false
      }));
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to remove document from project', 
        isLoading: false 
      });
      return false;
    }
  }
}));