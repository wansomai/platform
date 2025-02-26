"use client"

import { Documents } from "@/components/workspace/Documents"
import { Team } from "@/components/workspace/Team"
import { Schedule } from "@/components/workspace/Schedule"
import { ChatWorkspace } from "@/components/workspace/Chat"
import { useWorkspaceStore } from "@/store/workspace.store"

export default function WorkspacePage() {
  const activeTab = useWorkspaceStore((state) => state.activeTab)

  return (
    <div className="h-full">
      {activeTab === "documents" && <Documents />}
      {activeTab === "team" && <Team />}
      {activeTab === "schedule" && <Schedule />}
      {activeTab === "chat" && <ChatWorkspace />}
    </div>
  )
}