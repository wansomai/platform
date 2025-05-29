// src/components/chat/ChatInterface.tsx
"use client"

import { useRef, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Copy, 
  Send, 
  Loader2,
  Search, 
} from "lucide-react"
import { useChatStore, Message as ChatMessage } from "@/store/chat.store"
import { useUIStore } from "@/store/ui.store"
import { formatDistanceToNow } from 'date-fns'
import { useSession } from "next-auth/react"
import MessageDisplay from "./MessageDisplay"
import LogoAnimation from "../commons/LogoAnimation"
import { ProcessingStatus } from "./ProcessingStatus"

export function ChatInterface() {
  const params = useParams()
  const projectId = params.id as string
  
  const [input, setInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Get state from stores
  const { addToast } = useUIStore()
  const { 
    currentConversation, 
    fetchConversation, 
    createConversation, 
    sendMessage, 
    isLoading, 
    error 
  } = useChatStore()
 
  const {data: session} = useSession()
  
  // Set up conversation when component mounts
  useEffect(() => {
    const initializeChat = async () => {
      if (projectId && !currentConversation) {
        // Try to get the most recent conversation if it exists
        const conversations = await useChatStore.getState().fetchConversations(projectId)
        
        if (conversations.length > 0) {
          // Load the most recent conversation
          await fetchConversation(projectId, conversations[0].id)
        } else {
          // Create a new conversation
          await createConversation(projectId)
        }
      }
    }
    
    initializeChat()
  }, [projectId, currentConversation, fetchConversation, createConversation])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentConversation?.messages])
  
  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      addToast({ message: error, type: 'error' })
    }
  }, [error, addToast])
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])
  
  // Handle direct prompt sending
  useEffect(() => {
    const handlePromptSendEvent = (event: any) => {
      if (event.detail && event.detail.promptTemplate) {
        // Send the prompt directly
        if (currentConversation) {
          handleSend(event.detail.promptTemplate);
        }
      }
    };
    
    // Add event listener
    document.addEventListener('action-prompt-send', handlePromptSendEvent);
    
    // Cleanup
    return () => {
      document.removeEventListener('action-prompt-send', handlePromptSendEvent);
    };
  }, [currentConversation]);
 
  // Update the handleSend method to use streaming
  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || isSubmitting || !currentConversation) return;
    
    try {
      setIsSubmitting(true);
      
      // Use the updated sendMessage that supports streaming
      await sendMessage(
        projectId, 
        currentConversation.id, 
        messageToSend,
        session?.user?.id,
        ''
      );
      
      // Only clear input if we're sending the user's typed input
      if (!customMessage) {
        setInput("");
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const copyMessageToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => addToast({ message: 'Message Copied to clipboard', type: 'success' }))
      .catch(() => addToast({ message: 'Failed to copy to clipboard', type: 'error' }))
  }
  
  if (isLoading && !currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <LogoAnimation size="sm" className="text-gray-500" />
        <span className="ml-2 text-secondary-700 animate-pulse">Loading conversation...</span>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Messages container - Full height with padding bottom for floating input */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6 pb-20 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
          {currentConversation?.messages.map((message) => (
            <ChatMessageItem 
              key={message.id || message.tempId || `msg-${Math.random()}`} 
              message={message} 
              user={session?.user} 
              onCopy={() => copyMessageToClipboard(message.content)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Input Area at Bottom - Centered */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg focus-within:border-primary-300 transition-colors w-[90vw] max-w-3xl relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="border-0 resize-none min-h-[52px] max-h-[120px] pr-16 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
            disabled={isSubmitting}
          />
          
          {/* Send button positioned inside textarea */}
          <div className="absolute right-2 bottom-2">
            <Button 
              onClick={() => handleSend()} 
              size="icon" 
              className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90" 
              disabled={!input.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Send className="h-4 w-4 text-white" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
 }
 
 // Update ChatMessageItem to handle streaming messages
 function ChatMessageItem({ 
  message, 
  user,
  onCopy 
 }: { 
  message: ChatMessage, 
  user: any,
  onCopy: () => void
 }) {
  const isUser = message.role === 'user';

  
  // Format the message content
  const formattedContent = formatMessageContent(message.content);
  
  // Check if message is currently streaming
  const isStreaming = message.isStreaming;
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mt-1 flex-shrink-0">
          <AvatarFallback className="text-xs sm:text-sm">{isUser ? user?.fullName?.charAt(0) || 'U' : 'AI'}</AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-1 text-xs sm:text-sm">
            <span className="font-medium">{isUser ? 'You' : 'AI Assistant'}</span>
            <span className="text-muted-foreground text-xs">
              {message.timestamp ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true }) : ''}
            </span>
          </div>
          
          <div
            className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
              isUser ? "bg-primary text-white" : "bg-gray-100 border"
            }`}
          >
          {message.isLoading || isStreaming ? (
              <div className="flex items-center">
                {message.content ? (
                  // Show streaming content
                  <div className="space-y-2">
                    <MessageDisplay 
                      content={formattedContent} 
                      className={isUser ? "text-white" : ""} 
                    />
                    {isStreaming && (
                      <div className="flex items-center gap-1">
                        <LogoAnimation size="sm" className="text-gray-500" />
                        <span className="text-xs text-gray-500 animate-pulse">
                          {message.processingStatus || "Thinking..."}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  // Show processing status or loading animation
                  <div className="flex flex-col items-start">
                    {message.processingStatus && message.processingStatus !== 'completed' ? (
                      <ProcessingStatus status={message.processingStatus} />
                    ) : (
                      <div className="flex items-center">
                        <LogoAnimation size="sm" className="text-gray-500" />
                        <span className="animate-pulse ml-2">
                          {message.processingStatus || "Processing..."}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <MessageDisplay 
                content={formattedContent} 
                className={isUser ? "text-white" : ""} 
              />
            )}
          </div>
          
          {/* Display web search results if available */}
          {!isUser && message.webSearchResults && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
              <div className="flex items-center mb-2 text-blue-700">
                <Search className="h-4 w-4 mr-2" />
                <span className="font-medium">Web Search Results</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <MessageDisplay 
                  content={message.webSearchResults} 
                  className="text-gray-700 text-xs" 
                />
              </div>
            </div>
          )}
          
          {!isUser && !message.isLoading && !isStreaming && (
            <div className="flex gap-1 mt-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Show any references/citations */}
          {message.references && message.references.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-secondary-500">References:</p>
              {message.references.map((ref, index) => (
                <div key={index} className="bg-secondary-50 rounded p-2 text-xs">
                  <p className="font-medium">{ref.documentName}</p>
                  <p className="text-secondary-600">{ref.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
 }
 
 // Simple function to remove system prefix
 function formatMessageContent(content: string): string {
  // Remove "System:" prefix if it exists at the beginning
  return content.replace(/^System:\s*/i, '');
 }