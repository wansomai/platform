// src/store/conversation-documents.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';

export interface ConversationDocument {
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

interface ConversationDocumentsState {
  documents: ConversationDocument[];
  isLoading: boolean;
  error: string | null;
  
  // Methods
  fetchConversationDocuments: (conversationId: string) => Promise<ConversationDocument[]>;
  attachDocumentsToConversation: (conversationId: string, documentIds: string[]) => Promise<boolean>;
  removeDocumentFromConversation: (conversationId: string, documentId: string) => Promise<boolean>;
}

export const useConversationDocumentsStore = create<ConversationDocumentsState>((set) => ({
  documents: [],
  isLoading: false,
  error: null,
  
  fetchConversationDocuments: async (conversationId) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiService.get<{data: ConversationDocument[]}>(`/api/conversations/${conversationId}/documents`);
      
      set({ 
        documents: response.data,
        isLoading: false 
      });
      
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch conversation documents', 
        isLoading: false 
      });
      return [];
    }
  },
  
  attachDocumentsToConversation: async (conversationId, documentIds) => {
    try {
      set({ isLoading: true, error: null });
      
      await apiService.post(`/api/conversations/${conversationId}/documents`, {
        documentIds
      });
      
      // Refresh document list
      const response = await apiService.get<{data: ConversationDocument[]}>(`/api/conversations/${conversationId}/documents`);
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
  
  removeDocumentFromConversation: async (conversationId, documentId) => {
    try {
      set({ isLoading: true, error: null });
      
      await apiService.delete(`/api/conversations/${conversationId}/documents/${documentId}`);
      
      // Remove document from list
      set((state) => ({
        documents: state.documents.filter(doc => doc.id !== documentId),
        isLoading: false
      }));
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to remove document from conversation', 
        isLoading: false 
      });
      return false;
    }
  }
}));