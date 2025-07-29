// app/projects/[id]/page.tsx
"use client"

import { useParams } from "next/navigation"
import { useEffect } from "react"
import { ChatInterface } from "@/components/chat/ChatInterface"
import LegalCanvas from "@/components/chat/CanvasInterface"
import { ProjectLoading, ErrorState } from "@/components/commons/LoadingState"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useProjectSettingsStore } from "@/store/workspace-settings.store"
import { useUIStore } from "@/store/ui.store"
import { Button } from "@/components/ui/button"
import { Briefcase, ChevronLeft, X } from "lucide-react"
import { ChatInput } from "@/components/chat/ChatInput"
import { ConversationDetails } from "@/components/workspace/ConversationDetails"
import { cn } from "@/lib/utils"
import { useProjectInstructionsStore } from "@/store/workspace-instructions.store"
import { useProjectDocumentsStore } from "@/store/workspace-documents.store"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  
  // Get core workspace data (no settings)
  const { project, isLoading: workspaceLoading, error: workspaceError } = useWorkspace(projectId)
  
  // Get settings from dedicated store
  const { settings, isLoading: settingsLoading, fetchSettings } = useProjectSettingsStore()
    const { 
      rightSidebarCollapsed, 
      setRightSidebarCollapsed 
    } = useUIStore(); 
    const { fetchInstructions } = useProjectInstructionsStore()
    const { fetchProjectDocuments } = useProjectDocumentsStore()
   // Load project settings and instructions only when component mounts
  useEffect(() => {
    if (projectId) {
      // Parallel loading with error handling
      Promise.all([
        fetchSettings(projectId).catch(err => console.warn('Failed to load settings:', err)),
        fetchInstructions(projectId).catch(err => console.warn('Failed to load instructions:', err)),
        fetchProjectDocuments(projectId).catch(err => console.warn('Failed to load documents:', err))
      ]);
    }
  }, [projectId, fetchSettings, fetchInstructions, fetchProjectDocuments]);
  
  const isLoading = workspaceLoading || settingsLoading
  const error = workspaceError
  
  // Show loading state if project is loading
  if (isLoading || (!project && projectId)) {
    return <ProjectLoading projectTitle={project?.title} />
  }

  // Show error state if project couldn't be loaded
  if (error || (!isLoading && !project)) {
    return (
      <ErrorState
        title="Workspace not found"
        description={error || "The workspace you're looking for doesn't exist or you don't have access to it."}
        action={{
          label: "Go Back",
          onClick: () => window.history.back()
        }}
      />
    )
  }
  
  // Determine which interface to show based on settings
  const showLegalDrafting = settings?.legalDrafting || false

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
    <div className="h-full">
      {/* Show Legal Canvas if legal drafting is enabled, otherwise show Chat Interface */}
      {showLegalDrafting ? <LegalCanvas /> : <ChatInterface />}
    </div>
    </main>
           {/* Chat Input - Always visible at bottom */}
            <div className="border-t bg-white">
              <ChatInput />
            </div>
    </div>
      {/* Right Sidebar - Conversation Details */}
          <div className={cn(
            "border-l bg-white transition-all duration-200 ease-in-out flex flex-col",
            rightSidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
          )}>
            {/* Sidebar Header */}
            <div className="border-b p-4 flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-sm">Details</span>
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
