// components/workspace/AssociateChat.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  User,
  Bot,
  FileText,
  Copy,
  CheckCircle,
  ArrowLeft,
  StopCircle,
  Loader2
} from "lucide-react";

interface AssociateChatProps {
  associate: {
    id: string;
    name: string;
    type: string;
  };
  onBack: () => void;
}

export function AssociateChat({ associate, onBack }: AssociateChatProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: string;
  }>>([
    {
      id: "intro",
      content: `Hi there! I'm ${associate.name}, your ${associate.type} assistant. How can I help you today?`,
      role: "assistant",
      timestamp: new Date().toISOString()
    }
  ]);
  
  // Handle message submission
  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      content: input,
      role: "user" as const,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        content: `This is a simulated response from ${associate.name}. In a real implementation, this would be processed by the AI with access to the tools configured for this associate.`,
        role: "assistant" as const,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 2000);
  };
  
  // Handle key press for sending message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex items-center">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <Bot className="h-4 w-4 text-blue-700" />
        </div>
        <div>
          <h3 className="font-medium">{associate.name}</h3>
          <p className="text-xs text-gray-500">{associate.type.charAt(0).toUpperCase() + associate.type.slice(1)} Specialist</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                {message.role === "user" ? (
                  <User className="h-5 w-5 text-gray-600" />
                ) : (
                  <Bot className="h-5 w-5 text-gray-600" />
                )}
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1 text-sm">
                  <span className="font-medium">{message.role === "user" ? "You" : associate.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(message.timestamp).toLocaleTimeString(undefined, { 
                      hour: 'numeric', 
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.role === "user" ? "bg-primary text-white" : "bg-gray-100"
                  }`}
                >
                  {message.content}
                </div>
                
                {message.role === "assistant" && (
                  <div className="flex gap-1 mt-2">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Save to Documents
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
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-gray-600" />
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1 text-sm">
                  <span className="font-medium">{associate.name}</span>
                  <span className="text-muted-foreground text-xs">Now</span>
                </div>
                
                <div className="rounded-lg px-4 py-3 bg-gray-100">
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
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${associate.name} a question...`}
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
          </Button>
        </div>
        
        {isLoading && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setIsLoading(false)}
          >
            <StopCircle className="h-4 w-4 mr-2" />
            Stop Generating
          </Button>
        )}
      </div>
    </div>
  );
}