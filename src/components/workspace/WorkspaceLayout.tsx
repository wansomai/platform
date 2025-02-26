"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationDetails } from "@/components/workspace/ConversationDetails";
import {
  FileText,
  Users,
  Calendar,
  MessagesSquare,
  Info,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Cog,
} from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useProjectStore } from "@/store/project.store";

// Define the tabs with their icons and labels
const tabs = [
  { id: "overview", label: "Overview", icon: Info },
  { id: "chat", label: "Assistant", icon: MessagesSquare },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "client", label: "Client", icon: Briefcase },
  { id: "team", label: "Team", icon: Users },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "settings", label: "Settings", icon: Cog },
];

export function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;
  
  // Get state from stores
  const { 
    activeWorkspaceTab, 
    setActiveWorkspaceTab,
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
    if (projectId && !currentProject) {
      fetchProjectById(projectId);
    }
  }, [projectId, currentProject, fetchProjectById]);

  return (
    <div className="flex h-screen lg:pl-64">
      {/* Left Sidebar for Project Navigation */}
      <div className="hidden fixed inset-y-0 left-0 w-64 lg:flex lg:flex-col bg-white border-r border-gray-200">
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <h2 className="text-lg font-semibold truncate">
            {isLoading ? "Loading..." : currentProject?.title || "Project"}
          </h2>
        </div>
        
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 p-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeWorkspaceTab === tab.id ? "default" : "ghost"}
                className="justify-start"
                onClick={() => setActiveWorkspaceTab(tab.id)}
              >
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.label}
              </Button>
            ))}
          </nav>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile tabs */}
        <div className="block lg:hidden border-b">
          <ScrollArea orientation="horizontal" className="w-full">
            <div className="flex p-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeWorkspaceTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  className="mr-1"
                  onClick={() => setActiveWorkspaceTab(tab.id)}
                >
                  <tab.icon className="mr-1 h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        {/* Main content */}
        {children}
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
            {/* The content here will change based on the active tab */}
            {activeWorkspaceTab === "chat" && <ConversationDetails />}
            {/* Other tab-specific context panels will be rendered here */}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}