"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { ProjectOverview } from "@/components/workspace/ProjectOverview"
import { Documents } from "@/components/workspace/Documents"
import { Team } from "@/components/workspace/Team"
import { ChatInterface } from "@/components/chat/ChatInterface"
import { ClientInfo } from "@/components/clients/ClientInfo"
import { useUIStore } from "@/store/ui.store"
import { useProjectStore } from "@/store/project.store"
import { Loader2 } from "lucide-react"
import { Integrations } from "@/components/workspace/Integrations"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const { activeWorkspaceTab } = useUIStore()
  const { currentProject, fetchProjectById, isLoading } = useProjectStore()
  
  // Fetch project data once on mount
  useEffect(() => {
    const loadProjectData = async () => {
      if (projectId && !currentProject && !isLoading) {
        console.log("Initial project data fetch");
        await fetchProjectById(projectId);
      }
    };
    
    loadProjectData();
  }, []); // Empty dependency array for initial mount only
  
  // Show loading state if project is loading
  if (isLoading || !currentProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
          <p className="text-gray-500">Loading project... </p>
        </div>
      </div>
    )
  }
  return (
    <div className="h-full">
      {activeWorkspaceTab === "chat" && <ChatInterface/>}
    </div>
  )
}