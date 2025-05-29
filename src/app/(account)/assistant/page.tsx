// app/dashboard/assistant/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Send,
  Loader2,
  Copy,
  Sparkles,
  FileText,
  Trash2,
  RefreshCw,
  XCircle,
  HelpCircle,
  MessageSquare,
  Paperclip,
  Save,
  ChevronDown,
  ChevronRight,
  StopCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import MessageDisplay from "@/components/chat/MessageDisplay";
import LogoAnimation from "@/components/commons/LogoAnimation";

// Define message types
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isLoading?: boolean;
  messageId?: string;
}

// Define conversation type
interface Conversation {
  threadId: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

// Define suggestion prompts
const suggestionPrompts = [
  {
    title: "Draft an email",
    prompt: "Draft a professional email to a client about a project delay of 2 weeks due to technical issues."
  },
  {
    title: "Summarize document",
    prompt: "Could you help me summarize this document? I'll upload it and need a short executive summary."
  },
  {
    title: "Legal research",
    prompt: "What are the key legal precedents for copyright infringement in digital media?"
  },
  {
    title: "Draft contract clause",
    prompt: "Write a non-disclosure agreement clause that covers both parties for a period of 3 years."
  }
];

// Local storage key for saving conversations
const STORAGE_KEY = 'assistant-conversations';

// Process the streaming response from the API
const processStreamResponse = async (
  response: Response, 
  assistantMessageId: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setCurrentAssistantMessage: React.Dispatch<React.SetStateAction<Message | null>>,
  setThreadId: React.Dispatch<React.SetStateAction<string | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error connecting to assistant');
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let responseContent = '';
  let currentMessageId = '';
  let currentThreadId = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        try {
          const event = JSON.parse(line);

          if (event.type === 'delta') {
            responseContent += event.content || '';
            currentMessageId = event.messageId || currentMessageId;
            currentThreadId = event.threadId || currentThreadId;

            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: responseContent,
                      isLoading: true,
                      messageId: currentMessageId
                    }
                  : msg
              )
            );
          } 
          else if (event.type === 'status') {
            if (event.threadId && !currentThreadId) {
              currentThreadId = event.threadId;
              setThreadId(currentThreadId);
            }

            if (event.status === 'completed') {
              setMessages(prevMessages =>
                prevMessages.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: responseContent,
                        isLoading: false,
                        messageId: currentMessageId
                      }
                    : msg
                )
              );
              setIsLoading(false);
              setCurrentAssistantMessage(null);
            }
          }
          else if (event.type === 'error') {
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: responseContent + `\n\nError: ${event.error}`,
                      isLoading: false
                    }
                  : msg
              )
            );
            throw new Error(event.error || 'Unknown error in stream');
          }
        } catch (err) {
          console.error('Error parsing stream event:', err);
        }
      }
    }

    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: responseContent,
              isLoading: false,
              messageId: currentMessageId
            }
          : msg
      )
    );

    if (currentThreadId) {
      setThreadId(currentThreadId);
    }

    return { content: responseContent, messageId: currentMessageId, threadId: currentThreadId };
  } catch (error) {
    throw error;
  } finally {
    setIsLoading(false);
    setCurrentAssistantMessage(null);
  }
};

export default function AssistantPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamControllerRef = useRef<AbortController | null>(null);
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [showConversationsDialog, setShowConversationsDialog] = useState(false);
  const [conversationTitle, setConversationTitle] = useState<string>("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState<Message | null>(null);
  
  // Load saved conversations from local storage
  useEffect(() => {
    const savedConversations = localStorage.getItem(STORAGE_KEY);
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        // Convert timestamp strings back to Date objects
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          lastUpdated: new Date(conv.lastUpdated),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(conversationsWithDates);
      } catch (e) {
        console.error("Error parsing saved conversations", e);
      }
    }
  }, []);
  
  // Initialize with welcome message for new conversations
  useEffect(() => {
    if (!threadId && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          content: "Hello! I'm your AI assistant. How can I help you today?",
          role: "assistant",
          timestamp: new Date()
        }
      ]);
    }
  }, [threadId, messages]);
  
  // Auto-scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Auto-adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);
  
  // Save conversations to local storage when they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);
  
  // Clean up controller on unmount
  useEffect(() => {
    return () => {
      if (streamControllerRef.current) {
        streamControllerRef.current.abort();
      }
    };
  }, []);
  
  // Handle loading a conversation
  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.threadId === conversationId);
    if (conversation) {
      setMessages(conversation.messages);
      setThreadId(conversation.threadId);
      setActiveConversation(conversation.threadId);
      setShowConversationsDialog(false);
    }
  };
  
  // Handle saving a conversation
  const saveConversation = () => {
    if (!threadId || !conversationTitle.trim()) return;
    
    const existingIndex = conversations.findIndex(c => c.threadId === threadId);
    const newConversation: Conversation = {
      threadId,
      title: conversationTitle.trim(),
      messages,
      lastUpdated: new Date()
    };
    
    if (existingIndex >= 0) {
      // Update existing conversation
      const updatedConversations = [...conversations];
      updatedConversations[existingIndex] = newConversation;
      setConversations(updatedConversations);
    } else {
      // Add new conversation
      setConversations([...conversations, newConversation]);
    }
    
    setActiveConversation(threadId);
    setShowSaveDialog(false);
  };
  
  // Handle deleting a conversation
  const deleteConversation = (conversationId: string) => {
    setConversations(conversations.filter(c => c.threadId !== conversationId));
    if (activeConversation === conversationId) {
      clearChat();
    }
  };
  
  // Stop the current stream
  const stopStreamingResponse = () => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
      
      // Mark the current message as no longer loading
      if (currentAssistantMessage) {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === currentAssistantMessage.id
              ? { ...msg, isLoading: false }
              : msg
          )
        );
        setCurrentAssistantMessage(null);
      }
      
      setIsLoading(false);
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;
    
    const messageContent = input.trim();
    setInput("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    // Create a unique ID for the message
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;
    
    // Add user message to the chat
    const userMessage: Message = {
      id: userMessageId,
      content: messageContent,
      role: "user",
      timestamp: new Date()
    };
    
    // Add assistant loading message
    const loadingMessage: Message = {
      id: assistantMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isLoading: true
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage, loadingMessage]);
    setCurrentAssistantMessage(loadingMessage);
    setIsLoading(true);
    
    try {
      // Cancel any existing streams
      if (streamControllerRef.current) {
        streamControllerRef.current.abort();
      }
      
      // Create a new AbortController
      streamControllerRef.current = new AbortController();
      
      // Prepare form data
      const formData = new FormData();
      formData.append('message', messageContent);
      
      // Add threadId if we have one (continuing conversation)
      if (threadId) {
        formData.append('threadId', threadId);
      }
      
      // Append all files
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // Set up fetch options with the AbortController
      const fetchOptions = {
        method: 'POST',
        body: formData,
        signal: streamControllerRef.current.signal
      };
      
      const response = await fetch('/api/assistant', fetchOptions);
      
      // Process the streaming response
      await processStreamResponse(
        response,
        assistantMessageId,
        setMessages,
        setCurrentAssistantMessage,
        setThreadId,
        setIsLoading
      );
      
      // If this is an active saved conversation, update it
      if (activeConversation) {
        // We need to get the updated messages
        const updatedMessages = messages.filter(m => !m.isLoading).concat([
          userMessage,
          {
            ...loadingMessage,
            isLoading: false,
            content: messages.find(m => m.id === assistantMessageId)?.content || ''
          }
        ]);
        
        setConversations(prevConversations =>
          prevConversations.map(conv =>
            conv.threadId === activeConversation
              ? {
                  ...conv,
                  messages: updatedMessages,
                  lastUpdated: new Date()
                }
              : conv
          )
        );
      }
      
      // Suggest saving the conversation after first message exchange
      if (threadId && !activeConversation) {
        // Auto-generate a title from the first user message
        const suggestedTitle = messageContent.length > 30
          ? `${messageContent.substring(0, 30)}...`
          : messageContent;
        setConversationTitle(suggestedTitle);
        setTimeout(() => setShowSaveDialog(true), 1000);
      }
      
      // Clear uploaded files after sending
      setUploadedFiles([]);
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
      } else {
        
        // Replace loading message with error
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "Sorry, I encountered an error processing your request. Please try again.",
                  isLoading: false
                }
              : msg
          )
        );
        
        setError(error instanceof Error ? error.message : "Failed to get a response from the assistant.");
      }
    } finally {
      setIsLoading(false);
      setCurrentAssistantMessage(null);
      streamControllerRef.current = null;
    }
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Convert FileList to array and add to uploaded files
    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    // Close the dialog
    setShowUploadDialog(false);
  };
  
  // Remove an uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  };
  
  // Copy message content to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };
  
  // Clear chat history and start new conversation
  const clearChat = () => {
    // Stop any ongoing stream
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    
    setMessages([
      {
        id: "welcome",
        content: "Hello! I'm your AI assistant. How can I help you today?",
        role: "assistant",
        timestamp: new Date()
      }
    ]);
    setUploadedFiles([]);
    setThreadId(null);
    setActiveConversation(null);
    setConversationTitle("");
    setIsLoading(false);
    setCurrentAssistantMessage(null);
  };
  
  // Use a suggestion prompt
  const useSuggestion = (prompt: string) => {
    setInput(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="h-full max-w-4xl mx-auto flex flex-col">
      {/* Messages container - Full height without header */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%] ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mt-1 flex-shrink-0">
                  {message.role === "user" ? (
                    <AvatarImage src={session?.user?.image || undefined} alt="You"/>
                  ) : (
                    <AvatarImage src="/avatars/ai-avatar.png" alt="AI"  />
                  )}
                  <AvatarFallback className="text-xs sm:text-sm">
                    {message.role === "user" ? (session?.user?.name?.charAt(0) || "U") : "AI"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-1 text-xs sm:text-sm">
                    <span className="font-medium">
                      {message.role === "user" ? "You" : "AI Assistant"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div
                    className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-100 border"
                    }`}
                  >
                    {message.isLoading && message.content.length === 0 ? (
                      <div className="flex items-center gap-2">
                        <LogoAnimation size="sm" className="text-gray-500" />
                        <span className="animate-pulse text-sm">Thinking...</span>
                      </div>
                    ) : (
                      <MessageDisplay 
                        content={message.content}
                        className={message.role === "user" ? "text-white" : ""}
                      />
                    )}
                  </div>
                  
                  {/* Message actions */}
                  {message.role === "assistant" && !message.isLoading && message.content && (
                    <div className="flex items-center gap-1 mt-1 sm:mt-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7"
                              onClick={() => copyToClipboard(message.content)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy to clipboard</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area at bottom - Compact with inline controls */}
      <div className="flex-none border-t bg-white">
        <div className="p-2 sm:p-4 max-w-3xl mx-auto">
          {error && (
            <div className="mb-2 p-2 rounded-lg bg-red-50 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Uploaded files display */}
          {uploadedFiles.length > 0 && (
            <div className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 mb-1 font-medium">Uploaded files:</p>
              <div className="flex flex-wrap gap-1">
                {uploadedFiles.map((file, index) => (
                  <Badge variant="outline" key={index} className="flex items-center gap-1 pl-2 pr-1 py-1 bg-white text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    <span className="truncate max-w-[100px] sm:max-w-[150px]">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 text-gray-500 hover:text-gray-700"
                      onClick={() => removeFile(index)}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Suggestion chips - Compact */}
          {showSuggestions && (
            <div className="mb-2 flex flex-wrap gap-1">
              {suggestionPrompts.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer px-2 py-1 text-primary-600 bg-primary-50 hover:bg-primary-100 text-xs transition-colors"
                  onClick={() => useSuggestion(suggestion.prompt)}
                >
                  {suggestion.title}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Input field with inline controls */}
          <div className="relative bg-white rounded-xl border-2 border-gray-200 focus-within:border-primary-300 transition-colors">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 resize-none min-h-[44px] max-h-[120px] pr-32 sm:pr-40 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              disabled={isLoading}
            />
            
            {/* Inline controls in input */}
            <div className="absolute right-1 bottom-1 flex items-center gap-1">
              {/* Chat controls - compact */}
              {threadId && !activeConversation && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowSaveDialog(true)}
                  className="h-7 w-7 text-gray-500 hover:text-gray-700"
                  title="Save Chat"
                >
                  <Save className="h-3 w-3" />
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowConversationsDialog(true)}
                className="h-7 w-7 text-gray-500 hover:text-gray-700"
                title="History"
              >
                <MessageSquare className="h-3 w-3" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearChat}
                className="h-7 w-7 text-gray-500 hover:text-gray-700"
                title="New Chat"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-gray-500 hover:text-gray-700"
                onClick={() => setShowSuggestions(!showSuggestions)}
                title="Quick prompts"
              >
                {showSuggestions ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>

              {/* Divider */}
              <div className="w-px h-4 bg-gray-300 mx-1" />
              
              {/* Main action buttons */}
              {isLoading && currentAssistantMessage ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:bg-red-50"
                  onClick={stopStreamingResponse}
                  title="Stop generating"
                >
                  <StopCircle className="h-3 w-3" />
                </Button>
              ) : null}
              
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                    title="Upload file"
                  >
                    <Paperclip className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Upload File</DialogTitle>
                    <DialogDescription>
                      Upload a file to provide context for the assistant.
                      Uploaded files are temporary and only used for this session.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="file" className="text-right">
                        File
                      </Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button 
                onClick={handleSendMessage} 
                size="icon" 
                className="h-7 w-7 rounded-lg bg-primary hover:bg-primary/90"
                disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                ) : (
                  <Send className="h-3 w-3 text-white" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="mt-1 text-xs text-gray-500 flex items-center justify-center">
            <HelpCircle className="h-3 w-3 mr-1" />
            <span className="text-center">
              Quick Assistant uses minimal context. For in-depth document analysis, 
              use workspace Conversations.
            </span>
          </div>
        </div>
      </div>
      
      {/* Save Conversation Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Conversation</DialogTitle>
            <DialogDescription>
              Give this conversation a name to save it for future reference.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="conversation-title" className="text-right">
                Title
              </Label>
              <Input
                id="conversation-title"
                value={conversationTitle}
                onChange={(e) => setConversationTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter a descriptive title..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveConversation} disabled={!conversationTitle.trim()}>
              Save Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Load Conversations Dialog */}
      <Dialog open={showConversationsDialog} onOpenChange={setShowConversationsDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your Conversations</DialogTitle>
            <DialogDescription>
              Select a previous conversation to continue or delete it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No saved conversations yet
              </div>
            ) : (
              <div className="space-y-2">
                {conversations
                  .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
                  .map((conversation) => (
                    <div 
                      key={conversation.threadId}
                      className="flex items-center justify-between p-3 rounded-md border hover:bg-gray-50 cursor-pointer"
                      onClick={() => loadConversation(conversation.threadId)}
                    >
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium truncate">{conversation.title}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(conversation.lastUpdated, { addSuffix: true })} · 
                          {conversation.messages.length} messages
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-red-600 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.threadId);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConversationsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}