// src/store/chat.store.ts
import { create } from 'zustand'
import { apiService } from '@/lib/api'

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  references?: Reference[];
  webSearchResults?: string; 
  actionType?: string;
  isLoading?: boolean;
  metadata?: any;
  isStreaming?: boolean;
  tempId?: string;
  processingStatus?: string;
}

export interface Reference {
  id: string;
  documentId: string;
  documentName: string;
  text: string;
  page?: number;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Message management
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, content: string) => void;
  updateStreamingMessage: (tempId: string, updates: Partial<Message>) => void;
  finalizeStreamingMessage: (tempId: string, finalMessage: Message) => void;
  deleteMessage: (messageId: string) => void;
  clearMessages: () => void;
  
  // API interactions (simplified to project-based)
  fetchProjectMessages: (projectId: string) => Promise<Message[]>;
  sendMessage: (projectId: string, content: string, metadata?: any) => Promise<void>;
  
  // State management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  
  // Basic state setters
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message]
  })),
  updateMessage: (messageId, content) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === messageId ? { ...msg, content } : msg
    )
  })),
  updateStreamingMessage: (tempId, updates) => set((state) => ({
    messages: state.messages.map((msg) => {
      if (msg.tempId === tempId || msg.id === tempId) {
        return { ...msg, ...updates };
      }
      return msg;
    })
  })),
  finalizeStreamingMessage: (tempId, finalMessage) => set((state) => ({
    messages: state.messages.map((msg) => {
      if (msg.tempId === tempId || msg.id === tempId) {
        return { ...finalMessage, isStreaming: false, tempId: undefined };
      }
      return msg;
    })
  })),
  deleteMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((msg) => msg.id !== messageId)
  })),
  clearMessages: () => set({ messages: [], error: null }),
  
  // API interactions - simplified to project-based
  fetchProjectMessages: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.get<{ data: Message[] }>(`/api/projects/${projectId}/messages`);
      const messages = response.data;
      set({ messages, isLoading: false });
      return messages;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch messages', 
        isLoading: false 
      });
      return [];
    }
  },
  
  sendMessage: async (projectId, content, metadata = {}) => {
    try {
      set({ isLoading: true, error: null });
      
      // Add user message immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        metadata
      };
      
      get().addMessage(userMessage);
      
      // Send to API
      const response = await apiService.post<{ data: Message }>(`/api/projects/${projectId}/messages`, {
        content,
        metadata
      });
      
      // Add assistant response
      if (response.data) {
        get().addMessage(response.data);
      }
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to send message', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));