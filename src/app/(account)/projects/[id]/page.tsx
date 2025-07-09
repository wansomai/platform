// app/projects/[id]/page.tsx
"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { ChatInterface } from "@/components/chat/ChatInterface"
import LegalCanvas from "@/components/chat/CanvasInterface"
import { useUIStore } from "@/store/ui.store"
import { useProjectStore } from "@/store/project.store"
import { useConversationSettingsStore } from "@/store/conversation-settings.store"
import { useChatStore } from "@/store/chat.store"
import { ProjectLoading, ErrorState } from "@/components/commons/LoadingState"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const { activeWorkspaceTab } = useUIStore()
  const { currentProject, fetchProjectById, isLoading } = useProjectStore()
  const { currentConversation } = useChatStore()
  const { settings, fetchSettings, isLoading: isLoadingSettings } = useConversationSettingsStore()
  
  // Fetch project data once on mount
  useEffect(() => {
    const loadProjectData = async () => {
      if (projectId && !currentProject && !isLoading) {
        await fetchProjectById(projectId);
      }
    };
    
    loadProjectData();
  }, [projectId, currentProject, isLoading, fetchProjectById]);
  
  // Fetch conversation settings when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      fetchSettings(currentConversation.id);
    }
  }, [currentConversation?.id, fetchSettings]);
  
  // Show loading state if project is loading or settings are loading for first time
  if (isLoading || (!currentProject && projectId)) {
    return <ProjectLoading projectTitle={currentProject?.title} />
  }

  // Show error state if project couldn't be loaded
  if (!isLoading && !currentProject) {
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

  // Determine which interface to show based on legal drafting setting
  const showLegalDrafting = settings.legalDrafting;

  return (
    <div className="h-full">
      {/* Show Legal Canvas if legal drafting is enabled, otherwise show Chat Interface */}
      {showLegalDrafting ? <LegalCanvas /> : <ChatInterface />}
    </div>
  )
}