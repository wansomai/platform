"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationDetails } from "@/components/workspace/ConversationDetails";
import {
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Settings,
  X,
  Loader2,
} from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useProjectStore } from "@/store/project.store";
import { useConversationSettingsStore } from "@/store/conversation-settings.store";
import { useChatStore } from "@/store/chat.store";
import { ChatInterface } from "@/components/chat/ChatInterface";
import LegalCanvas from "@/components/chat/CanvasInterface";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetClose 
} from "@/components/ui/sheet";
import LogoAnimation from "@/components/commons/LogoAnimation";

// Loading component for workspace initialization
const WorkspaceLoading = ({ projectTitle }: { projectTitle?: string }) => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="flex flex-col items-center space-y-4 text-center max-w-md mx-auto p-6">
      <div className="relative">
        <LogoAnimation size="lg" className="text-primary-600" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Setting up your workspace
        </h2>
        {projectTitle && (
          <p className="text-sm text-gray-600">
            Preparing "{projectTitle}"
          </p>
        )}
        <p className="text-sm text-gray-500">
          Loading your workspace...
        </p>
      </div>
  </div></div>
);

export function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;
  
  // Local state for mobile sidebar
  const [showMobileContext, setShowMobileContext] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Get state from stores
  const { 
    rightSidebarCollapsed, 
    setRightSidebarCollapsed 
  } = useUIStore();
  const { 
    currentProject, 
    fetchProjectById, 
    isLoading: projectLoading 
  } = useProjectStore();
  const { currentConversation } = useChatStore();
  const { settings, fetchSettings } = useConversationSettingsStore();

  // Project loading without artificial delays
  useEffect(() => {
    const initializeWorkspace = async () => {
      if (!projectId) return;
      
      try {
        setIsInitializing(true);
        await fetchProjectById(projectId);
        setIsInitializing(false);
      } catch (error) {
        console.error('Error initializing workspace:', error);
        setIsInitializing(false);
      }
    };

    initializeWorkspace();
  }, [projectId, fetchProjectById]);

  // Fetch conversation settings when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      fetchSettings(currentConversation.id);
    }
  }, [currentConversation?.id, fetchSettings]);

  // Show loading state during initialization
  if (isInitializing || projectLoading) {
    return <WorkspaceLoading projectTitle={currentProject?.title} />;
  }

  // Show error state if project failed to load and we're not loading
  if (!currentProject && !projectLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="text-red-500">
            <X className="h-12 w-12 mx-auto mb-4" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Failed to load workspace
          </h2>
          <p className="text-gray-600">
            The requested workspace could not be found or loaded.
          </p>
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="mt-4"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Determine which interface to show based on legal drafting setting
  const showLegalDrafting = settings.legalDrafting;

  return (
    <div className="flex h-screen">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <div className="border-b bg-white block md:hidden">
          <div className="flex items-center h-16 px-4 justify-between">
            <div className="flex items-center">
              <Briefcase className="h-5 w-5 text-primary-600 mr-2" />
              <h1 className="text-lg font-semibold truncate">
                {currentProject?.title || "Project Workspace"}
              </h1>
            </div>
            
            {/* Show status and context button */}
            <div className="flex items-center space-x-2">             
              {/* Context panel button - only visible on mobile/tablet */}
              <Sheet open={showMobileContext} onOpenChange={setShowMobileContext}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="lg:hidden"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Context</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-[90%] max-w-md sm:max-w-lg lg:hidden">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center h-16 px-4 border-b">
                      <div className="flex items-center">
                        <Briefcase className="h-5 w-5 text-primary-600 mr-2" />
                        <h1 className="text-lg font-semibold truncate">
                          {currentProject?.title || "Project Workspace"}
                        </h1>
                      </div>
                      <SheetClose asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </SheetClose>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <ConversationDetails />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        
        {/* Main content - Switch between ChatInterface and LegalCanvas */}
        <div className="flex-1 overflow-auto">
          {showLegalDrafting ? <LegalCanvas /> : <ChatInterface />}
        </div>
      </div>

      {/* Right Sidebar - Context Panel (Desktop only) */}
      <div
        className={cn(
          "relative border-l bg-white transition-all duration-300 hidden lg:flex lg:flex-col",
          rightSidebarCollapsed ? "w-[60px]" : "w-80"
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
        
        {/* Content - only show when expanded */}
        <div className="flex h-16 items-center px-4 border-b">
          {!rightSidebarCollapsed && (
             <div className="flex items-center overflow-x-hidden">
               <Briefcase className="h-5 w-5 text-primary-600 mr-2" />
               <h1 className="text-lg font-semibold truncate">
                 {currentProject?.title || "Project Workspace"}
               </h1>
             </div>
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