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
  }, []); // Empty dependency array for initial mount only
  
  // Fetch conversation settings when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      fetchSettings(currentConversation.id);
    }
  }, [currentConversation?.id, fetchSettings]);
  
  // Show loading state if project is loading
  if (isLoading || !currentProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
        <LogoAnimation size="sm" className="text-gray-500" />
        <span className="animate-pulse">Just a moment...</span>
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