// src/store/conversation-actions.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';

export interface ConversationAction {
  id: string;
  conversationId: string;
  userId: string | null;
  actionType: string;
  title: string;
  parameters: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultContent: string | null;
  resultUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConversationActionsState {
  actions: ConversationAction[];
  currentAction: ConversationAction | null;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  fetchActions: (conversationId: string) => Promise<ConversationAction[]>;
  fetchAction: (actionId: string) => Promise<ConversationAction | null>;
  executeAction: (conversationId: string, actionType: string, parameters: Record<string, any>) => Promise<ConversationAction | null>;
  updateActionStatus: (actionId: string, status: 'pending' | 'processing' | 'completed' | 'failed') => Promise<boolean>;
  deleteAction: (actionId: string) => Promise<boolean>;
  
  // State management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearActions: () => void;
  setCurrentAction: (action: ConversationAction | null) => void;
}

export const useConversationActionsStore = create<ConversationActionsState>((set, get) => ({
  actions: [],
  currentAction: null,
  isLoading: false,
  error: null,
  
  fetchActions: async (conversationId) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiService.get<{data: ConversationAction[]}>(`/api/conversations/${conversationId}/actions`);
      
      set({ 
        actions: response.data,
        isLoading: false 
      });
      
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch conversation actions', 
        isLoading: false 
      });
      return [];
    }
  },
  
  fetchAction: async (actionId) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiService.get<{data: ConversationAction}>(`/api/actions/${actionId}`);
      
      const action = response.data;
      set({ currentAction: action, isLoading: false });
      
      return action;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch action', 
        isLoading: false 
      });
      return null;
    }
  },
  
  executeAction: async (conversationId, actionType, parameters) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiService.post<{data: ConversationAction}>(
        `/api/actions/${actionType}`,
        {
          conversationId,
          parameters
        }
      );
      
      const action = response.data;
      
      set((state) => ({ 
        actions: [action, ...state.actions],
        currentAction: action,
        isLoading: false 
      }));
      
      return action;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to execute action', 
        isLoading: false 
      });
      return null;
    }
  },
  
  updateActionStatus: async (actionId, status) => {
    try {
      set({ isLoading: true, error: null });
      
      await apiService.put(`/api/actions/${actionId}/status`, { status });
      
      // Update the action in the store
      set((state) => ({
        actions: state.actions.map(a => 
          a.id === actionId ? { ...a, status } : a
        ),
        currentAction: state.currentAction?.id === actionId 
          ? { ...state.currentAction, status } 
          : state.currentAction,
        isLoading: false
      }));
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update action status', 
        isLoading: false 
      });
      return false;
    }
  },
  
  deleteAction: async (actionId) => {
    try {
      set({ isLoading: true, error: null });
      
      await apiService.delete(`/api/actions/${actionId}`);
      
      // Remove the action from the store
      set((state) => ({
        actions: state.actions.filter(a => a.id !== actionId),
        currentAction: state.currentAction?.id === actionId ? null : state.currentAction,
        isLoading: false
      }));
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to delete action', 
        isLoading: false 
      });
      return false;
    }
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearActions: () => set({ actions: [], currentAction: null }),
  setCurrentAction: (action) => set({ currentAction: action })
}));