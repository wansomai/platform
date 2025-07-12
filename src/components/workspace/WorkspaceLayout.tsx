// src/components/workspace/WorkspaceLayout.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConversationDetails } from "@/components/workspace/ConversationDetails";
import { useUIStore } from "@/store/ui.store";
import { ChatInput } from "@/components/chat/ChatInput";
import { WorkspaceLoading, ErrorState } from "@/components/commons/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";

export function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;
  
  const { 
    rightSidebarCollapsed, 
    setRightSidebarCollapsed 
  } = useUIStore();
  
  const { 
    project, 
    isLoading, 
    error 
  } = useWorkspace(projectId);

  if (isLoading) {
    return <WorkspaceLoading />;
  }

  if (error || !project) {
    return (
      <ErrorState
        title="Failed to load workspace"
        description={error || "Workspace not found"}
        action={{
          label: "Try Again",
          onClick: () => window.location.reload()
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            {children}
          </div>

          <div className={cn(
            "transition-all duration-300 border-l border-gray-200 bg-white",
            rightSidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
          )}>
            {!rightSidebarCollapsed && <ConversationDetails />}
          </div>
        </div>
      </div>
      
      <ChatInput />
    </div>
  );
}