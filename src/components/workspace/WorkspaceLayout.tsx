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
import { useConversationSettingsStore } from "@/store/conversation-settings.store";
import { useConversationDocumentsStore } from "@/store/conversation-documents.store";
import { useChatStore } from "@/store/chat.store";
import { ChatInput } from "@/components/chat/ChatInput";
import { WorkspaceLoading, ErrorState } from "@/components/commons/LoadingState";

export function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;
  
  // Local state for mobile sidebar
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

  // Enhanced project loading with all necessary data
  useEffect(() => {
    const initializeWorkspace = async () => {
      if (!projectId) return;
      
      try {
        setIsInitializing(true);
        
        // Load project data first
        await fetchProjectById(projectId);
        
        // Once project is loaded, initialize conversations
        const conversations = await useChatStore.getState().fetchConversations(projectId);
        
        let currentConv = null;
        // If there are conversations, load the first one
        if (conversations.length > 0) {
          currentConv = await useChatStore.getState().fetchConversation(projectId, conversations[0].id);
        } else {
          // Create a new conversation if none exist
          currentConv = await useChatStore.getState().createConversation(projectId);
        }
        
        // If we have a conversation, preload its settings and documents
        if (currentConv?.id) {
          // Load conversation settings and documents in parallel
          await Promise.all([
            fetchSettings(currentConv.id).catch(err => console.error('Error loading settings:', err)),
            useConversationDocumentsStore.getState().fetchConversationDocuments(currentConv.id).catch(err => console.error('Error loading documents:', err))
          ]);
        }
        
        setIsInitializing(false);
      } catch (error) {
        console.error('Error initializing workspace:', error);
        setIsInitializing(false);
      }
    };

    initializeWorkspace();
  }, [projectId, fetchProjectById, fetchSettings]);

  // Fetch conversation settings when conversation changes (fallback)
  useEffect(() => {
    if (currentConversation?.id && !isInitializing) {
      fetchSettings(currentConversation.id);
    }
  }, [currentConversation?.id, fetchSettings, isInitializing]);

  // Show loading state during initialization
  if (isInitializing || projectLoading) {
    return <WorkspaceLoading title={currentProject?.title} />;
  }

  // Show error state if project failed to load and we're not loading
  if (!currentProject && !projectLoading) {
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