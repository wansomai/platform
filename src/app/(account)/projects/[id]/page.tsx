// app/projects/[id]/page.tsx
"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { ChatInterface } from "@/components/chat/ChatInterface"
import { CanvasChatSplitView } from "@/components/chat/CanvasChatSplitView"
import { DocumentPreviewSplitView } from "@/components/chat/DocumentPreviewSplitView"
import { ErrorState } from "@/components/commons/LoadingState"
import { WorkspaceSkeleton } from "@/components/commons/WorkspaceSkeleton"
import { useProjectSettingsStore } from "@/store/workspace-settings.store"
import { useUIStore } from "@/store/ui.store"
import { ChatInput } from "@/components/chat/ChatInput"
import { useChatStore } from "@/store/chat.store"
import { useProjectStore } from "@/store/project.store"
import { ProjectMembersModal } from "@/components/projects/ProjectMembersModal"
import { useNotifications } from "@/hooks/useNotifications"
import { apiService } from "@/lib/api"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const [showMembersModal, setShowMembersModal] = useState(false)
  const { notify } = useNotifications()

  // Track if we've already handled the connection notification
  const connectionHandledRef = useRef(false)

  // Get core workspace data (no settings)
  const { projects } = useProjectStore()
  const project = projects.find(p => p.id === projectId)

  // Get settings from dedicated store
  const { settings, updateSetting } = useProjectSettingsStore()
  const { selectedPreviewDocument } = useUIStore();
  const { fetchConversation, isLoading: chatLoading } = useChatStore();
    
  // Load project conversations
  useEffect(() => {
    fetchConversation(projectId).catch(err => {})
  }, [projectId, fetchConversation]);

  // Handle Google connection notifications
  useEffect(() => {
    // Only run once
    if (connectionHandledRef.current) return;

    const connection = searchParams.get('connection');
    const message = searchParams.get('message');

    // Only handle if there's actually a connection param
    if (!connection) return;

    connectionHandledRef.current = true;

    if (connection === 'success') {
      notify.success('Google account connected successfully! You can now use Calendar and Gmail features.');

      // Auto-enable the setting and refresh connection status
      const enableSettings = async () => {
        try {
          // Fetch latest connection status to see what was connected
          const response: { data: { hasCalendarAccess?: boolean; hasGmailAccess?: boolean  } } = await apiService.get('/api/auth/google-connection/status');
          // Safely check if data exists before accessing properties
          if (response && response.data) {
            // Auto-enable Calendar if it was just connected and not already enabled
            if (response.data.hasCalendarAccess && !settings.googleCalendar) {
              await updateSetting(projectId, 'googleCalendar', true);
            }

            // Auto-enable Gmail if it was just connected and not already enabled
            if (response.data.hasGmailAccess && !settings.gmail) {
              await updateSetting(projectId, 'gmail', true);
            }
          }

          // Trigger a refresh of the ChatInput connection status
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('googleConnectionSuccess'));
          }
        } catch (error) {
          console.error('Error enabling Google settings:', error);
        }
      };

      enableSettings();
    } else if (connection === 'error') {
      const errorMessage = message === 'missing_parameters'
        ? 'Connection failed: Missing parameters'
        : message === 'no_access_token'
        ? 'Connection failed: Could not obtain access token'
        : message === 'callback_failed'
        ? 'Connection failed: Please try again'
        : 'Failed to connect Google account';

      notify.error(errorMessage);
    } else if (connection === 'cancelled') {
      notify.info('Google account connection cancelled');
    }

    // Remove query params from URL after a short delay
    const timeoutId = setTimeout(() => {
      router.replace(`/projects/${projectId}`);
    }, 100);

    // Cleanup timeout on unmount
    return () => clearTimeout(timeoutId);
  }, [searchParams, router, notify, projectId, updateSetting, settings]);

  // Show skeleton loading state if project is loading
  if (chatLoading || (!project && projectId)) {
    return (
      <WorkspaceSkeleton
        showSidebar={false}
        projectTitle={project?.title}
      />
    )
  }

  // Show error state if project couldn't be loaded
  if (!project) {
    return (
      <ErrorState
        title="Workspace not found"
        description="The workspace you're looking for doesn't exist or you don't have access to it."
        action={{
          label: "Go Back",
          onClick: () => window.history.back()
        }}
      />
    )
  }
  
  // Determine which interface to show based on settings and document selection
  const showLegalDrafting = settings?.legalDrafting || false
  const showDocumentPreview = !!selectedPreviewDocument

  return (
    <div className="flex h-screen bg-white">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {showDocumentPreview ? <DocumentPreviewSplitView /> :
             showLegalDrafting ? <CanvasChatSplitView /> :
             <ChatInterface />}
          </div>
          <div className="bg-white border-t">
            <ChatInput />
          </div>
        </main>

      </div>

      {/* Members Modal */}
      <ProjectMembersModal
        projectId={projectId}
        projectTitle={project.title}
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
      />
    </div>
  )
}