// src/components/workspace/WorkspaceLayout.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { useChatStore, type Conversation } from "@/store/chat.store";
import { ChatInput } from "@/components/chat/ChatInput";
import { WorkspaceLoading, ErrorState } from "@/components/commons/LoadingState";

// Loading phases for better UX
type LoadingPhase = 'project' | 'conversations' | 'settings' | 'complete' | 'error';

interface LoadingState {
  phase: LoadingPhase;
  projectLoaded: boolean;
  conversationsLoaded: boolean;
  settingsLoaded: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;
  
  // Centralized loading state
  const [loadingState, setLoadingState] = useState<LoadingState>({
    phase: 'project',
    projectLoaded: false,
    conversationsLoaded: false,
    settingsLoaded: false,
    hasError: false,
  });

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
  const { fetchSettings } = useConversationSettingsStore();

  // Optimized loading function with parallel execution
  const initializeWorkspace = useCallback(async () => {
    if (!projectId) return;
    
    console.log('🚀 Starting workspace initialization for project:', projectId);
    
    try {
      // Phase 1: Load project (essential for rendering workspace shell)
      setLoadingState(prev => ({ ...prev, phase: 'project' }));
      
      const project = await fetchProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      
      setLoadingState(prev => ({ 
        ...prev, 
        projectLoaded: true, 
        phase: 'conversations' 
      }));
      
      // Phase 2: Load conversations and other data in parallel
      const chatStore = useChatStore.getState();
      
      // Load conversations with proper typing
      let conversations: Conversation[] = [];
      try {
        conversations = await chatStore.fetchConversations(projectId);
      } catch (err) {
        console.error('Failed to load conversations:', err);
        conversations = [];
      }
      
      // Add small delay to prevent UI flashing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setLoadingState(prev => ({ 
        ...prev, 
        conversationsLoaded: true, 
        phase: 'settings' 
      }));
      
      // Phase 3: Handle conversation setup
      let currentConv = null;
      
      if (conversations.length > 0) {
        // Load existing conversation
        currentConv = await chatStore.fetchConversation(projectId, conversations[0].id);
      } else {
        // Create new conversation if none exist
        currentConv = await chatStore.createConversation(projectId, 'New Conversation');
      }
      
      // Phase 4: Load conversation settings and documents (non-blocking)
      if (currentConv?.id) {
        const settingsTasks = [
          fetchSettings(currentConv.id).catch(err => {
            console.error('Settings load failed:', err);
            // Don't fail the entire loading process for settings
          }),
          
          useConversationDocumentsStore.getState()
            .fetchConversationDocuments(currentConv.id)
            .catch(err => {
              console.error('Documents load failed:', err);
              // Don't fail the entire loading process for documents
            })
        ];
        
        // Don't wait for settings to complete - let them load in background
        Promise.all(settingsTasks).finally(() => {
          setLoadingState(prev => ({ 
            ...prev, 
            settingsLoaded: true 
          }));
        });
      }
      
      // Mark as complete - workspace is usable even if settings are still loading
      setLoadingState(prev => ({ 
        ...prev, 
        phase: 'complete' 
      }));
      
      console.log('✅ Workspace initialization complete');
      
    } catch (error) {
      console.error('❌ Workspace initialization failed:', error);
      setLoadingState(prev => ({
        ...prev,
        phase: 'error',
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [projectId, fetchProjectById, fetchSettings]);

  // Initialize workspace on mount or projectId change
  useEffect(() => {
    // Reset loading state when projectId changes
    setLoadingState({
      phase: 'project',
      projectLoaded: false,
      conversationsLoaded: false,
      settingsLoaded: false,
      hasError: false,
    });
    
    initializeWorkspace();
  }, [initializeWorkspace]);

  // Optimized settings loading when conversation changes
  useEffect(() => {
    if (currentConversation?.id && loadingState.phase === 'complete') {
      // Only load settings if we're not in initial loading phase
      fetchSettings(currentConversation.id).catch(err => {
        console.error('Error loading conversation settings:', err);
        // Don't show error to user for settings failures
      });
    }
  }, [currentConversation?.id, fetchSettings, loadingState.phase]);

  // Retry function for errors
  const handleRetry = useCallback(() => {
    setLoadingState({
      phase: 'project',
      projectLoaded: false,
      conversationsLoaded: false,
      settingsLoaded: false,
      hasError: false,
    });
    initializeWorkspace();
  }, [initializeWorkspace]);

  // Show progressive loading states
  if (loadingState.hasError) {
    return (
      <ErrorState
        title="Failed to load workspace"
        description={loadingState.errorMessage || "The workspace could not be loaded."}
        action={{
          label: "Try Again",
          onClick: handleRetry
        }}
      />
    );
  }

  // Show loading only for essential data
  if (!loadingState.projectLoaded || projectLoading) {
    return <WorkspaceLoading title={currentProject?.title} />;
  }

  // Workspace is ready to render - even if some data is still loading
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