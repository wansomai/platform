// types/conversation.ts
export interface Conversation {
  id: string;
  title: string;
  projectId: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  aiAssociateId?: string | null;

  // Optional expanded data
  messages: Message[];
  messageCount?: number;
  lastMessage?: string;
  aiAssociate?: {
    id: string;
    name: string;
    description?: string;
  };

}

export interface Message {
  id: string;
  conversationId?: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  userId?: string;
  // Optional data
  references?: MessageReference[];
  webSearchSources?: Array<{title: string, uri: string}>;
  report?: {
    reportId: string;
    reportTitle: string;
    documentName: string;
    reviewFocus: string;
    briefSummary: string;
    downloadUrls: {
      word: string;
    };
  };
  isStreaming?: boolean;
  isLoading?: boolean;
  tempId?: string;
  metadata?: any;
  processingStatus?: string;
  actionType?: string;
  canvasUpdated?: boolean;
  canvasMessage?: string; // Message for canvas processing status
  user?: {
    id: string;
    name: string;
    email: string;
  };
}
export interface MessageReference {
  id: string;
  messageId: string;
  documentId: string;
  documentName: string;
  text: string;
  page?: number;
}
