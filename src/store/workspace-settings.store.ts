// src/store/workspace-settings.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';
import { Jurisdiction } from '@/types';
import { ProjectSettings } from '@/types';

interface ProjectSettingsState {
  settings: ProjectSettings;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  fetchSettings: (projectId: string) => Promise<ProjectSettings>;
  updateSettings: (projectId: string, settings: Partial<ProjectSettings>) => Promise<boolean>;
  updateSetting: <K extends keyof ProjectSettings>(
    projectId: string, 
    key: K, 
    value: ProjectSettings[K]
  ) => Promise<boolean>;
  setJurisdiction: (projectId: string, jurisdiction: Jurisdiction | null) => Promise<boolean>;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: ProjectSettings = {
  citeSources: true,
  suggestActions: true,
  webSearch: false,
  legalDrafting: false,
  model: 'gpt-4',
  temperature: 0.7,
  jurisdiction: undefined
};

export const useProjectSettingsStore = create<ProjectSettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,
  
  fetchSettings: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      
      // Updated to use project-level endpoint
      const response = await apiService.get<{data: {settings: ProjectSettings}}>(`/api/projects/${projectId}/settings`);
      
      const settings = {
        ...DEFAULT_SETTINGS,
        ...response.data.settings
      };
      
      set({ 
        settings,
        isLoading: false 
      });
      
      return settings;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch project settings', 
        isLoading: false 
      });
      return DEFAULT_SETTINGS;
    }
  },
  
  updateSettings: async (projectId, newSettings) => {
    const currentSettings = get().settings;
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    try {
      set({ isLoading: true, error: null });
      
      // Updated to use project-level endpoint
      await apiService.put(`/api/projects/${projectId}/settings`, {
        settings: updatedSettings
      });
      
      set({ 
        settings: updatedSettings,
        isLoading: false 
      });
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update project settings', 
        isLoading: false 
      });
      return false;
    }
  },
  
  updateSetting: async (projectId, key, value) => {
    return get().updateSettings(projectId, { [key]: value });
  },
  
  setJurisdiction: async (projectId, jurisdiction) => {
    const jurisdictionData = jurisdiction ? {
      id: jurisdiction.id,
      name: jurisdiction.name,
      country: jurisdiction.country,
      state: jurisdiction.state,
      legalSystem: jurisdiction.legalSystem,
      citationStyle: jurisdiction.citationStyle
    } : undefined;
    return get().updateSettings(projectId, { jurisdiction: jurisdictionData});
  },
  
  resetSettings: () => set({ settings: DEFAULT_SETTINGS, error: null }),
}));