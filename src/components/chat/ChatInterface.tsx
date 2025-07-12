// src/components/chat/ChatInterface.tsx
"use client"

import { useRef, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { Message as ChatMessage } from "@/store/chat.store"
import { useUIStore } from "@/store/ui.store"
import { useSession } from "next-auth/react"
import MessageDisplay from "./MessageDisplay"
import LogoAnimation from "../commons/LogoAnimation"
import { ProcessingStatus } from "./ProcessingStatus"
import { useWorkspace } from "@/hooks/useWorkspace"

// Empty state component for when there are no messages
const EmptyState = ({ projectTitle }: { projectTitle?: string }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 text-center">
    <div className="max-w-md mx-auto space-y-6">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-5xl">
          😎
        </div>
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
  const { data: session } = useSession()
  
  // Use workspace hook - gets all data in one call
  const { project, messages, isLoading, error } = useWorkspace(projectId)
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages])
  
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
  
  // Show loading only if we're actually loading and have no messages yet
  if (isLoading && (!messages || messages.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <LogoAnimation size="sm" className="text-gray-500" />
        <span className="ml-2 text-secondary-700 animate-pulse">Loading workspace...</span>
      </div>
    )
  }

  // Show empty state if no messages
  if (!messages || messages.length === 0) {
    return <EmptyState projectTitle={project?.title} />
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6 pb-32 lg:mb-24 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
          {messages.map((message) => (
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

// ChatMessageItem component
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
      <div className={`flex gap-2 sm:gap-3 max-w-[90%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
       
        {/* Message content */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div className={`rounded-lg px-3 py-2 sm:px-4 sm:py-3 max-w-full ${
            isUser 
              ? "bg-primary text-white" 
              : " text-gray-900"
          }`}>
            <MessageDisplay content={formattedContent} />
            
            {/* Processing status for streaming */}
             {message.processingStatus&&(
                      <ProcessingStatus status={message.processingStatus} />
                    ) }
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format message content
function formatMessageContent(content: string): string {
  return content.replace(/^System:\s*/i, '');
}