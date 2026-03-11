'use client';
// Simplified chat panel for the guest drafting flow.
// Only shows jurisdiction selector + file upload. No auth, no project context.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Globe, Paperclip, Loader2, CheckCircle, X, Copy, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { JURISDICTIONS } from '@/lib/jurisdictions';
import { cn } from '@/lib/utils';
import MessageDisplay from '@/components/chat/MessageDisplay';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  isStreaming?: boolean;
  statusText?: string;
}

interface GuestChatPanelProps {
  documentHtml: string | null;
  jurisdictionId: string;
  documentType: string;
  documentTitle?: string;
  documentDescription?: string;
  pendingSuggestion?: { suggestedHtml: string; originalHtml: string } | null;
  onJurisdictionChange: (id: string) => void;
  onDocumentUpdate: (html: string, originalHtml: string) => void;
  onAcceptSuggestion?: (html: string) => void;
  onRejectSuggestion?: () => void;
  onCanvasStreamingUpdate?: (html: string | null) => void;
}

// Jurisdictions we prioritise for the guest (African markets first)
const PRIORITY_JURISDICTION_IDS = ['ng', 'ke', 'za', 'ug', 'tz', 'gh', 'uk-england-wales', 'us-federal'];

export default function GuestChatPanel({
  documentHtml,
  jurisdictionId,
  documentType,
  documentTitle,
  documentDescription,
  pendingSuggestion,
  onJurisdictionChange,
  onDocumentUpdate,
  onAcceptSuggestion,
  onRejectSuggestion,
  onCanvasStreamingUpdate,
}: GuestChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [descriptionCollapsed, setDescriptionCollapsed] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showJurisdictionMenu, setShowJurisdictionMenu] = useState(false);
  const [jurisdictionSearch, setJurisdictionSearch] = useState('');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const jurisdictionMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentJurisdiction = JURISDICTIONS.find((j) => j.id === jurisdictionId);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close jurisdiction menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (jurisdictionMenuRef.current && !jurisdictionMenuRef.current.contains(e.target as Node)) {
        setShowJurisdictionMenu(false);
        setJurisdictionSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredJurisdictions = JURISDICTIONS.filter((j) => {
    const q = jurisdictionSearch.toLowerCase();
    return j.name.toLowerCase().includes(q) || j.country.toLowerCase().includes(q);
  }).sort((a, b) => {
    const ai = PRIORITY_JURISDICTION_IDS.indexOf(a.id);
    const bi = PRIORITY_JURISDICTION_IDS.indexOf(b.id);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleCopy = useCallback((content: string, index: number) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setMessages((prev) => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
    setIsStreaming(true);
    setDescriptionCollapsed(true);

    // Placeholder streaming assistant message
    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      statusText: 'Updating document…',
    }]);

    let latestSuggestedHtml: string | null = null;
    const originalHtml = documentHtml || '';

    try {
      const response = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          documentHtml,
          jurisdictionId,
          documentType,
          documentTitle,
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);

            if (chunk.type === 'text') {
              streamedText += chunk.content;
              // Strip embedded document-update blocks from the visible explanation text
              const displayText = streamedText.replace(/```document-update[\s\S]*?```/g, '').trim();
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: displayText,
                };
                return updated;
              });
            } else if (chunk.type === 'document_update') {
              latestSuggestedHtml = chunk.html;
              // Stream the updated HTML directly into the canvas overlay
              onCanvasStreamingUpdate?.(chunk.html);
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  statusText: 'Review changes in the canvas…',
                };
                return updated;
              });
            }
          } catch {
            // Ignore malformed chunks
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
          statusText: undefined,
          content: 'Sorry, something went wrong. Please try again.',
        };
        return updated;
      });
      return;
    } finally {
      setIsStreaming(false);

      // Finalise the assistant message — remove streaming flags
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        const finalContent = last.content?.trim()
          || (latestSuggestedHtml
            ? 'I\'ve updated your document. Review the changes in the canvas on the left.'
            : 'I couldn\'t generate changes. Please try rephrasing your request.');
        updated[updated.length - 1] = {
          ...last,
          isStreaming: false,
          statusText: undefined,
          content: finalContent,
        };
        return updated;
      });

      // Clear canvas streaming preview, then show the diff for accept/reject
      if (latestSuggestedHtml) {
        onCanvasStreamingUpdate?.(null);
        onDocumentUpdate(latestSuggestedHtml, originalHtml);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <style>{`.desc-scroll::-webkit-scrollbar { display: none; }`}</style>

      {/* Document description card */}
      {(documentDescription || documentTitle) && (
        <div className="border-b border-gray-100 flex-shrink-0">
          {descriptionCollapsed ? (
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-gray-500 truncate">{documentTitle || 'Document'}</p>
            </div>
          ) : (
            <>
              <div
                className="px-4 pt-3 overflow-y-auto desc-scroll"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: descriptionExpanded ? '75vh' : undefined } as React.CSSProperties}
              >
                {documentTitle && (
                  <p className="text-sm font-semibold text-gray-800 mb-1">{documentTitle}</p>
                )}
                {documentDescription && (
                  <div
                    className={`text-xs text-gray-600 leading-relaxed blog-content ${descriptionExpanded ? 'pb-2' : 'line-clamp-3'}`}
                    dangerouslySetInnerHTML={{ __html: documentDescription }}
                  />
                )}
              </div>
              {documentDescription && (
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="px-4 pb-2 pt-1 text-xs text-teal-600 hover:text-teal-800 font-medium text-left w-full"
                >
                  {descriptionExpanded ? 'Show less' : 'View more'}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`.guest-messages::-webkit-scrollbar { display: none; }`}</style>

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('flex gap-2 sm:gap-3 max-w-[90%]', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div className="flex flex-col min-w-0 flex-1">
                {/* Name + timestamp */}
                <div className="flex items-center gap-2 mb-1 text-xs sm:text-sm">
                  <span className="font-medium">{msg.role === 'user' ? 'You' : 'Wansom'}</span>
                  {msg.timestamp && (
                    <span className="text-muted-foreground text-xs">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 sm:py-3 overflow-hidden',
                    msg.role === 'user' ? 'bg-gray-100 text-gray-900' : 'bg-transparent'
                  )}
                >
                  {msg.isStreaming ? (
                    <div className="flex items-center gap-1.5">
                      <span className="flex gap-1">
                        {[0, 150, 300].map((d) => (
                          <span
                            key={d}
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${d}ms` }}
                          />
                        ))}
                      </span>
                      {msg.statusText && (
                        <span className="text-xs text-gray-500 animate-pulse">{msg.statusText}</span>
                      )}
                    </div>
                  ) : (
                    <MessageDisplay content={msg.content} className="text-sm" />
                  )}
                </div>

                {/* Copy button — assistant messages only */}
                {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn('h-8 gap-1.5', copiedIndex === i ? 'min-w-[72px] text-green-600' : 'w-8 px-0')}
                      onClick={() => handleCopy(msg.content, i)}
                    >
                      {copiedIndex === i ? (
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
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 bg-gray-50">
        <div className="relative w-full">
          <div className="bg-white rounded-t-xl border-t-2 border-[#0a4b5e] focus-within:border-primary-300 transition-colors relative shadow-lg">

            {/* Accept / Reject suggestion banner */}
            {pendingSuggestion && (
              <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-xs text-gray-600 flex-1">AI suggested changes to your document</span>
                  <button
                    type="button"
                    onClick={() => onAcceptSuggestion?.(pendingSuggestion.suggestedHtml)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors whitespace-nowrap"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onRejectSuggestion?.()}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors whitespace-nowrap"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            )}

            {/* Attached file chip */}
            {attachedFileName && (
              <div className="px-6 pt-3 pb-1 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#E9F5F3] rounded-lg">
                  <div className="bg-[#74C6B8] rounded-md p-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 max-w-[150px] truncate">{attachedFileName}</span>
                  <button
                    type="button"
                    onClick={() => setAttachedFileName(null)}
                    className="hover:bg-blue-100 rounded-full p-1 transition-colors"
                  >
                    <span className="text-gray-500 text-xs leading-none">✕</span>
                  </button>
                </div>
              </div>
            )}

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to modify a clause, explain a legal term…"
              disabled={isStreaming}
              className="border-0 resize-none rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-gray-500 overflow-y-auto min-h-[100px] max-h-[300px] pl-6 pr-16 pt-4 pb-16"
            />

            {/* Bottom-left icons: Paperclip + Jurisdiction */}
            <div className="absolute flex items-center gap-2 z-10 left-6 bottom-2">
              {/* File attach */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-md hover:bg-gray-100"
                title="Attach reference document"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Paperclip className="h-4 w-4 text-gray-500" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAttachedFileName(file.name);
                    setMessages((prev) => [
                      ...prev,
                      { role: 'assistant', content: `File "${file.name}" attached. I'll use it as reference context for your requests.`, timestamp: Date.now() },
                    ]);
                  }
                }}
              />

              {/* Jurisdiction selector */}
              <div className="relative" ref={jurisdictionMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowJurisdictionMenu(!showJurisdictionMenu)}
                  className="h-8 w-8 sm:w-fit sm:px-2 p-0 rounded-md flex items-center gap-1 justify-center hover:bg-gray-100 border border-input bg-background"
                  title={currentJurisdiction?.name || 'Select jurisdiction'}
                >
                  <Globe className={`h-4 w-4 ${currentJurisdiction ? 'text-teal-700' : 'text-gray-500'}`} />
                  <span className="hidden sm:inline text-sm text-gray-600">
                    {currentJurisdiction?.name || 'Jurisdiction'}
                  </span>
                </button>

                {showJurisdictionMenu && (
                  <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-[260px]">
                    <div className="p-2 border-b border-gray-100">
                      <input
                        type="text"
                        placeholder="Search jurisdictions…"
                        value={jurisdictionSearch}
                        onChange={(e) => setJurisdictionSearch(e.target.value)}
                        className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded outline-none focus:border-primary"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredJurisdictions.map((j) => (
                        <button
                          key={j.id}
                          type="button"
                          onClick={() => {
                            onJurisdictionChange(j.id);
                            setShowJurisdictionMenu(false);
                            setJurisdictionSearch('');
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm hover:bg-green-50 transition-colors',
                            j.id === jurisdictionId ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'
                          )}
                        >
                          {j.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Send button */}
            <Button
              className="primary text-white z-10 absolute right-3 bottom-3 shadow-md h-10 w-10 rounded-lg"
              disabled={!input.trim() || isStreaming}
              onClick={sendMessage}
              type="button"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Send className="h-4 w-4 text-white" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
