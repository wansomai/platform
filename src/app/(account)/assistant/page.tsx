// app/dashboard/assistant/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Send,
  Loader2,
  MessageSquare,
  Copy,
  FileText,
  Zap,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Clock,
  MoreVertical,
  Download,
  Trash2,
  Info,
  FileSearch,
  BookOpen,
  AlignLeft,
  ListChecks,
  Search
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Define types
interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: string;
  references?: Reference[];
  isLoading?: boolean;
}

interface Reference {
  id: string;
  documentId: string;
  documentName: string;
  text: string;
  page?: number;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isPinned: boolean;
}

// Mock conversations
const mockConversations: Conversation[] = [
  {
    id: "conv1",
    title: "Contract analysis help",
    lastMessage: "I found 3 potential issues in the contract...",
    timestamp: "2025-03-15T14:30:00",
    isPinned: true
  },
  {
    id: "conv2",
    title: "Legal precedent search",
    lastMessage: "Here are the relevant cases I found...",
    timestamp: "2025-03-14T10:45:00",
    isPinned: false
  },
  {
    id: "conv3",
    title: "Document summarization",
    lastMessage: "I've analyzed the document and here's a summary...",
    timestamp: "2025-03-12T16:20:00",
    isPinned: true
  },
  {
    id: "conv4",
    title: "Compliance requirements",
    lastMessage: "The main compliance requirements for your industry are...",
    timestamp: "2025-03-10T09:15:00",
    isPinned: false
  }
];

// Mock messages for a conversation
const mockMessages: Message[] = [
  {
    id: "msg1",
    content: "Hello! I'm your AI legal assistant. How can I help you today?",
    role: "assistant",
    timestamp: "2025-03-15T14:25:00"
  },
  {
    id: "msg2",
    content: "I need help reviewing a contract. Can you help me identify any potential issues?",
    role: "user",
    timestamp: "2025-03-15T14:26:00"
  },
  {
    id: "msg3",
    content: "I'd be happy to help review your contract. Please upload the document or paste the relevant sections, and I'll analyze it for potential issues.",
    role: "assistant",
    timestamp: "2025-03-15T14:27:00"
  },
  {
    id: "msg4",
    content: "Here's a section I'm concerned about: \"The Party shall indemnify and hold harmless the other Party from any and all claims, including reasonable attorney's fees, arising out of or resulting from the performance of services under this Agreement.\"",
    role: "user",
    timestamp: "2025-03-15T14:28:00"
  },
  {
    id: "msg5",
    content: "I've analyzed this indemnification clause, and I've identified 3 potential issues:\n\n1. **Scope is overly broad**: The clause doesn't limit the indemnification to claims arising from negligence or misconduct, which means you could be responsible for claims even if you weren't at fault.\n\n2. **No liability cap**: There's no upper limit on the potential liability, which creates unlimited financial exposure.\n\n3. **No exclusions**: Standard exclusions for things like consequential damages or third-party actions are missing.\n\nI recommend negotiating to:\n- Limit indemnification to claims resulting from your negligence or breach\n- Add a liability cap (often tied to contract value)\n- Include standard exclusions for indirect/consequential damages",
    role: "assistant",
    timestamp: "2025-03-15T14:30:00",
    references: [
      {
        id: "ref1",
        documentId: "doc1",
        documentName: "Legal Drafting Guide",
        text: "Indemnification clauses should be limited in scope to specific actions or negligence to avoid overly broad liability.",
        page: 42
      },
      {
        id: "ref2",
        documentId: "doc2",
        documentName: "Contract Risk Management",
        text: "Always include liability caps in indemnification clauses to limit potential financial exposure.",
        page: 87
      }
    ]
  }
];

// Assistant capabilities
const assistantCapabilities = [
  {
    id: "1",
    title: "Contract Analysis",
    description: "Review contracts to identify risks, issues, and opportunities",
    icon: FileText,
    color: "text-blue-600",
    prompt: "I need help reviewing a contract. Can you identify potential risks and issues?"
  },
  {
    id: "2",
    title: "Research Assistant",
    description: "Find relevant legal precedents and regulations",
    icon: FileSearch,
    color: "text-purple-600",
    prompt: "Can you help me find legal precedents related to intellectual property disputes in software?"
  },
  {
    id: "3",
    title: "Document Summarization",
    description: "Summarize lengthy legal documents and extract key points",
    icon: AlignLeft,
    color: "text-green-600",
    prompt: "Can you summarize this legal document and extract the key points?"
  },
  {
    id: "4",
    title: "Compliance Guidance",
    description: "Get guidance on regulatory compliance requirements",
    icon: ListChecks,
    color: "text-amber-600",
    prompt: "What are the main compliance requirements for a fintech startup?"
  }
];

export default function AssistantPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(mockConversations[0]);
  const [showConversationList, setShowConversationList] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  
  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      role: "user",
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    // Add loading message
    const loadingId = `loading-${Date.now()}`;
    const loadingMessage: Message = {
      id: loadingId,
      content: "...",
      role: "assistant",
      timestamp: new Date().toISOString(),
      isLoading: true
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Replace loading message with assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: "This is a simulated response from the assistant. In a real application, this would be the response from the AI model.",
        role: "assistant",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingId ? assistantMessage : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Replace loading message with error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingId ? {
            ...msg,
            content: "Sorry, I encountered an error. Please try again.",
            isLoading: false
          } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle keydown events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Create a new conversation
  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: "New conversation",
      lastMessage: "",
      timestamp: new Date().toISOString(),
      isPinned: false
    };
    
    setConversations([newConversation, ...conversations]);
    setCurrentConversation(newConversation);
    setMessages([{
      id: "welcome",
      content: "Hello! I'm your AI legal assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date().toISOString()
    }]);
  };
  
  // Switch to a conversation
  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    // In a real app, you would fetch messages for this conversation
    setShowConversationList(false);
  };
  
  // Copy message to clipboard
  const copyMessageToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        // Show toast notification in a real app
        console.log("Copied to clipboard");
      })
      .catch(() => {
        console.error("Failed to copy to clipboard");
      });
  };
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return timestamp;
    }
  };
  
  // Use a capability prompt
  const useCapabilityPrompt = (prompt: string) => {
    setInput(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
        {/* Left sidebar - conversation list on large screens */}
        <div className="hidden lg:flex flex-col h-full">
          <Card className="flex-1 flex flex-col h-full">
            <CardHeader className="py-4 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xl font-bold">Assistant</CardTitle>
              <Button onClick={handleNewConversation}>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                {conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No conversations yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Start a new conversation to get help</p>
                    <Button onClick={handleNewConversation}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Chat
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations
                      .sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1))
                      .map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`cursor-pointer p-3 rounded-lg flex flex-col transition-colors ${
                            currentConversation?.id === conversation.id
                              ? "bg-primary-100"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => handleSelectConversation(conversation)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 overflow-hidden">
                              <h3 className="font-medium truncate flex items-center">
                                {conversation.isPinned && (
                                  <span className="mr-1 text-primary-500">📌</span>
                                )}
                                {conversation.title}
                              </h3>
                              <p className="text-xs text-gray-500 truncate">
                                {conversation.lastMessage || "New conversation"}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatTime(conversation.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t p-4">
              <Button variant="outline" className="w-full" onClick={() => setShowInfoDialog(true)}>
                <Info className="mr-2 h-4 w-4" />
                Assistant Capabilities
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Main chat area */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <Card className="flex-1 flex flex-col h-full">
            {/* Mobile header */}
            <CardHeader className="py-4 px-4 lg:hidden flex flex-row items-center justify-between space-y-0 border-b">
              <Button variant="ghost" onClick={() => setShowConversationList(true)}>
                <MessageSquare className="h-5 w-5 mr-2" />
                Conversations
              </Button>
              <Button size="icon" variant="ghost" onClick={handleNewConversation}>
                <Plus className="h-5 w-5" />
              </Button>
            </CardHeader>
            
            {/* Chat area */}
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea ref={scrollAreaRef} className="h-full">
                <div className="p-4 space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex gap-3 max-w-[85%] ${
                          message.role === "user" ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <Avatar className="h-8 w-8 mt-1">
                          {message.role === "user" ? (
                            <AvatarImage src={session?.user?.image || "/avatars/user-avatar.png"} alt="You" />
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
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              message.role === "user"
                                ? "bg-primary-600 text-white"
                                : "bg-gray-100"
                            }`}
                          >
                            {message.isLoading ? (
                              <div className="flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Thinking...</span>
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap">
                                {message.content}
                              </div>
                            )}
                          </div>
                          
                          {/* Message actions */}
                          {message.role === "assistant" && !message.isLoading && (
                            <div className="flex items-center gap-1 mt-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyMessageToClipboard(message.content)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          
                          {/* References */}
                          {message.references && message.references.length > 0 && (
                            <div className="mt-2 space-y-2">
                              <p className="text-xs font-medium text-gray-500">References:</p>
                              {message.references.map((reference) => (
                                <div
                                  key={reference.id}
                                  className="bg-gray-50 border border-gray-100 rounded-md p-2 text-sm"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-medium text-sm">
                                        {reference.documentName}
                                        {reference.page && <span className="text-gray-500"> (page {reference.page})</span>}
                                      </h4>
                                      <p className="text-xs text-gray-600 mt-1">{reference.text}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <FileText className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            
            {/* Input area */}
            <CardFooter className="p-4 border-t">
              <div className="w-full space-y-4">
                {/* Quick prompts - only on desktop */}
                <div className="hidden md:flex gap-2 overflow-x-auto pb-2">
                  {assistantCapabilities.map((capability) => (
                    <Button
                      key={capability.id}
                      variant="outline"
                      size="sm"
                      className="flex-none"
                      onClick={() => useCapabilityPrompt(capability.prompt)}
                    >
                      <capability.icon className={`mr-2 h-4 w-4 ${capability.color}`} />
                      {capability.title}
                    </Button>
                  ))}
                </div>
                
                <div className="flex gap-2 items-end">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[52px] max-h-[200px] resize-none"
                    rows={1}
                    disabled={isLoading}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSendMessage}
                      size="icon"
                      className="h-[52px] w-[52px]"
                      disabled={!input.trim() || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                      <span className="sr-only">Send message</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Mobile conversation list dialog */}
      <Dialog open={showConversationList} onOpenChange={setShowConversationList}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Conversations</DialogTitle>
            <DialogDescription>Your chat history with the assistant.</DialogDescription>
          </DialogHeader>
          <div className="py-4 h-[50vh] overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`cursor-pointer p-3 rounded-lg transition-colors ${
                      currentConversation?.id === conversation.id
                        ? "bg-primary-100"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 overflow-hidden">
                        <h3 className="font-medium truncate flex items-center">
                          {conversation.isPinned && (
                            <span className="mr-1 text-primary-500">📌</span>
                          )}
                          {conversation.title}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.lastMessage || "New conversation"}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatTime(conversation.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button onClick={handleNewConversation}>
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assistant capabilities dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>AI Assistant Capabilities</DialogTitle>
            <DialogDescription>
              Your AI legal assistant can help with a variety of tasks. Here are some examples:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assistantCapabilities.map((capability) => (
              <Card key={capability.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`rounded-full p-3 ${capability.color.replace('text', 'bg')}/10`}>
                      <capability.icon className={`h-6 w-6 ${capability.color}`} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">{capability.title}</h3>
                      <p className="text-sm text-gray-500">{capability.description}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          useCapabilityPrompt(capability.prompt);
                          setShowInfoDialog(false);
                        }}
                      >
                        <Zap className="mr-2 h-3 w-3" />
                        Try it
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowInfoDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}