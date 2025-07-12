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
  Paperclip,
  Settings
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useChatStore } from "@/store/chat.store"
import { useUIStore } from "@/store/ui.store"
import { useProjectSettingsStore } from "@/store/workspace-settings.store"
import { useProjectDocumentsStore } from "@/store/workspace-documents.store"
import { useSession } from "next-auth/react"
import ProAccessModal from "../modals/ProAccess"
import { UploadDocumentModal } from "../modals/UploadModal"

interface ChatInputProps {
  onDocumentsAdded?: (count: number) => void;
}

export function ChatInput({ onDocumentsAdded }: ChatInputProps) {
  const params = useParams()
  const projectId = params.id as string
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProAcess, setShowProAccess] = useState(false)
  const [isRequestingPro, setIsRequestingPro] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  
  // Get state from stores
  const { sendMessage, isLoading } = useChatStore()
  const { rightSidebarCollapsed, setRightSidebarCollapsed } = useUIStore()
  const { settings, updateSetting, isLoading: isLoadingSettings } = useProjectSettingsStore()
  const { fetchProjectDocuments } = useProjectDocumentsStore()
  const { data: session } = useSession()
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])
  
  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || isSubmitting || !projectId) return
    
    const messageContent = input.trim()
    setInput("")
    setIsSubmitting(true)
    
    try {
      await sendMessage(projectId, messageContent, {
        settings: settings
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  // Handle setting changes
  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
    if (!projectId) return
    
    try {
      await updateSetting(projectId, key, value)
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }
  
  // Handle documents added
  const handleDocumentsAdded = (documents: any[]) => {
    const count = documents.length
    // Show success notification
    const { addToast } = useUIStore.getState()
    addToast({
      message: `${count} document${count !== 1 ? 's' : ''} added to project`,
      type: "success"
    })
    onDocumentsAdded?.(count)
    
    // Refresh project documents
    if (projectId) {
      fetchProjectDocuments(projectId)
    }
  }
  
  // Toggle sidebar function
  const toggleSidebar = () => {
    setRightSidebarCollapsed(!rightSidebarCollapsed);
  };

  // Handle Pro access request
  const handleRequestProAccess = async() => {
    setIsRequestingPro(true);
    const payload = {
      email: session?.user.email,
      name: session?.user.name
    }
    try {
      const response = await fetch('/api/prorequests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      await response.json();
      setShowProAccess(false);
    } catch (error) {
      console.error('Error:', error);
      setIsRequestingPro(false);
      setShowProAccess(false);
    } finally {
      setIsRequestingPro(false);
      setShowProAccess(false);
    }
  };
  
  return (
    <>
      {/* Floating Input Area with Embedded Tools */}
      <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-50">
        <div className="w-[90vw] max-w-3xl">
          {/* Input Area with embedded icons */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg focus-within:border-primary-300 transition-colors relative">
            {/* Left side icons */}
            <div className="absolute left-6 bottom-2 flex items-center gap-1 z-10 w-full">
              {/* Documents Tool */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocumentModal(true)}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
                title="Upload documents"
              >
                <Paperclip className="h-4 w-4 text-gray-500" />
              </Button>

              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
                    title="Chat settings"
                  >
                    <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 p-4">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Chat Settings</h4>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label 
                            htmlFor="cite-sources" 
                            className="text-sm font-normal text-gray-700"
                          >
                            Cite Sources
                          </Label>
                          <p className="text-xs text-gray-500">
                            Include document references in responses
                          </p>
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
                        <div className="space-y-0.5">
                          <Label 
                            htmlFor="web-search" 
                            className="text-sm font-normal text-gray-700"
                          >
                            Web Search
                          </Label>
                          <p className="text-xs text-gray-500">
                            Search the web for current information
                          </p>
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
                        <div className="space-y-0.5">
                          <Label 
                            htmlFor="suggest-actions" 
                            className="text-sm font-normal text-gray-700"
                          >
                            Suggest Actions
                          </Label>
                          <p className="text-xs text-gray-500">
                            Show suggested follow-up actions
                          </p>
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

              {/* Settings Button for Sidebar Toggle */}
              <button 
                className="h-8 w-fit px-3 py-2 rounded-lg shadow-lg flex gap-1 items-center border-gray-10 border" 
                onClick={toggleSidebar}
                title="Project settings"
              > 
                <Settings className="h-4 w-4 text-gray-500 text-xs" />
                Settings
              </button>
            </div>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Wansom..."
              className="border-0 resize-none min-h-[90px] max-h-[180px] pl-6 pr-16 pt-4 pb-6 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-gray-500"
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
      
      <ProAccessModal 
        isOpen={showProAcess}
        onClose={() => setShowProAccess(false)}
        onRequestAccess={handleRequestProAccess}
        isLoading={isRequestingPro}
      />   
      
      {/* Document Selection Modal */}
      <UploadDocumentModal
        open={showDocumentModal}
        mode="upload-and-attach"
        onOpenChange={setShowDocumentModal}
        projectId={projectId}
        onDocumentsAdded={handleDocumentsAdded}
      />
    </>
  )
}