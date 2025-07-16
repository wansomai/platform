// types/conversation.ts 
export interface Conversation {
  id: string;
  title: string;
  projectId: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Optional expanded data
  messages?: Message[];
  messageCount?: number;
  lastMessage?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
  
  // Optional data
  references?: MessageReference[];
  webSearchResults?: string;
  isStreaming?: boolean;
  tempId?: string;
  processingStatus?: string;
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
