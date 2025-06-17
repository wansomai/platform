// src/components/chat/ChatInput.tsx
"use client"
import { useRef, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Send, 
  Loader2,
  SlidersHorizontal,
  X,
  Paperclip
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useChatStore } from "@/store/chat.store"
import { useUIStore } from "@/store/ui.store"
import { useConversationSettingsStore } from "@/store/conversation-settings.store"
import { useConversationDocumentsStore } from "@/store/conversation-documents.store"
import { useSession } from "next-auth/react"
import { DocumentSelectionModal } from "@/components/modals/DocumentSelectionModal"

interface ChatInputProps {
  onDocumentsAdded?: (count: number) => void;
}

export function ChatInput({ onDocumentsAdded }: ChatInputProps) {
  const params = useParams()
  const projectId = params.id as string
  
  const [input, setInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Get state from stores
  const { addToast } = useUIStore()
  const { 
    currentConversation, 
    sendMessage
  } = useChatStore()

  const {
    settings,
    updateSetting,
    isLoading: isLoadingSettings
  } = useConversationSettingsStore()

  const { 
    documents: conversationDocuments
  } = useConversationDocumentsStore()
 
  const {data: session} = useSession()
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])
  
  // Handle direct prompt sending from external components
  useEffect(() => {
    const handlePromptSendEvent = (event: any) => {
      if (event.detail && event.detail.promptTemplate) {
        if (currentConversation) {
          handleSend(event.detail.promptTemplate);
        }
      }
    };
    
    document.addEventListener('action-prompt-send', handlePromptSendEvent);
    
    return () => {
      document.removeEventListener('action-prompt-send', handlePromptSendEvent);
    };
  }, [currentConversation]);
 
  // Handle send message with streaming
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
      
      if (!customMessage) {
        setInput("");
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

  // Handle setting changes
  const handleSettingChange = async (settingKey: keyof typeof settings, value: boolean) => {
    if (!currentConversation) return;
    
    try {
      await updateSetting(currentConversation.id, settingKey, value);
      addToast({ message: `${settingKey} setting updated`, type: 'success' });
    } catch (error) {
      addToast({ message: `Failed to update ${settingKey} setting`, type: 'error' });
    }
  };

  // Handle documents added
  const handleDocumentsAdded = (count: number) => {
    const message = count === 1 
      ? "Document added to conversation" 
      : `${count} documents added to conversation`;
    addToast({ message, type: 'success' });
    
    // Call parent handler if provided
    onDocumentsAdded?.(count);
  };
  
  return (
    <>
      {/* Floating Input Area with Embedded Tools */}
      <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-50">
        <div className="w-[90vw] max-w-3xl">
          {/* Input Area with embedded icons */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg focus-within:border-primary-300 transition-colors relative">
            {/* Left side icons */}
            <div className="absolute left-6 bottom-2 flex items-center gap-1 z-10">
              {/* Documents Tool */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocumentModal(true)}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
                title={`Documents (${conversationDocuments?.length || 0})`}
              >
                <Paperclip className="h-6 w-6 text-gray-500" />
              </Button>

              {/* Settings Tool */}
              <DropdownMenu open={showSettings} onOpenChange={setShowSettings}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-fit px-2 hover:bg-gray-100 rounded-md"
                    title="AI Settings" 
                  >
                    <SlidersHorizontal className="h-6 w-6 text-gray-500" /> Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-72 p-4 mb-2"
                  side="top"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-gray-500">Workspace Settings</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSettings(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="web-search" className="font-medium text-sm">
                            Web search
                          </Label>
                         
                        </div>
                        <Switch 
                          id="web-search" 
                          checked={settings.webSearch}
                          disabled={isLoadingSettings}
                          onCheckedChange={(checked) => {
                            handleSettingChange('webSearch', checked);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="legal-drafting" className="font-medium text-sm">
                            Legal drafting
                          </Label>
                          
                        </div>
                        <Switch 
                          id="legal-drafting" 
                          checked={settings.legalDrafting}
                          disabled
                        />
                      </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="cite-sources" className="font-medium text-sm">
                            Cite sources
                          </Label>
                          
                        </div>
                        <Switch 
                          id="cite-sources" 
                          checked={settings.citeSources}
                          disabled={isLoadingSettings}
                          onCheckedChange={(checked) => {
                            handleSettingChange('citeSources', checked);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="suggest-actions" className="font-medium text-sm">
                            Suggest actions
                          </Label>
                         
                        </div>
                        <Switch 
                          id="suggest-actions" 
                          checked={settings.suggestActions}
                          disabled={isLoadingSettings}
                          onCheckedChange={(checked) => {
                            handleSettingChange('suggestActions', checked);
                          }}
                        />
                      </div>
                      
                    
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="border-0 resize-none min-h-[52px] max-h-[120px] pl-6 pr-16 pb-7 pt-3 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-gray-500"
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

      {/* Document Selection Modal */}
      {currentConversation && (
        <DocumentSelectionModal
          open={showDocumentModal}
          onOpenChange={setShowDocumentModal}
          conversationId={currentConversation.id}
          onDocumentsAdded={handleDocumentsAdded}
        />
      )}
    </>
  )
}