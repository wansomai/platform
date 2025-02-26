"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { ProjectOverview } from "@/components/workspace/ProjectOverview"
import { Documents } from "@/components/workspace/Documents"
import { Team } from "@/components/workspace/Team"
import { Schedule } from "@/components/workspace/Schedule"
import { ChatInterface } from "@/components/chat/ChatInterface"
import { ClientInfo } from "@/components/clients/ClientInfo"
import { useUIStore } from "@/store/ui.store"
import { useProjectStore } from "@/store/project.store"
import { Loader2 } from "lucide-react"

export default function WorkspacePage() {
  const params = useParams()
  const projectId = params.id as string
  
  const { activeWorkspaceTab } = useUIStore()
  const { currentProject, fetchProjectById, isLoading } = useProjectStore()
  
  useEffect(() => {
    if (projectId && !currentProject) {
      fetchProjectById(projectId)
    }
  }, [projectId, currentProject, fetchProjectById])
  
  // Show loading state if project is loading
  if (isLoading && !currentProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
          <p className="text-gray-500">Loading project...</p>
        </div>
      </div>
    )
  }
  
  // Render the appropriate component based on the active tab
  return (
    <div className="h-full">
      {activeWorkspaceTab === "overview" && <ProjectOverview />}
      {activeWorkspaceTab === "documents" && <Documents />}
      {activeWorkspaceTab === "team" && <Team />}
      {activeWorkspaceTab === "schedule" && <Schedule />}
      {activeWorkspaceTab === "chat" && <ChatInterface />}
      {activeWorkspaceTab === "client" && <ClientInfo />}
      {activeWorkspaceTab === "settings" && (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Project Settings</h1>
          <p className="text-gray-500">Project settings will be implemented in a future update.</p>
        </div>
      )}
    </div>
  )
}