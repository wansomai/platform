// app/projects/[id]/page.tsx
"use client"

import { useParams } from "next/navigation"
import { useEffect } from "react"
import { ChatInterface } from "@/components/chat/ChatInterface"
import LegalCanvas from "@/components/chat/CanvasInterface"
import { ProjectLoading, ErrorState } from "@/components/commons/LoadingState"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useProjectSettingsStore } from "@/store/workspace-settings.store"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  
  // Get core workspace data (no settings)
  const { project, isLoading: workspaceLoading, error: workspaceError } = useWorkspace(projectId)
  
  // Get settings from dedicated store
  const { settings, isLoading: settingsLoading, fetchSettings } = useProjectSettingsStore()
  
  // Load settings when component mounts
  useEffect(() => {
    if (projectId) {
      fetchSettings(projectId)
    }
  }, [projectId, fetchSettings])
  
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
    <div className="h-full">
      {/* Show Legal Canvas if legal drafting is enabled, otherwise show Chat Interface */}
      {showLegalDrafting ? <LegalCanvas /> : <ChatInterface />}
    </div>
  )
}