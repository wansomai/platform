"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationDetails } from "@/components/workspace/ConversationDetails";
import {
  ChevronRight,
  ChevronLeft,
  Briefcase,
} from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useProjectStore } from "@/store/project.store";
import { ChatInterface } from "@/components/chat/ChatInterface";

export function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;
  
  // Get state from stores
  const { 
    rightSidebarCollapsed, 
    setRightSidebarCollapsed 
  } = useUIStore();
  const { 
    currentProject, 
    fetchProjectById, 
    isLoading 
  } = useProjectStore();

  // Fetch project data when the component mounts
  useEffect(() => {
    fetchProjectById(projectId);
  }, [fetchProjectById, projectId]);

  return (
    <div className="flex h-screen">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs for both mobile and desktop */}
        <div className="border-b bg-white">
          {/* Desktop header/title bar (only showing project title/info) */}
          <div className="hidden lg:flex items-center h-16 px-6 justify-between">
            <div className="flex items-center">
              <Briefcase className="h-5 w-5 text-primary-600 mr-2" />
              <h1 className="text-xl font-semibold">
                {currentProject?.title || "Project Workspace"}
              </h1>
            </div>
            {currentProject && (
              <div className="flex items-center">
                <span className="text-sm text-gray-500">
                  {currentProject.status}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <ChatInterface />
        </div>
      </div>

      {/* Right Sidebar - Context Panel */}
      <div
        className={cn(
          "relative flex flex-col border-l bg-white transition-all duration-300",
          rightSidebarCollapsed ? "w-[60px]" : "w-96"
        )}
      >
        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -left-3 top-3 h-6 w-6 rounded-full border bg-white z-10"
          onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
        >
          {rightSidebarCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        
        {/* Content */}
        <div className="flex h-16 items-center px-4 border-b">
          {!rightSidebarCollapsed && (
            <h3 className="text-sm font-medium">Context Panel</h3>
          )}
        </div>
        
        {!rightSidebarCollapsed && (
          <ScrollArea className="flex-1">
            <ConversationDetails />
          </ScrollArea>
        )}
      </div>
    </div>
  );
}