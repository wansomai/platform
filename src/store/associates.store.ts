// src/store/associates.store.ts
import { create } from 'zustand';
import api from '@/lib/api';

type AssociateStep = {
  id?: string;
  description: string;
  order?: number;
};

type Associate = {
  id: string;
  name: string;
  instructions: string;
  steps: AssociateStep[];
  tools: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  linkedToProject?: boolean;
  
  addedToProject?: string;
};

type AssociatesState = {
  associates: Associate[];
  currentAssociate: Associate | null;
  isLoading: boolean;
  error: string | null;
  
  fetchAssociates: (projectId: string) => Promise<void>;
  fetchAllAssociates: () => Promise<void>;
  fetchAssociateById: (associateId: string) => Promise<void>;
  createAssociate: (
    data: Omit<Associate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, 
    projectIds?: string[]
  ) => Promise<Associate>;
  linkAssociateToProject: (projectId: string, associateId: string) => Promise<void>;
  unlinkAssociateFromProject: (projectId: string, associateId: string) => Promise<void>;
  sendQuery: (projectId: string, associateId: string, query: string, conversationId?: string) => Promise<any>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useAssociatesStore = create<AssociatesState>((set, get) => ({
  associates: [],
  currentAssociate: null,
  isLoading: false,
  error: null,
  
  fetchAssociates: async (projectId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get(`/api/projects/${projectId}/associates`);
      set({ associates: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to fetch associates' 
      });
    }
  },

  fetchAllAssociates: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get('/api/associates');
      set({ associates: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to fetch associates' 
      });
    }
  },
  
  fetchAssociateById: async (associateId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get(`/api/associates/${associateId}`);
      set({ currentAssociate: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to fetch associate' 
      });
    }
  },
  
  createAssociate: async (data, projectIds) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post('/api/associates', {
        ...data,
        projectIds
      });
      const newAssociate = response.data.data;
      set(state => ({ 
        associates: [...state.associates, newAssociate],
        isLoading: false 
      }));
      return newAssociate;
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to create associate' 
      });
      throw error;
    }
  },
  
  linkAssociateToProject: async (projectId, associateId) => {
    try {
      set({ isLoading: true, error: null });
      await api.put(`/api/projects/${projectId}/associates/${associateId}`);
      
      // Update associate in state
      set(state => ({
        associates: state.associates.map(associate => 
          associate.id === associateId 
            ? { ...associate, linkedToProject: true, addedToProject: new Date().toISOString() }
            : associate
        ),
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to link associate to project' 
      });
      throw error;
    }
  },
  
  unlinkAssociateFromProject: async (projectId, associateId) => {
    try {
      set({ isLoading: true, error: null });
      await api.delete(`/api/projects/${projectId}/associates/${associateId}`);
      
      // Update associate in state
      set(state => ({
        associates: state.associates.map(associate => 
          associate.id === associateId 
            ? { ...associate, linkedToProject: false, addedToProject: undefined }
            : associate
        ),
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to unlink associate from project' 
      });
      throw error;
    }
  },
  
  sendQuery: async (projectId, associateId, query, conversationId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post(`/api/projects/${projectId}/associates/${associateId}/chat`, {
        query,
        conversationId
      });
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to process query' 
      });
      throw error;
    }
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error })
}));