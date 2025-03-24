"use client"

import { useRef, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Copy, 
  Download, 
  ThumbsUp, 
  ThumbsDown, 
  Send, 
  Loader2, 
  FileText,
  Sparkles,
  Search,
} from "lucide-react"
import { useChatStore, Message as ChatMessage } from "@/store/chat.store"
import { useUIStore } from "@/store/ui.store"
import { useConversationDocumentsStore } from "@/store/conversation-documents.store"
import { formatDistanceToNow } from 'date-fns'
import { useSession } from "next-auth/react"
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MessageDisplay from "./MessageDisplay"

export function ChatInterface() {
  const params = useParams()
  const projectId = params.id as string
  
  const [input, setInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Removed file upload states
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Removed file input ref
  
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
  const { documents: conversationDocuments } = useConversationDocumentsStore()
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
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
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
  
  const handleSend = async () => {
    if (!input.trim() || isSubmitting || !currentConversation) return
    
    try {
      setIsSubmitting(true)
      await sendMessage(projectId, currentConversation.id, input, session?.user?.id)
      setInput("")
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return timestamp
    }
  }
  
  const copyMessageToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => addToast({ message: 'Copied to clipboard', type: 'success' }))
      .catch(() => addToast({ message: 'Failed to copy to clipboard', type: 'error' }))
  }
  
  // Removed file upload handler
  
  if (isLoading && !currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-secondary-700">Loading conversation...</span>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Conversation Header */}
    

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-6">
          {currentConversation?.messages.map((message) => (
            <ChatMessageItem 
              key={message.id} 
              message={message} 
              user={session?.user} 
              onCopy={() => copyMessageToClipboard(message.content)}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="flex-none p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 min-h-[52px] max-h-[200px] resize-none"
            rows={1}
            disabled={isSubmitting}
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            className="h-[52px] w-[52px]" 
            disabled={!input.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
          </div>
        </div>
      </div>
    
  )
}
// Simple function to remove system prefix
function formatMessageContent(content: string): string {
  // Remove "System:" prefix if it exists at the beginning
  return content.replace(/^System:\s*/i, '');
}

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
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback>{isUser ? user?.fullName?.charAt(0) || 'U' : 'AI'}</AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1 text-sm">
            <span className="font-medium">{isUser ? 'You' : 'AI Assistant'}</span>
            <span className="text-muted-foreground text-xs">{message.timestamp ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true }) : ''}</span>
          </div>
          
          <div
            className={`rounded-lg px-4 py-3 ${
              isUser ? "bg-green-600 text-white" : "bg-secondary-100"
            }`}
          >
            {message.isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Thinking...</span>
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
          
          {!isUser && !message.isLoading && (
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