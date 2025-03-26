// src/store/chat.store.ts
import { create } from 'zustand'
import {  apiService } from '@/lib/api'

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
}
export interface Reference {
  id: string;
  documentId: string;
  documentName: string;
  text: string;
  page?: number;
}

export interface Conversation {
  id: string;
  title: string;
  projectId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  
  // Conversation management
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, data: Partial<Conversation>) => void;
  deleteConversation: (conversationId: string) => void;
  clearConversations: () => void;
  
  // Message management
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  
  // API interactions
  fetchConversations: (projectId: string) => Promise<Conversation[]>;
  fetchConversation: (projectId: string, conversationId: string) => Promise<Conversation | null>;
  createConversation: (projectId: string, title?: string) => Promise<Conversation | null>;
  sendMessage: (projectId: string, conversationId: string, content: string,userId:string|undefined,metadata: any) => Promise<Message | null>;
  togglePinConversation: (projectId: string, conversationId: string) => Promise<boolean>;

  // State management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoading: false,
  error: null,
  
  // Basic state setters
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  addConversation: (conversation) => set((state) => ({ 
    conversations: [conversation, ...state.conversations] 
  })),
  updateConversation: (conversationId, data) => set((state) => ({
    conversations: state.conversations.map((conv) => 
      conv.id === conversationId ? { ...conv, ...data } : conv
    ),
    currentConversation: state.currentConversation?.id === conversationId 
      ? { ...state.currentConversation, ...data }
      : state.currentConversation
  })),
  deleteConversation: (conversationId) => set((state) => ({
    conversations: state.conversations.filter((conv) => conv.id !== conversationId),
    currentConversation: state.currentConversation?.id === conversationId 
      ? null 
      : state.currentConversation
  })),
  clearConversations: () => set({ conversations: [], currentConversation: null }),
  
  // Message management
  addMessage: (message) => set((state) => {
    if (!state.currentConversation) return state;
    
    return {
      currentConversation: {
        ...state.currentConversation,
        messages: [...state.currentConversation.messages, message],
        updatedAt: new Date().toISOString()
      }
    };
  }),
  updateMessage: (messageId, content) => set((state) => {
    if (!state.currentConversation) return state;
    
    return {
      currentConversation: {
        ...state.currentConversation,
        messages: state.currentConversation.messages.map((msg) =>
          msg.id === messageId ? { ...msg, content } : msg
        )
      }
    };
  }),
  deleteMessage: (messageId) => set((state) => {
    if (!state.currentConversation) return state;
    
    return {
      currentConversation: {
        ...state.currentConversation,
        messages: state.currentConversation.messages.filter((msg) => msg.id !== messageId)
      }
    };
  }),
  
  // API interactions
  fetchConversations: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.get<{ data: Conversation[] }>(`/api/projects/${projectId}/conversations`);
      set({ conversations: response.data, isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch conversations', 
        isLoading: false 
      });
      return [];
    }
  },
  
  fetchConversation: async (projectId, conversationId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.get<{ data: Conversation }>(
        `/api/projects/${projectId}/conversations/${conversationId}`
      );
      const conversation = response.data;
      set({ currentConversation: conversation, isLoading: false });
      return conversation;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch conversation', 
        isLoading: false 
      });
      return null;
    }
  },
  
  createConversation: async (projectId, title) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.post<{ data: Conversation }>(
        `/api/projects/${projectId}/conversations`,
        { title: title || 'New Conversation' }
      );
      const newConversation = response.data;
      
      set((state) => ({ 
        conversations: [newConversation, ...state.conversations],
        currentConversation: newConversation,
        isLoading: false
      }));
      
      return newConversation;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to create conversation', 
        isLoading: false 
      });
      return null;
    }
  },
  
  sendMessage: async (projectId, conversationId, content, userId, metadata) => {
    // First add an optimistic user message
    const tempId = `temp-${Date.now()}`;
    const userMessage: Message = {
      id: tempId,
      content,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    get().addMessage(userMessage);
    
    // Add a loading placeholder for the assistant response
    const loadingId = `loading-${Date.now()}`;
    const loadingMessage: Message = {
      id: loadingId,
      content: '...',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      isLoading: true
    };
    
    get().addMessage(loadingMessage);
    
    try {
      set({ error: null });
      const response = await apiService.post<{ data: Message }>(
        `/api/projects/${projectId}/conversations/${conversationId}/messages`,
        { 
          content,
          userId,
          metadata // Include metadata in the request
        }
      );
      
      // Replace loading message with actual response
      set((state) => {
        if (!state.currentConversation) return state;
        
        return {
          currentConversation: {
            ...state.currentConversation,
            messages: state.currentConversation.messages.map((msg) =>
              msg.id === loadingId ? response.data : msg
            )
          }
        };
      });
      
      return response.data;
    } catch (error: any) {
      // Remove loading message and show error
      set((state) => {
        if (!state.currentConversation) return state;
        
        return {
          currentConversation: {
            ...state.currentConversation,
            messages: state.currentConversation.messages.filter(
              (msg) => msg.id !== loadingId
            )
          },
          error: error.message || 'Failed to send message'
        };
      });
      
      return null;
    }
  },
  
  togglePinConversation: async (projectId, conversationId) => {
    const conversation = get().conversations.find(c => c.id === conversationId);
    if (!conversation) return false;
    
    const newPinState = !conversation.isPinned;
    
    try {
      await apiService.put(
        `/api/projects/${projectId}/conversations/${conversationId}/pin`,
        { isPinned: newPinState }
      );
      
      get().updateConversation(conversationId, { isPinned: newPinState });
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update pin status' });
      return false;
    }
  },
  
  // State management
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}))