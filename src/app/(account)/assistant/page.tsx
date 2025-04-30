// app/dashboard/assistant/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Send,
  Loader2,
  Copy,
  Sparkles,
  FileText,
  Trash2,
  RefreshCw,
  UploadCloud,
  XCircle,
  HelpCircle,
  MessageSquare,
  Paperclip,
  Save,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useChatStore } from "@/store/chat.store";
import { apiService } from "@/lib/api";
import MessageDisplay from "@/components/chat/MessageDisplay";

// Define message types
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isLoading?: boolean;
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

// Add this interface near the top of the file with other interfaces
interface AssistantResponse {
  threadId?: string;
  content?: string;
}

export default function AssistantPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
    setIsLoading(true);
    
    try {
      // Prepare form data if files are attached
      let formData: FormData = new FormData();
      
      formData.append('message', messageContent);
      
      // Add threadId if we have one (continuing conversation)
      if (threadId) {
        formData.append('threadId', threadId);
      }
      
      // Append all files
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // Send request to API
      const response = await apiService.postMultipart('/api/assistant', formData) as AssistantResponse;
      
      // Save the threadId from the response if we don't have one yet
      if (!threadId && response.threadId) {
        setThreadId(response.threadId);
        
        // Suggest saving the conversation after first message exchange
        if (!activeConversation) {
          // Auto-generate a title from the first user message
          const suggestedTitle = messageContent.length > 30
            ? `${messageContent.substring(0, 30)}...`
            : messageContent;
          setConversationTitle(suggestedTitle);
          setTimeout(() => setShowSaveDialog(true), 1000);
        }
      }
      
      // Update the loading message with the actual response
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: response.content || "",
                isLoading: false
              }
            : msg
        )
      );
      
      // If this is an active saved conversation, update it
      if (activeConversation) {
        const updatedMessages = [
          ...messages.filter(m => !m.isLoading),
          userMessage,
          {
            ...loadingMessage,
            content: response.content || "",
            isLoading: false
          }
        ];
        
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
      
      // Clear uploaded files after sending
      setUploadedFiles([]);
    } catch (error) {
      console.error("Error sending message:", error);
      
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
      
      setError("Failed to get a response from the assistant.");
    } finally {
      setIsLoading(false);
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
    <div className="container mx-auto p-2 sm:p-4 max-w-4xl h-full">
      <Card className="h-fit  flex flex-col">
        <CardContent className="flex-1 p-0 flex flex-col">
          {/* Header */}
          <div className="p-2 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-medium">
                {activeConversation 
                  ? conversations.find(c => c.threadId === activeConversation)?.title || "Quick Assistant"
                  : "Quick Assistant"}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Save conversation button */}
              {threadId && !activeConversation && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowSaveDialog(true)}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Chat
                </Button>
              )}
              
              {/* Load conversation button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowConversationsDialog(true)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Conversations</span>
                <span className="sm:hidden">Chats</span>
              </Button>
              
              {/* New chat button */}
              <Button variant="outline" size="sm" onClick={clearChat}>
                <RefreshCw className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">New Chat</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
          
          {/* Messages container */}
          <ScrollArea className="flex-1 p-2 sm:p-4 overflow-y-auto max-h-[calc(100vh-16rem)] sm:max-h-[calc(100vh-8rem)]">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                      {message.role === "user" ? (
                        <AvatarImage src={session?.user?.image || undefined} alt="You" />
                      ) : (
                        <AvatarImage src="/avatars/ai-avatar.png" alt="AI" />
                      )}
                      <AvatarFallback>
                        {message.role === "user" ? (session?.user?.name?.charAt(0) || "U") : "AI"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1 text-sm">
                        <span className="font-medium">
                          {message.role === "user" ? "You" : "AI Assistant"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div
                        className={`rounded-lg px-3 sm:px-4 py-2 ${
                          message.role === "user"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        {message.isLoading ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Thinking...</span>
                          </div>
                        ) : (
                          <MessageDisplay 
                            content={message.content}
                            className={message.role === "user" ? "text-white" : ""}
                          />
                        )}
                      </div>
                      
                      {/* Message actions */}
                      {message.role === "assistant" && !message.isLoading && (
                        <div className="flex items-center gap-1 mt-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => copyToClipboard(message.content)}
                                >
                                  <Copy className="h-4 w-4" />
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
          </ScrollArea>
          
          {/* Uploaded files display */}
          {uploadedFiles.length > 0 && (
            <div className="px-2 sm:px-4 py-2 border-t">
              <p className="text-sm text-gray-500 mb-2">Uploaded files:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <Badge variant="outline" key={index} className="flex items-center gap-1 pl-2 pr-1 py-1">
                    <FileText className="h-3 w-3 mr-1" />
                    <span className="truncate max-w-[100px] sm:max-w-[150px]">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 text-gray-500 hover:text-gray-700"
                      onClick={() => removeFile(index)}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Input area */}
          <div className="p-2 sm:p-4 border-t">
            {error && (
              <div className="mb-2 p-2 rounded-md bg-red-50 text-red-800 text-sm">
                {error}
              </div>
            )}
            
            {/* Suggestion chips with toggle button */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-sm">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-6" 
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  {showSuggestions ? (
                    <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1 text-gray-500" />
                  )}
                  <span className="text-gray-500 text-xs">Suggestions</span>
                </Button>
              </div>
            </div>
            
            {showSuggestions && (
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestionPrompts.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer px-2 sm:px-3 py-1 text-primary-600 bg-primary-50 hover:bg-primary-100 text-xs sm:text-sm"
                    onClick={() => useSuggestion(suggestion.prompt)}
                  >
                    {suggestion.title}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-24 min-h-[60px] max-h-[200px] resize-none"
                disabled={isLoading}
              />
              
              <div className="absolute right-2 bottom-2 flex gap-1">
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      disabled={isLoading}
                    >
                      <Paperclip className="h-4 w-4" />
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
                  className="h-8 w-8"
                  disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <HelpCircle className="h-3 w-3 mr-1" />
              <span>
                Quick Assistant uses minimal context. For in-depth document analysis, 
                use workspace Conversations.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
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