// src/components/chat/ChatInterface.tsx
"use client"

import React, { useRef, useEffect, useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Copy,
  Check,
  Search,
  ExternalLink,
  Globe,
  CheckCircle,
  X
} from "lucide-react"
import { useChatStore} from "@/store/chat.store"
import { useCanvasStore } from "@/store/canvas.store"
import { useUIStore } from "@/store/ui.store"
import { useProjectStore } from "@/store/project.store"
import { useProjectSettingsStore } from "@/store/workspace-settings.store"
import { useSession } from "next-auth/react"
import MessageDisplay from "./MessageDisplay"
import LogoAnimation from "../commons/LogoAnimation"
import { CanvasProcessingStatus } from "./CanvasProcessingStatus"
import { ReportDownloadCard } from "./ReportDownloadCard"
import { DocumentArtifact } from "./DocumentArtifact"
import { Message, Jurisdiction } from "@/types"
import { getJurisdictionById } from "@/lib/jurisdictions"

const STATUS_TEXT: Record<string, string> = {
  started: "Securing your workspace...",
  processing_document: "Reading documents...",
  searching_web: "Searching the web...",
  executing_functions: "Perfecting answers...",
  retrying: "Retrying connection...",
  saving_response: "Saving response...",
};

function getStatusText(status?: string, statusMessage?: string): string {
  // Prefer the server-provided human-readable message over the static map
  if (statusMessage) return statusMessage;
  if (!status) return "Thinking...";
  return STATUS_TEXT[status] || "Thinking...";
}

// Empty state component for when there are no messages
const EmptyState = () => (
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

// Loading state for when a pending message is about to be sent
const PendingMessageState = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 text-center">
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-center">
        <LogoAnimation size="md" className="text-primary" />
      </div>
      <p className="text-gray-600 text-lg">Starting your conversation...</p>
    </div>
  </div>
);

export function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false)

  // Get state from stores
  const { addToast } = useUIStore()
  const {
    currentConversation,
    error,
    isLoading
  } = useChatStore()
  const { currentProject } = useProjectStore()
  const { settings, suggestedJurisdiction, setJurisdiction } = useProjectSettingsStore()
  const {data: session} = useSession()

  const activeJurisdictions = (settings?.jurisdictions ?? [])
    .map(j => getJurisdictionById(j.id))
    .filter(Boolean) as Jurisdiction[]
  const hasJurisdiction = activeJurisdictions.length > 0 || !!settings?.jurisdiction

  const applyJurisdiction = useCallback(async (jurisdiction: Jurisdiction) => {
    if (!currentProject?.id) return
    await setJurisdiction(currentProject.id, jurisdiction)
    setDismissedSuggestion(true)
  }, [currentProject?.id, setJurisdiction])

  // Check for pending message directly (more reliable than state)
  const hasPendingMessage = typeof window !== "undefined" && !!sessionStorage.getItem("pendingMessage")
  
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
  
  const copyMessageToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => addToast({ message: 'Message Copied to clipboard', type: 'success' }))
      .catch(() => addToast({ message: 'Failed to copy to clipboard', type: 'error' }))
  }, [addToast])

  const hasMessages = !!(currentConversation?.messages && currentConversation.messages.length > 0)

  return (
    <div className="flex flex-col h-full">
      {/* Jurisdiction suggestion banner */}
      {!hasJurisdiction && suggestedJurisdiction && !dismissedSuggestion && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-100 text-sm text-green-700 flex-shrink-0">
          <Globe className="h-4 w-4 flex-shrink-0" />
          <span>We detected you may be in <strong>{suggestedJurisdiction.name}</strong>.</span>
          <button
            onClick={() => applyJurisdiction(suggestedJurisdiction)}
            className=" font-medium hover:text-green-900"
          >
           Applying {suggestedJurisdiction.name} law. Switch jurisdiction from chat settings.
          </button>
          <button
            onClick={() => setDismissedSuggestion(true)}
            className="ml-auto text-green-400 hover:text-green-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages area or empty/loading state */}
      {!hasMessages ? (
        hasPendingMessage || isLoading ? <PendingMessageState /> : <EmptyState />
      ) : (
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6 pb-32 lg:mb-2 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
            {currentConversation.messages.map((message, index) => (
              <ChatMessageItem
                key={message.id || message.tempId || `temp-${message.timestamp}-${index}`}
                message={message}
                user={session?.user}
                projectId={currentConversation.projectId}
                onCopy={() => copyMessageToClipboard(message.content)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  )
}

// ChatMessageItem to handle streaming messages
const ChatMessageItem = React.memo(({
  message,
  user,
  projectId,
  onCopy
}: {
  message: Message,
  user: any,
  projectId: string,
  onCopy: () => void
}) => {
  const isUser = message.role === 'user';
  const pendingSuggestion = useCanvasStore(state => state.pendingSuggestion);
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    onCopy();
    setCopied(true);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [onCopy]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  // Debug: Check if message has report
  if (!isUser && (message.metadata?.report || message.report)) {
    }
  
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
              isUser ? "bg-gray-100 text-white" : "bg-transparent"
            }`}
          >
            {message.isLoading || isStreaming ? (
              <div className="flex items-center">
                {message.content ? (
                  <div className="space-y-2">
                    <MessageDisplay 
                      content={formattedContent} 
                     
                    />
                    {isStreaming && (
                      <div className="flex items-center gap-1">
                        <LogoAnimation size="sm" className="text-gray-500" />
                        <span className="text-xs text-gray-500 animate-pulse">
                          {message.statusMessage || message.processingStatus || "Thinking..."}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    {message.processingStatus && isCanvasProcessingStatus(message.processingStatus) ? (
                      <CanvasProcessingStatus
                        status={message.processingStatus}
                        message={message.canvasMessage}
                      />
                    ) : (
                      <div className="flex items-center">
                        <LogoAnimation size="sm" className="text-gray-500" />
                        <span className="animate-pulse ml-2">
                          {getStatusText(message.processingStatus, message.statusMessage)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <MessageDisplay 
                content={formattedContent} 
                
              />
            )}
          </div>      
          {!isUser && !message.isLoading && !isStreaming && (
            <div className="flex gap-1 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 gap-1.5 ${copied ? 'min-w-[72px] text-green-600' : 'w-8 px-0'}`}
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="text-xs font-medium">Copied</span>
                  </>
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {/* Suggestion Accept / Reject — shown inline when a canvas diff is awaiting review */}
          {message.isSuggestion && pendingSuggestion && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('canvasAcceptSuggestion'))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Accept Changes
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('canvasRejectSuggestion'))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Reject Changes
              </button>
            </div>
          )}

          {/* Display Google Search sources if available */}
          {!isUser && message.webSearchSources && message.webSearchSources.length > 0 && (
            <div className="mt-3 p-3">
              <div className="flex items-center mb-2 text-blue-700">
                <img src="/favicon-dark.png" alt="Google" className="h-6 w-6 mr-2 rounded-full" />
                <span className="font-medium text-sm">Research Sources ({message.webSearchSources.length})</span>
              </div>
              <div className="flex flex-wrap items-centerjustify-center gap-2">
                {message.webSearchSources.map((source: {title: string, uri: string}, index: number) => (
                  <a
                    key={index}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-2 bg-white rounded hover:bg-blue-100 transition-colors group"
                  >
                    <span className="text-xs text-blue-600 font-mono mt-0.5">[{index + 1}]</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 group-hover:text-blue-700 line-clamp-1">
                        {source.title}
                      </p>
                    </div>
                    <ExternalLink size={14} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                  </a>
                ))}
              </div>
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

          {/* Display Report Download Card if available */}
          {!isUser && (message.metadata?.report || message.report) && (
            <ReportDownloadCard
              report={message.metadata?.report || message.report}
              projectId={projectId}
            />
          )}

          {/* Display Document Artifact if available */}
          {!isUser && message.document && (
            <DocumentArtifact
              title={message.document.title}
              format={message.document.format}
              htmlContent={message.document.htmlContent}
              documentId={message.document.documentId}
              projectId={projectId}
              conversationId={message.conversationId || ''}
            />
          )}
        </div>
      </div>
    </div>
  );
});

// Simple function to remove system prefix
function formatMessageContent(content: string): string {
  return content.replace(/^Wansom:\s*/i, '');
}

// Helper function to check if status is canvas-related
function isCanvasProcessingStatus(status: string): boolean {
  const canvasStatuses = [
    'analyzing_request',
    'processing_context', 
    'generating_document',
    'editing_document',
    'saving_document',
    'completed',
    'error'
  ];
  return canvasStatuses.includes(status);
}