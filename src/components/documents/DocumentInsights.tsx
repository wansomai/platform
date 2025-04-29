import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, RefreshCw, Copy, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DocumentInsightsProps {
  documentId: string;
  open: boolean;
  onClose: () => void;
}

// Add document-specific suggestion prompts
const suggestionPrompts = [
  {
    title: "Summarize",
    prompt: "Can you provide a brief summary of this document?"
  },
  {
    title: "Key Points",
    prompt: "What are the main key points or takeaways from this document?"
  },
  {
    title: "Define Terms",
    prompt: "Can you explain any complex terms or jargon used in this document?"
  },
  {
    title: "Action Items",
    prompt: "What are the action items or next steps mentioned in this document?"
  }
];

export function DocumentInsights({ documentId, open, onClose }: DocumentInsightsProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`/api/documents/${documentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Add copyToClipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Add suggestion handler
  const useSuggestion = (prompt: string) => {
    setInput(prompt);
    if (document.querySelector('textarea')) {
      (document.querySelector('textarea') as HTMLTextAreaElement).focus();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[600px] flex flex-col h-full p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary-600" />
            <span>Document Assistant</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src="/avatars/ai-avatar.png" alt="AI" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1 text-sm">
                      <span className="font-medium">Document Assistant</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="rounded-lg px-4 py-2 bg-gray-100">
                      Ask me anything about this document!
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
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
                          {message.role === "user" ? "You" : "Document Assistant"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      </div>
                      
                      {message.role === "assistant" && (
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
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src="/avatars/ai-avatar.png" alt="AI" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1 text-sm">
                      <span className="font-medium">Document Assistant</span>
                      <span className="text-muted-foreground text-xs">now</span>
                    </div>
                    <div className="rounded-lg px-4 py-2 bg-gray-100">
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          {/* Add Suggestions UI */}
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
                <span className="text-gray-500 text-xs">Quick Prompts</span>
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

          {/* Existing textarea and send button */}
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the document..."
              className="min-h-[60px] max-h-[180px] pr-12"
              disabled={loading}
            />
            <div className="absolute right-2 bottom-2">
              <Button 
                onClick={() => sendMessage(input)}
                size="icon"
                className="h-8 w-8"
                disabled={!input.trim() || loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}