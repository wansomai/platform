'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, RefreshCw, Copy, MessageSquare } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { notify } = useNotifications();
  const { user } = useAuthStore();

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

  // Initialize with a welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        content: 'Hello! I\'m your AI assistant. How can I help you today?',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: input,
          threadId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get assistant response');
      }

      // Save the thread ID for future messages
      if (data.data.threadId) {
        setThreadId(data.data.threadId);
      }

      // Add assistant response
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          content: data.data.content,
          role: 'assistant',
          timestamp: data.data.timestamp,
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
    
      notify.error(error instanceof Error ? error.message : 'Failed to send message');

      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          role: 'assistant',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewConversation = () => {
    setThreadId(null);
    setMessages([
      {
        id: 'welcome',
        content: 'Hello! I\'m your AI assistant. How can I help you today?',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      },
    ]);
    notify.success('Started a new conversation');
  };

  const copyMessageToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => notify.success('Message copied to clipboard'))
      .catch(() => notify.error('Failed to copy message'));
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="w-full h-[80vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>Chat with your legal assistant</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={startNewConversation}>
              <RefreshCw className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-hidden p-0 relative">
          <ScrollArea ref={scrollAreaRef} className="h-full px-4">
            <div className="space-y-6 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex gap-3 max-w-[80%]",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className="h-8 w-8 mt-1">
                      {message.role === 'user' ? (
                        <AvatarImage src={user?.avatar || "/avatars/user-avatar.png"} alt="You" />
                      ) : (
                        <AvatarImage src="/avatars/ai-avatar.png" alt="AI" />
                      )}
                      <AvatarFallback>
                        {message.role === 'user' ? (user?.fullName?.charAt(0) || 'U') : 'AI'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1 text-sm">
                        <span className="font-medium">
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2",
                          message.role === 'user' 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        )}
                      >
                        {message.content}
                      </div>
                      
                      {message.role === 'assistant' && (
                        <div className="flex gap-1 mt-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => copyMessageToClipboard(message.content)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src="/avatars/ai-avatar.png" alt="AI" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1 text-sm">
                        <span className="font-medium">AI Assistant</span>
                        <span className="text-muted-foreground text-xs">now</span>
                      </div>
                      
                      <div className="rounded-lg px-4 py-2 bg-muted">
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
        </CardContent>
        
        <CardFooter className="p-4 pt-2">
          <div className="flex gap-2 w-full">
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
        </CardFooter>
      </Card>
    </div>
  );
}