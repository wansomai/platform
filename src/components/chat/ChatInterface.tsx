// src/components/chat/ChatInterface.tsx
"use client"

import { useRef, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Copy, 
  Search
} from "lucide-react"
import { useChatStore} from "@/store/chat.store"
import { useUIStore } from "@/store/ui.store"
import { useSession } from "next-auth/react"
import MessageDisplay from "./MessageDisplay"
import LogoAnimation from "../commons/LogoAnimation"
import { ProcessingStatus } from "./ProcessingStatus"
import { useProjectStore } from "@/store/project.store"
import { Message } from "@/types"

// Empty state component for when there are no messages
const EmptyState = ({ projectTitle }: { projectTitle?: string }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 text-center">
    <div className="max-w-md mx-auto space-y-6">
      {/* Logo and greeting */}
      <div className="space-y-4">
        <div className="space-y-2">
        
          <p className="text-gray-600 text-3xl capitalize">
          All Your favorite legal tools in a unified AI workspace
          </p>
        </div>
      </div>

    </div>
  </div>
);

export function ChatInterface() {
  const params = useParams()
  const projectId = params.id as string
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Get state from stores
  const { addToast } = useUIStore()
  const { 
    currentConversation, 
    isLoading, 
    error
  } = useChatStore()


  const { currentProject } = useProjectStore()
 
  const {data: session} = useSession()
  
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
  
  const copyMessageToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => addToast({ message: 'Message Copied to clipboard', type: 'success' }))
      .catch(() => addToast({ message: 'Failed to copy to clipboard', type: 'error' }))
  }
  
  // Show loading only if we're actually loading and have no conversation yet
  if (isLoading && !currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <LogoAnimation size="sm" className="text-gray-500" />
        <span className="ml-2 text-secondary-700 animate-pulse">Loading workspace...</span>
      </div>
    )
  }

  // Show empty state if no messages
  if (!currentConversation?.messages || currentConversation.messages.length === 0) {
    return <EmptyState projectTitle={currentProject?.title} />
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages container - Add bottom padding for the floating ChatInput */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6 pb-32 lg:mb-24 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
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
    </div>
  )
}

// Update ChatMessageItem to handle streaming messages
function ChatMessageItem({ 
  message, 
  user,
  onCopy 
}: { 
  message: Message, 
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
      <div className={`flex gap-2 sm:gap-3 max-w-[90%]  ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 text-xs sm:text-sm">
            <span className="font-medium">{isUser ? 'You' : 'Wansom'}</span>
            <span className="text-muted-foreground text-xs">
              {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
          
          <div
            className={`rounded-lg px-3 py-2 sm:py-3 overflow-hidden ${
              isUser ? "bg-primary text-white" : "bg-gray-100 border"
            }`}
          >
            {message.isLoading || isStreaming ? (
              <div className="flex items-center">
                {message.content ? (
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
  return content.replace(/^Wansom:\s*/i, '');
}