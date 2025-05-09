"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { ChatInterface } from "@/components/chat/ChatInterface"
import { useUIStore } from "@/store/ui.store"
import { useProjectStore } from "@/store/project.store"
import LogoAnimation from "@/components/commons/LogoAnimation"


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
        <LogoAnimation size="sm" className="text-gray-500" />
        <span className="animate-pulse">Just a moment...</span>
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