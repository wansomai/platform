// src/store/conversation-settings.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';

export interface ConversationSettings {
  citeSources: boolean;
  suggestActions: boolean;
  webSearch: boolean;
  model?: string;
  temperature?: number;
}

// Default settings for new conversations
export const DEFAULT_SETTINGS: ConversationSettings = {
  citeSources: true,
  suggestActions: true,
  webSearch: false,
  model: 'gpt-3.5-turbo',
  temperature: 0.7
};

interface ConversationSettingsState {
  settings: ConversationSettings;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  fetchSettings: (conversationId: string) => Promise<ConversationSettings>;
  saveSettings: (conversationId: string, settings: ConversationSettings) => Promise<boolean>;
  updateSetting: <K extends keyof ConversationSettings>(
    conversationId: string, 
    key: K, 
    value: ConversationSettings[K]
  ) => Promise<boolean>;
  setSettings: (settings: ConversationSettings) => void;
}

export const useConversationSettingsStore = create<ConversationSettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,
  
  fetchSettings: async (conversationId) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiService.get<{data: {settings: ConversationSettings}}>(
        `/api/conversations/${conversationId}/settings`
      );
      
      // If no settings are found, use defaults
      const settings = response.data.settings || DEFAULT_SETTINGS;
      
      set({ 
        settings,
        isLoading: false 
      });
      
      return settings;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch conversation settings', 
        isLoading: false,
        // Keep defaults if fetch fails
        settings: DEFAULT_SETTINGS
      });
      return DEFAULT_SETTINGS;
    }
  },
  
  saveSettings: async (conversationId, settings) => {
    try {
      set({ isLoading: true, error: null });
      
      await apiService.put(`/api/conversations/${conversationId}/settings`, {
        settings
      });
      
      set({ settings, isLoading: false });
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to save settings', 
        isLoading: false 
      });
      return false;
    }
  },
  
  updateSetting: async (conversationId, key, value) => {
    try {
      set({ isLoading: true, error: null });
      
      const currentSettings = { ...get().settings };
      currentSettings[key] = value;
      
      await apiService.put(`/api/conversations/${conversationId}/settings`, {
        settings: currentSettings
      });
      
      set({ settings: currentSettings, isLoading: false });
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || `Failed to update ${String(key)} setting`, 
        isLoading: false 
      });
      return false;
    }
  },
  
  setSettings: (settings) => {
    set({ settings });
  }
}));