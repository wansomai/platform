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
} from "lucide-react"
import { useChatStore, Message as ChatMessage } from "@/store/chat.store"
import { useUIStore } from "@/store/ui.store"
import { useConversationDocumentsStore } from "@/store/conversation-documents.store"
import { formatDistanceToNow } from 'date-fns'
import { useSession } from "next-auth/react"
import MessageDisplay from "./MessageDisplay"
import { ActionHandler, ActionType } from "@/components/actions/ActionHandler"
import { useConversationActionsStore } from "@/store/conversation-actions.store"
import { DocumentResult } from "./DocumentResult"

export function ChatInterface() {
  const params = useParams()
  const projectId = params.id as string
  
  const [input, setInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Action state
  const [activeAction, setActiveAction] = useState<ActionType | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  
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
  const { executeAction, isLoading: isActionLoading } = useConversationActionsStore()
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
  
  // Listen for action selection events from the context panel
  useEffect(() => {
    const handleActionEvent = (event: any) => {
      if (event.detail && event.detail.actionType) {
        setActiveAction(event.detail.actionType);
        setShowActionDialog(true);
      }
    };
    
    // Add event listener
    document.addEventListener('action-selected', handleActionEvent);
    
    // Cleanup
    return () => {
      document.removeEventListener('action-selected', handleActionEvent);
    };
  }, []);
  
  // Make the action handler available to other components
  useEffect(() => {
    // Attach the action handler to the component element for external access
    if (scrollAreaRef.current) {
      (scrollAreaRef.current as any).handleActionSelect = handleActionSelect;
      (scrollAreaRef.current as any).classList.add('chat-interface-component');
    }
    
    return () => {
      if (scrollAreaRef.current) {
        delete (scrollAreaRef.current as any).handleActionSelect;
        (scrollAreaRef.current as any).classList.remove('chat-interface-component');
      }
    };
  }, []);


// Add this useEffect hook to handle direct prompt sending
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

// Add this method to send prompts directly
const sendPromptDirectly = (prompt: string) => {
  if (currentConversation) {
    handleSend(prompt);
  }
};

// Add this useEffect to expose the direct send method
useEffect(() => {
  // Attach the direct send method to the component element for external access
  if (scrollAreaRef.current) {
    (scrollAreaRef.current as any).sendPromptDirectly = sendPromptDirectly;
    (scrollAreaRef.current as any).classList.add('chat-interface-component');
  }
  
  return () => {
    if (scrollAreaRef.current) {
      delete (scrollAreaRef.current as any).sendPromptDirectly;
      (scrollAreaRef.current as any).classList.remove('chat-interface-component');
    }
  };
}, [currentConversation]);

// Update the handleSend method to accept a custom message
const handleSend = async (customMessage?: string) => {
  const messageToSend = customMessage || input;
  if (!messageToSend.trim() || isSubmitting || !currentConversation) return;
  
  try {
    setIsSubmitting(true);
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
      .then(() => addToast({ message: 'Copied to clipboard', type: 'success' }))
      .catch(() => addToast({ message: 'Failed to copy to clipboard', type: 'error' }))
  }
  
  // Handle action selection from the sidebar
  const handleActionSelect = (actionType: ActionType) => {
    setActiveAction(actionType)
    setShowActionDialog(true)
  }
  
  
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
            onClick={() => handleSend()} 
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
  function checkForDocumentContent(content: string): boolean {
    // Check if this looks like a document - common patterns in document generation results
    const documentPatterns = [
      /AGREEMENT|CONTRACT|MEMORANDUM|LETTER OF INTENT/i,
      /^[\s\n]*TITLE:[\s\n]*/im,
      /PARTIES:[\s\n]*/i,
      /WHEREAS|NOW, THEREFORE/i,
      /IN WITNESS WHEREOF/i,
      /^[\s\n]*ARTICLE [IVX]/im,
      /^[\s\n]*SECTION \d+/im
    ];
    
    return documentPatterns.some(pattern => pattern.test(content));
  }
  
  function extractDocumentTitle(content: string): string {
    // Try to extract a title from document-like content
    const titleMatch = content.match(/TITLE:\s*([^\n]+)/i) || 
                      content.match(/^[\s\n]*([A-Z][A-Z\s]+)[\s\n]*$/m) ||
                      content.match(/^[\s\n]*#\s+([^\n]+)/m);
    
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }
    
    return "Generated Document";
  }
  
  function extractDocumentContent(content: string): string {
    // If the content starts with a message followed by document content,
    // try to extract just the document part
    
    // Look for common separators between message and document
    const separators = [
      "Here's the document I've created:",
      "Here's the generated document:",
      "Here is the document based on our conversation:",
      "Below is the document you requested:"
    ];
    
    for (const separator of separators) {
      if (content.includes(separator)) {
        const parts = content.split(separator);
        if (parts.length > 1) {
          return parts[1].trim();
        }
      }
    }
    
    // If no separator is found, return the full content
    return content;
  }
  
  // Format the message content
  const formattedContent = formatMessageContent(message.content);
  
  // Check if this message might contain a document
  const containsDocument = !isUser && !message.isLoading && checkForDocumentContent(message.content);
  
  // Extract document title if it appears to be a document
  const documentTitle = containsDocument ? extractDocumentTitle(message.content) : null;
  
  // Extract just the document content if it's a document
  const documentContent = containsDocument ? extractDocumentContent(message.content) : null;
  
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
          
          {/* Regular message content */}
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
          
          {/* Document result display (if applicable) */}
          {containsDocument && documentContent && (
            <DocumentResult 
              content={documentContent} 
              title={documentTitle || "Generated Document"} 
            />
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