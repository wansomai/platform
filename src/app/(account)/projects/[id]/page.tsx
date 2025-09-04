// app/projects/[id]/page.tsx
"use client"

import { useParams } from "next/navigation"
import { useEffect } from "react"
import { ChatInterface } from "@/components/chat/ChatInterface"
import LegalCanvas from "@/components/chat/CanvasInterface"
import { CanvasChatSplitView } from "@/components/chat/CanvasChatSplitView"
import { ContractChatSplitView } from "@/components/contract/ContractChatSplitView"
import { ErrorState } from "@/components/commons/LoadingState"
import { WorkspaceSkeleton } from "@/components/commons/WorkspaceSkeleton"
import { useProjectSettingsStore } from "@/store/workspace-settings.store"
import { useUIStore } from "@/store/ui.store"
import { Button } from "@/components/ui/button"
import { Briefcase, ChevronLeft, X } from "lucide-react"
import { ChatInput } from "@/components/chat/ChatInput"
import { ConversationDetails } from "@/components/workspace/ConversationDetails"
import { cn } from "@/lib/utils"
import { useChatStore } from "@/store/chat.store"
import { useProjectStore } from "@/store/project.store"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  
  // Get core workspace data (no settings)
  const { projects } = useProjectStore()
  const project = projects.find(p => p.id === projectId)
  
  // Get settings from dedicated store
  const { settings } = useProjectSettingsStore()
  const { 
    rightSidebarCollapsed, 
    setRightSidebarCollapsed 
  } = useUIStore(); 
  const { fetchConversation, isLoading: chatLoading } = useChatStore();
    
  // Load project conversations
  useEffect(() => {
    fetchConversation(projectId).catch(err => console.warn('Failed to load conversations:', err))
  }, [projectId, fetchConversation]);
  
  // Show skeleton loading state if project is loading
  if (chatLoading || (!project && projectId)) {
    return (
      <WorkspaceSkeleton 
        showSidebar={!rightSidebarCollapsed}
        projectTitle={project?.title}
      />
    )
  }

  // Show error state if project couldn't be loaded
  if (!project) {
    return (
      <ErrorState
        title="Workspace not found"
        description="The workspace you're looking for doesn't exist or you don't have access to it."
        action={{
          label: "Go Back",
          onClick: () => window.history.back()
        }}
      />
    )
  }
  
  // Determine which interface to show based on settings
  const showLegalDrafting = settings?.legalDrafting || false
  const showContractReview = settings?.contractReview || false

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-hidden">
          <div className="h-full">
            {showContractReview ? <ContractChatSplitView /> : 
             showLegalDrafting ? <CanvasChatSplitView /> : 
             <ChatInterface />}
          </div>
          <div className="border-t bg-white">
            <ChatInput />
          </div>
        </main>
        
      </div>
      
      <div className={cn(
        "border-l bg-white transition-all duration-200 ease-in-out flex flex-col",
        rightSidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
      )}>
        {/* Sidebar Header */}
        <div className="border-b p-4 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-sm truncate">{project.title}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightSidebarCollapsed(true)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden">
          <ConversationDetails />
        </div>
      </div>
      
      {/* Sidebar Toggle Button - Only show when collapsed */}
      {rightSidebarCollapsed && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRightSidebarCollapsed(false)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 shadow-lg"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
    </div>
  ) 
}