// Chat and messaging component types

import { Message } from '../conversations';

export interface ChatInputProps {
  onSendMessage: (content: string, files?: FileList) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  allowFileUpload?: boolean;
  maxFiles?: number;
  acceptedFileTypes?: string;
}

export interface MessageDisplayProps {
  message: Message;
  isUser?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

export interface ProcessingStatusProps {
  isProcessing: boolean;
  status: 'idle' | 'thinking' | 'generating' | 'complete';
  message?: string;
}

export interface CanvasProcessingStatusProps {
  isProcessing: boolean;
  status: string;
  progress?: number;
}

export interface CanvasStreamingOverlayProps {
  isVisible: boolean;
  status: string;
  onCancel?: () => void;
}

export interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: Message[];
  onMessageSent?: (message: Message) => void;
  height?: string;
  className?: string;
}

export interface ChatHistoryProps {
  messages: Message[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}