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
  X,
  FileText,
  ChevronDown,
  Users
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useChatStore } from "@/store/chat.store"
import { useCanvasStore } from "@/store/canvas.store"
import { useUIStore } from "@/store/ui.store"
import { useProjectStore } from "@/store/project.store"
import { useProjectSettingsStore } from "@/store/workspace-settings.store"
import { useProjectDocumentsStore } from "@/store/workspace-documents.store"
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
const EmptyState = ({ associate }: { associate?: { name: string; description?: string } }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 text-center">
    <div className="max-w-md mx-auto space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          {associate ? (
            <>
              <p className="text-gray-800 text-2xl font-medium">{associate.name}</p>
              {associate.description && (
                <p className="text-gray-500 text-sm">{associate.description}</p>
              )}
            </>
          ) : (
            <p className="text-gray-600 text-3xl capitalize">
              All Your favorite legal tools in a unified AI workspace
            </p>
          )}
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
  const { data: session } = useSession()

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
          <span><strong>{suggestedJurisdiction.name}</strong> jurisdiction detected.</span>
          <button
            onClick={() => applyJurisdiction(suggestedJurisdiction)}
            className="font-medium underline hover:text-green-900"
          >
            Apply {suggestedJurisdiction.name} law
          </button>
          <button
            onClick={() => setDismissedSuggestion(true)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages area or empty/loading state */}
      {!hasMessages ? (
        hasPendingMessage || isLoading ? <PendingMessageState /> : <EmptyState associate={currentConversation?.aiAssociate} />
      ) : (
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6 pb-32 lg:mb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                associateName={currentConversation.aiAssociate?.name}
                redirectedQuestion={getRedirectedQuestion(currentConversation.messages, index)}
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

// Suggestion card shown below an associate response when a different specialist
// would be a better fit for the user's query. Clicking "Switch" patches the
// conversation's aiAssociateId so the next message goes to the suggested associate.
function AssociateSuggestionCard({
  suggestion,
  projectId,
  conversationId,
  redirectedQuestion,
  userId,
}: {
  suggestion: { id: string; name: string; reason: string };
  projectId: string;
  conversationId: string;
  redirectedQuestion?: string;
  userId?: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [switching, setSwitching] = useState(false);
  const assignAssociate = useChatStore(state => state.assignAssociateToConversation);
  const sendMessage = useChatStore(state => state.sendMessage);

  if (dismissed) return null;

  const handleSwitch = async () => {
    setSwitching(true);
    try {
      const success = await assignAssociate(projectId, conversationId, suggestion.id);
      if (success) {
        if (redirectedQuestion?.trim()) {
          await sendMessage(
            projectId,
            conversationId,
            redirectedQuestion.trim(),
            userId,
            {},
            undefined,
            undefined,
            undefined
          );
        }
        setDismissed(true);
      } else {
        setSwitching(false);
      }
    } catch {
      setSwitching(false);
    }
  };

  return (
    <div className="mt-3 flex items-start gap-3 rounded-lg border border-[#74C6B8]/40 bg-[#74C6B8]/5 px-4 py-3 text-sm">
      <div className="mt-0.5 flex-shrink-0 rounded-full bg-[#74C6B8]/20 p-1.5">
        <Users className="h-3.5 w-3.5 text-[#4a7279]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm">
          {suggestion.name} might be better suited for this
        </p>
        <p className="mt-0.5 text-gray-500 text-xs leading-snug">{suggestion.reason}</p>
        <div className="mt-2 flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-[#74C6B8] text-[#4a7279] hover:bg-[#74C6B8]/10 text-xs px-3"
            disabled={switching}
            onClick={handleSwitch}
          >
            {switching ? 'Switching…' : `Switch to ${suggestion.name}`}
          </Button>
          <button
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </button>
        </div>
      </div>
      <button
        className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
        onClick={() => setDismissed(true)}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ChatMessageItem to handle streaming messages
const ChatMessageItem = React.memo(({
  message,
  user,
  projectId,
  associateName,
  redirectedQuestion,
  onCopy
}: {
  message: Message,
  user: any,
  projectId: string,
  associateName?: string,
  redirectedQuestion?: string,
  onCopy: () => void
}) => {
  const isUser = message.role === 'user';
  const pendingSuggestion = useCanvasStore(state => state.pendingSuggestion);
  const { setSelectedPreviewDocument } = useUIStore();
  const { documents: projectDocs } = useProjectDocumentsStore();
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

  // Format the message content
  const formattedContent = formatMessageContent(message.content);

  // Check if message is currently streaming
  const isStreaming = message.isStreaming;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-2 sm:gap-3 max-w-[90%]  ${isUser ? "flex-row-reverse" : "flex-row"}`}>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 text-xs sm:text-sm">
            <span className="font-medium">{isUser ? 'You' : (associateName ?? 'Wansom')}</span>
            <span className="text-muted-foreground text-xs">
              {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>

          {/* Attached document cards — shown on user messages */}
          {isUser && message.attachedDocuments && message.attachedDocuments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.attachedDocuments.slice(0, 3).map((doc: any) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    const projectDoc = projectDocs.find(d => d.id === doc.id);
                    setSelectedPreviewDocument({
                      id: doc.id,
                      title: doc.title,
                      fileUrl: doc.fileUrl || projectDoc?.fileUrl || (projectDoc as any)?.file_url || '',
                      fileType: doc.fileType,
                      fileSize: doc.fileSize,
                      createdAt: projectDoc?.createdAt || (projectDoc as any)?.created_at || '',
                    });
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm text-left"
                  title={`Open ${doc.title}`}
                >
                  <div className="bg-[#74C6B8] rounded-md p-1.5 flex-shrink-0">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-900 max-w-[160px] truncate">{doc.title}</span>
                    <span className="text-xs text-gray-500 uppercase">{doc.fileType}</span>
                  </div>
                </button>
              ))}

              {message.attachedDocuments.length > 3 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm text-left">
                      <div className="bg-gray-100 rounded-md p-1.5 flex-shrink-0">
                        <FileText className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">+{message.attachedDocuments.length - 3} more</span>
                        <span className="text-xs text-gray-500">DOCUMENTS</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto">
                    {message.attachedDocuments.slice(3).map((doc: any) => (
                      <DropdownMenuItem
                        key={doc.id}
                        onClick={() => {
                          const projectDoc = projectDocs.find(d => d.id === doc.id);
                          setSelectedPreviewDocument({
                            id: doc.id,
                            title: doc.title,
                            fileUrl: doc.fileUrl || projectDoc?.fileUrl || (projectDoc as any)?.file_url || '',
                            fileType: doc.fileType,
                            fileSize: doc.fileSize,
                            createdAt: projectDoc?.createdAt || (projectDoc as any)?.created_at || '',
                          });
                        }}
                        className="cursor-pointer gap-2"
                      >
                        <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                        <span className="line-clamp-1 truncate">{doc.title}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          <div
            className={`rounded-lg px-3 py-2 sm:py-3 overflow-hidden ${isUser ? "bg-gray-100 text-gray-900" : "bg-transparent"
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
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center">
                          <LogoAnimation size="sm" className="text-gray-500" />
                          <span className="animate-pulse ml-2">
                            {getStatusText(message.processingStatus, message.statusMessage)}
                          </span>
                        </div>
                        {message.searchPreview && message.searchPreview.length > 0 && (
                          <div className="mt-1 flex flex-col gap-1 border-l-2 border-blue-200 pl-3">
                            {message.searchPreview.map((result, i) => (
                              <div key={i} className="text-xs text-gray-600 leading-snug">
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-700 hover:underline line-clamp-1"
                                >
                                  {result.title}
                                </a>
                                {result.date && (
                                  <span className="ml-1 text-gray-400">{result.date}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
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
                {message.webSearchSources.map((source: { title: string, uri: string }, index: number) => (
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

          {/* View canvas document button — shown when AI generated a new canvas doc */}
          {!isUser && message.canvasUpdated && message.actionType === 'generating' && message.canvasDocumentId && (
            <CanvasDocumentButton canvasDocumentId={message.canvasDocumentId} projectId={projectId} />
          )}

          {/* Associate switch suggestion — shown when a different specialist is a better fit */}
          {!isUser && message.suggestedAssociate && message.conversationId && (
            <AssociateSuggestionCard
              suggestion={message.suggestedAssociate}
              projectId={projectId}
              conversationId={message.conversationId}
              redirectedQuestion={redirectedQuestion}
              userId={user?.id}
            />
          )}
        </div>
      </div>
    </div>
  );
});

// Card shown in chat when AI generates a new canvas document —
// matches the same card style as DocumentArtifact and ReportDownloadCard
function CanvasDocumentButton({ canvasDocumentId, projectId }: { canvasDocumentId: string; projectId: string }) {
  const canvasDocuments = useCanvasStore(state => state.canvasDocuments);
  const setActiveCanvasId = useCanvasStore(state => state.setActiveCanvasId);
  const updateSetting = useProjectSettingsStore(state => state.updateSetting);
  const router = useRouter();
  const doc = canvasDocuments.find(d => d.id === canvasDocumentId);
  const title = doc?.title || 'Generated document';

  const handleOpen = async () => {
    setActiveCanvasId(canvasDocumentId);
    // Enable canvas mode and navigate so the canvas panel is visible even if
    // the user is currently in plain chat mode.
    await updateSetting(projectId, 'canvasMode', true);
    router.push(`/projects/${projectId}?view=canvas`);
  };

  return (
    <div
      className="mt-4 border rounded-lg bg-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md group"
      onClick={handleOpen}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5 flex-shrink-0">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-[#4a7279] transition-colors">
                {title}
              </h4>
              <p className="text-sm text-[#4a7279] mt-0.5">
                Canvas document · Open in editor
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleOpen(); }}
            className="flex-shrink-0"
          >
            <span className="hidden sm:inline">Open in Editor</span>
            <ExternalLink className="h-3.5 w-3.5 sm:hidden" />
          </Button>
        </div>
      </div>
    </div>
  );
}

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

function getRedirectedQuestion(messages: Message[], assistantMessageIndex: number): string | undefined {
  for (let i = assistantMessageIndex - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') {
      return messages[i].content;
    }
  }
  return undefined;
}