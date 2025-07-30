// types/conversation.ts 
export interface Conversation {
  id: string;
  title: string;
  projectId: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Optional expanded data
  messages: Message[];
  messageCount?: number;
  lastMessage?: string;
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
  webSearchResults?: string;
  isStreaming?: boolean;
  isLoading?: boolean;
  tempId?: string;
  metadata?: any;
  processingStatus?: string;
  actionType?: string;
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
