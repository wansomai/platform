// src/components/workspace/WorkspaceLayout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConversationDetails } from "@/components/workspace/ConversationDetails";
import {
  ChevronLeft,
  Briefcase,
  X,
} from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useProjectStore } from "@/store/project.store";
import { ChatInput } from "@/components/chat/ChatInput";
import { ErrorState } from "@/components/commons/LoadingState";
import { Project } from "@/types/projects";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string; 
  // Local state for mobile sidebar
  const [workspace, setWorkspace] = useState<Project | null>(null);
  
  // Get state from stores
  const { 
    rightSidebarCollapsed, 
    setRightSidebarCollapsed 
  } = useUIStore();
  const {   
    projects
  } = useProjectStore();
  // Enhanced project loading with all necessary data
  useEffect(() => {
    const initializeWorkspace = async () => {
      if (!projectId) return;
      
      try {
        const project = projects.find((p) => p.id === projectId);
        if (project) {
          setWorkspace(project);
        }
      } catch (error) {
      }
    };

    initializeWorkspace();
  }, [projectId]);

  // Show error state if project failed to load and we're not loading
  if (!workspace) {
    return (
      <ErrorState
        title="Failed to load workspace"
        description="The requested workspace could not be found or loaded."
        action={{
          label: "Try Again",
          onClick: () => window.location.reload()
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {children}
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
  );
}