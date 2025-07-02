// src/store/conversation-settings.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';
import { Jurisdiction } from '@/lib/jurisdictions';

export interface ConversationSettings {
  citeSources: boolean;
  suggestActions: boolean;
  webSearch: boolean;
  legalDrafting: boolean;
  model?: string;
  temperature?: number;
  jurisdiction?: {
    id: string;
    name: string;
    country: string;
    state?: string;
    legalSystem: string;
    citationStyle: string;
  };
}

interface ConversationSettingsState {
  settings: ConversationSettings;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  fetchSettings: (conversationId: string) => Promise<ConversationSettings>;
  updateSettings: (conversationId: string, settings: Partial<ConversationSettings>) => Promise<boolean>;
  updateSetting: <K extends keyof ConversationSettings>(
    conversationId: string, 
    key: K, 
    value: ConversationSettings[K]
  ) => Promise<boolean>;
  setJurisdiction: (conversationId: string, jurisdiction: Jurisdiction | null) => Promise<boolean>;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: ConversationSettings = {
  citeSources: true,
  suggestActions: true,
  webSearch: false,
  legalDrafting: false,
  model: 'gpt-4',
  temperature: 0.7,
  jurisdiction: undefined
};

export const useConversationSettingsStore = create<ConversationSettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,
  
  fetchSettings: async (conversationId) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiService.get<{data: {settings: ConversationSettings}}>(`/api/conversations/${conversationId}/settings`);
      
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
        error: error.message || 'Failed to fetch conversation settings', 
        isLoading: false 
      });
      return DEFAULT_SETTINGS;
    }
  },
  
  updateSettings: async (conversationId, newSettings) => {
    const currentSettings = get().settings;
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    try {
      set({ isLoading: true, error: null });
      
      await apiService.put(`/api/conversations/${conversationId}/settings`, {
        settings: updatedSettings
      });
      
      set({ 
        settings: updatedSettings,
        isLoading: false 
      });
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update settings', 
        isLoading: false 
      });
      return false;
    }
  },
  
  updateSetting: async (conversationId, key, value) => {
    const currentSettings = get().settings;
    const updatedSettings = { ...currentSettings, [key]: value };
    
    try {
      set({ isLoading: true, error: null });
      
      await apiService.put(`/api/conversations/${conversationId}/settings`, {
        settings: updatedSettings
      });
      
      set({ 
        settings: updatedSettings,
        isLoading: false 
      });
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update setting', 
        isLoading: false 
      });
      return false;
    }
  },
  
  setJurisdiction: async (conversationId, jurisdiction) => {
    const currentSettings = get().settings;
    const jurisdictionData = jurisdiction ? {
      id: jurisdiction.id,
      name: jurisdiction.name,
      country: jurisdiction.country,
      state: jurisdiction.state,
      legalSystem: jurisdiction.legalSystem,
      citationStyle: jurisdiction.citationStyle
    } : undefined;
    
    const updatedSettings = { 
      ...currentSettings, 
      jurisdiction: jurisdictionData 
    };
    
    try {
      set({ isLoading: true, error: null });
      
      await apiService.put(`/api/conversations/${conversationId}/settings`, {
        settings: updatedSettings
      });
      
      set({ 
        settings: updatedSettings,
        isLoading: false 
      });
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update jurisdiction', 
        isLoading: false 
      });
      return false;
    }
  },
  
  resetSettings: () => {
    set({ settings: DEFAULT_SETTINGS, error: null });
  }
}));