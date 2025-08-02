// src/store/workspace-instructions.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';

interface ProjectInstructionsState {
  instructions: string;
  isLoading: boolean;
  error: string | null; 
  // Methods
  fetchInstructions: (projectId: string) => Promise<string>;
  saveInstructions: (projectId: string, instructions: string) => Promise<boolean>;
  setInstructions: (instructions: string) => void;
}

export const useProjectInstructionsStore = create<ProjectInstructionsState>((set) => ({
  instructions: '',
  isLoading: false,
  error: null,
  
  fetchInstructions: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      
      // Updated to use project-level endpoint
      const response = await apiService.get<{data: {instructions: string}}>(`/api/projects/${projectId}/instructions`);
      
      set({ 
        instructions: response.data.instructions,
        isLoading: false 
      });
      
      return response.data.instructions;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch project instructions', 
        isLoading: false 
      });
      return '';
    }
  },
  
  saveInstructions: async (projectId, instructions) => {
    try {
      set({ isLoading: true, error: null });
      
      // Updated to use project-level endpoint
      await apiService.put(`/api/projects/${projectId}/instructions`, {
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