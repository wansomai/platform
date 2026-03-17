// src/store/chat.store.ts
import { create } from 'zustand'
import { apiService } from '@/lib/api'
import { Message, Conversation } from '@/types/conversations';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  requiresUpgrade?: boolean;

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
  fetchConversation: (projectId: string) => Promise<Conversation | null>;
  createConversation: (projectId: string, title?: string, aiAssociateId?: string) => Promise<Conversation | null>;
  sendMessage: (projectId: string, conversationId: string, content: string, userId: string | undefined, metadata: any, previewDocument?: any, currentCanvasHtml?: string, attachedDocuments?: Array<{ id: string, title: string, fileType: string, fileSize?: number, fileUrl?: string }>) => Promise<void>;
  removeAssociateFromConversation: (projectId: string, conversationId: string) => Promise<boolean>;
  assignAssociateToConversation: (projectId: string, conversationId: string, associateId: string) => Promise<boolean>;

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

    const currentMessages = state.currentConversation.messages || [];
    return {
      currentConversation: {
        ...state.currentConversation,
        messages: [...currentMessages, message],
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

  fetchConversation: async (projectId) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiService.get<{ data: Conversation }>(
        `/api/projects/${projectId}/conversations`
      );
      const conversation = response.data;

      // Check AFTER API call if we already have messages locally
      // This prevents overwriting locally-added messages during auto-send race condition
      const existingConversation = get().currentConversation;
      if (existingConversation?.projectId === projectId && existingConversation?.messages?.length > 0) {
        set({ isLoading: false });
        return existingConversation;
      }

      // If no conversation exists in DB, return null
      if (!conversation) {
        set({ currentConversation: null, isLoading: false });
        return null;
      }

      // Ensure messages array is always initialized
      const conversationWithMessages = {
        ...conversation,
        messages: conversation?.messages || []
      };
      set({ currentConversation: conversationWithMessages, isLoading: false });
      return conversationWithMessages;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch conversation',
        isLoading: false
      });
      return null;
    }
  },

  createConversation: async (projectId, title, aiAssociateId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.post<{ data: Conversation }>(
        `/api/projects/${projectId}/conversations`,
        {
          title: title || 'New Conversation',
          ...(aiAssociateId && { aiAssociateId })
        }
      );
      const newConversation = response.data;

      set((state) => ({
        conversations: [newConversation, ...state.conversations],
        currentConversation: newConversation,
        isLoading: false
      }));

      return newConversation;
    } catch (error: any) {
      // If this is a subscription limit error, throw it for the component to handle
      if (error.status === 403 && error.requiresUpgrade) {
        set({ isLoading: false });
        throw error;
      }
      set({
        error: error.message || 'Failed to create conversation',
        isLoading: false
      });
      return null;
    }
  },

  removeAssociateFromConversation: async (projectId, conversationId) => {
    try {
      set({ error: null });
      const response = await apiService.patch(
        `/api/projects/${projectId}/conversations/${conversationId}`,
        { aiAssociateId: null }
      );

      // Update the current conversation
      set((state) => {
        if (state.currentConversation?.id === conversationId) {
          return {
            currentConversation: {
              ...state.currentConversation,
              aiAssociateId: null,
              aiAssociate: undefined
            }
          };
        }
        return state;
      });

      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to remove associate' });
      return false;
    }
  },

  assignAssociateToConversation: async (projectId, conversationId, associateId) => {
    try {
      set({ error: null });
      const response = await apiService.patch<{ data: { aiAssociateId: string; aiAssociate?: any } }>(
        `/api/projects/${projectId}/conversations/${conversationId}`,
        { aiAssociateId: associateId }
      );

      // Update the current conversation
      set((state) => {
        if (state.currentConversation?.id === conversationId) {
          return {
            currentConversation: {
              ...state.currentConversation,
              aiAssociateId: response.data.aiAssociateId,
              aiAssociate: response.data.aiAssociate
            }
          };
        }
        return state;
      });

      return true;
    } catch (error: any) {
      // If this is a subscription limit error, throw it for the component to handle
      if (error.status === 403 && error.requiresUpgrade) {
        throw error;
      }
      set({ error: error.message || 'Failed to assign associate' });
      return false;
    }
  },

  sendMessage: async (projectId, conversationId, content, userId, metadata, previewDocument, currentCanvasHtml, attachedDocuments: Array<{ id: string, title: string, fileType: string, fileSize?: number, fileUrl?: string }> | undefined = undefined) => {
    const tempId = `temp-${Date.now()}`;
    const userMessage: Message = {
      id: tempId,
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
      ...(attachedDocuments && attachedDocuments.length > 0 && { attachedDocuments })
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
          streamingId,
          previewDocument,
          currentCanvasHtml,
          attachedDocuments
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
                conversationId,
                content: data.content,
                role: 'assistant',
                timestamp: new Date().toISOString(),
                references: data.references,
                webSearchSources: data.webSearchSources,
                report: data.report, // Include report metadata if present
                document: data.document, // Include inline document metadata if present
                metadata: data.report || data.document
                  ? {
                    ...(data.report && { report: data.report }),
                    ...(data.document && { document: data.document })
                  }
                  : undefined,
                isStreaming: false
              });
              break;

            case 'canvas_status':
              // Handle canvas processing status updates
              get().updateStreamingMessage(streamingId, {
                processingStatus: data.status,
                canvasMessage: data.message
              });
              break;

            case 'canvas_content_update':
              // Handle real-time canvas content updates
              window.dispatchEvent(new CustomEvent('canvasContentUpdate', {
                detail: {
                  projectId,
                  partialContent: data.partialContent,
                  currentSection: data.currentSection,
                  actionType: data.actionType
                }
              }));
              break;

            case 'canvas_update':
              // Handle canvas updates - finalize the chat message and trigger canvas refresh
              get().finalizeStreamingMessage(streamingId, {
                id: data.messageId || `canvas-${Date.now()}`,
                conversationId,
                content: data.content,
                role: 'assistant',
                timestamp: new Date().toISOString(),
                isStreaming: false,
                canvasUpdated: true,
                actionType: data.actionType
              });

              // Trigger canvas refresh event with project context
              window.dispatchEvent(new CustomEvent('canvasUpdate', {
                detail: {
                  projectId,
                  canvasContent: data.canvasContent,
                  messageContent: data.content,
                  actionType: data.actionType
                }
              }));
              break;

            case 'canvas_suggestion':
              // Finalize chat message and dispatch suggestion event for diff overlay
              get().finalizeStreamingMessage(streamingId, {
                id: data.messageId || `suggestion-${Date.now()}`,
                conversationId,
                content: data.content,
                role: 'assistant',
                timestamp: new Date().toISOString(),
                isStreaming: false,
                canvasUpdated: false,
                actionType: data.actionType,
                isSuggestion: true
              });

              window.dispatchEvent(new CustomEvent('canvasSuggestion', {
                detail: {
                  projectId,
                  suggestedHtml: data.suggestedHtml,
                  originalHtml: data.originalHtml,
                  changeDescription: data.changeDescription
                }
              }));
              break;

            case 'status':
              get().updateStreamingMessage(streamingId, {
                processingStatus: data.status,
                statusMessage: data.statusMessage || data.message
              });
              break;

            case 'error':
              // Update the streaming message to show the error
              get().updateStreamingMessage(streamingId, {
                content: `Error: ${data.error}`,
                isStreaming: false,
                isLoading: false
              });
              set({ error: data.error });
              throw new Error(data.error);
          }
        },
        (error) => {
          const errorMessage = error.message || 'Failed to send message';

          // Check if this is a subscription limit error
          if (error.status === 403 && error.requiresUpgrade) {
            // Remove the streaming message — the upgrade modal will handle UX
            get().deleteMessage(streamingId);
            set({ error: errorMessage, requiresUpgrade: true });
            throw error; // Re-throw so component can handle it
          } else {
            // Update the streaming message to show the error
            get().updateStreamingMessage(streamingId, {
              content: `Error: ${errorMessage}`,
              isStreaming: false,
              isLoading: false
            });
            set({ error: errorMessage });
          }
        }
      );

    } catch (error: any) {
      // Error message already displayed in the streaming message
      // Just set the error state for the UI error display
      const isUpgradeRequired = error.status === 403 && error.requiresUpgrade;

      set({
        error: error.message || 'Failed to send message',
        requiresUpgrade: isUpgradeRequired
      });

      // Re-throw subscription errors so components can handle them
      if (isUpgradeRequired) {
        throw error;
      }
    }
  },

  // State management
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}))