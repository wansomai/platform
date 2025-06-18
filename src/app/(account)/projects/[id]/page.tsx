"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { ChatInterface } from "@/components/chat/ChatInterface"
import LegalCanvas from "@/components/chat/CanvasInterface"
import { useUIStore } from "@/store/ui.store"
import { useProjectStore } from "@/store/project.store"
import { useConversationSettingsStore } from "@/store/conversation-settings.store"
import { useChatStore } from "@/store/chat.store"
import LogoAnimation from "@/components/commons/LogoAnimation"

// Enhanced loading component for the project page
const ProjectLoadingState = ({ title }: { title?: string }) => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="flex flex-col items-center space-y-4 text-center">
      <div className="relative">
        <LogoAnimation size="md" className="text-primary-600" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-gray-900">
          {title ? `Loading ${title}` : 'Loading workspace'}
        </h3>
        <p className="text-sm text-gray-500 animate-pulse">
          Setting up your AI assistant...
        </p>
      </div>
    </div>
  </div>
)

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
  }, [projectId, currentProject, isLoading, fetchProjectById]); // Added dependencies for better effect management
  
  // Fetch conversation settings when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      fetchSettings(currentConversation.id);
    }
  }, [currentConversation?.id, fetchSettings]);
  
  // Show loading state if project is loading or settings are loading for first time
  if (isLoading || (!currentProject && projectId)) {
    return <ProjectLoadingState title={currentProject?.title} />
  }

  // Show error state if project couldn't be loaded
  if (!isLoading && !currentProject) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-gray-400">
            <LogoAnimation size="md" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">
              Workspace not found
            </h3>
            <p className="text-sm text-gray-500">
              The workspace you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
        </div>
      </div>
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