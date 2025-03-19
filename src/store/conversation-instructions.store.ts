// src/store/conversation-instructions.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';

interface ConversationInstructionsState {
  instructions: string;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  fetchInstructions: (conversationId: string) => Promise<string>;
  saveInstructions: (conversationId: string, instructions: string) => Promise<boolean>;
  setInstructions: (instructions: string) => void;
}

export const useConversationInstructionsStore = create<ConversationInstructionsState>((set) => ({
  instructions: '',
  isLoading: false,
  error: null,
  
  fetchInstructions: async (conversationId) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiService.get<{data: {instructions: string}}>(`/api/conversations/${conversationId}/instructions`);
      
      set({ 
        instructions: response.data.instructions,
        isLoading: false 
      });
      
      return response.data.instructions;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch conversation instructions', 
        isLoading: false 
      });
      return '';
    }
  },
  
  saveInstructions: async (conversationId, instructions) => {
    try {
      set({ isLoading: true, error: null });
      
      await apiService.put(`/api/conversations/${conversationId}/instructions`, {
        instructions
      });
      
      set({ instructions, isLoading: false });
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to save instructions', 
        isLoading: false 
      });
      return false;
    }
  },
  
  setInstructions: (instructions) => {
    set({ instructions });
  }
}));