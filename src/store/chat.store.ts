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
  isStreaming?: boolean; // streaming flag
  tempId?: string; //temporary ID for streaming messages
  processingStatus?: string; //current processing stage
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
  clearCurrentConversation: () => void;
  // Message management
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, content: string) => void;
  updateStreamingMessage: (tempId: string, updates: Partial<Message>) => void;
  finalizeStreamingMessage: (tempId: string, finalMessage: Message) => void;
  deleteMessage: (messageId: string) => void;
  
  // API interactions
  fetchConversations: (projectId: string) => Promise<Conversation[]>;
  fetchConversation: (projectId: string, conversationId: string) => Promise<Conversation | null>;
  createConversation: (projectId: string, title?: string) => Promise<Conversation | null>;
  sendMessage: (projectId: string, conversationId: string, content: string, userId: string | undefined, metadata: any) => Promise<void>;
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
  clearCurrentConversation: () => {
    set({
      currentConversation: null,
      isLoading: false,
      error: null
    });
  },
  
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
  updateStreamingMessage: (tempId, updates) => set((state) => {
    if (!state.currentConversation) return state;
    
    const updatedMessages = state.currentConversation.messages.map((msg) => {
      if (msg.tempId === tempId || msg.id === tempId) {
        const updatedMessage = { ...msg, ...updates };
        return updatedMessage;
      }
      return msg;
    });
    
    return {
      currentConversation: {
        ...state.currentConversation,
        messages: updatedMessages
      }
    };
  }),
  
  finalizeStreamingMessage: (tempId, finalMessage) => set((state) => {
    if (!state.currentConversation) return state;
    
    const updatedMessages = state.currentConversation.messages.map((msg) => {
      if (msg.tempId === tempId || msg.id === tempId) {
        return { ...finalMessage, isStreaming: false, tempId: undefined };
      }
      return msg;
    });
    
    return {
      currentConversation: {
        ...state.currentConversation,
        messages: updatedMessages
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
    const tempId = `temp-${Date.now()}`;
    const userMessage: Message = {
      id: tempId,
      content,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    get().addMessage(userMessage);
    
    const streamingId = `streaming-${Date.now()}`;
    const streamingMessage: Message = {
      id: streamingId,
      tempId: streamingId,
      content: '',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      isStreaming: true
    };
    
    get().addMessage(streamingMessage);
    
    try {
      set({ error: null });
      
      await apiService.postStream(
        `/api/projects/${projectId}/conversations/${conversationId}/messages`,
        { 
          content,
          metadata,
          streamingId 
        },
        (data) => {
          switch (data.type) {
            case 'delta':
              const targetId = data.messageId || streamingId;
              const currentMessage = get().currentConversation?.messages.find(
                m => m.tempId === targetId || m.id === targetId || m.tempId === streamingId || m.id === streamingId
              );
              
              get().updateStreamingMessage(streamingId, {
                content: (currentMessage?.content || '') + data.content
              });
              break;
              
            case 'final':
              get().finalizeStreamingMessage(streamingId, {
                id: data.messageId,
                content: data.content,
                role: 'assistant',
                timestamp: new Date().toISOString(),
                references: data.references,
                webSearchResults: data.webSearchResults,
                isStreaming: false
              });
              break;
              
            case 'status':
              break;
              
            case 'error':
              throw new Error(data.error);
          }
        },
        (error) => {
          set({ error: error.message || 'Failed to send message' });
        }
      );
      
    } catch (error: any) {
      set((state) => {
        if (!state.currentConversation) return state;
        
        return {
          currentConversation: {
            ...state.currentConversation,
            messages: state.currentConversation.messages.filter(
              (msg) => msg.id !== streamingId && msg.tempId !== streamingId
            )
          },
          error: error.message || 'Failed to send message'
        };
      });
    }
  },
  // Toggle pin status of a conversation
  
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