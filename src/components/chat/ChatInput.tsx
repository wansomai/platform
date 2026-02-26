// src/components/chat/ChatInput.tsx
"use client";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Send,
  Loader2,
  SlidersHorizontal,
  X,
  Paperclip,
  ArrowUpRightFromSquare,
  Globe,
  FileText,
  User,
  Zap,
  Layers,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/store/chat.store";
import { useUIStore } from "@/store/ui.store";
import { useProjectStore } from "@/store/project.store";
import { useOrganization, useProfile } from "@/store/profile.store";
import { useNotifications } from "@/hooks/useNotifications";
import { useSession } from "next-auth/react";
import ProAccessModal from "../modals/ProAccess";
import { UploadDocumentModal } from "../modals/UploadModal";
import { useProjectSettingsStore } from "@/store/workspace-settings.store";
import { useProjectDocumentsStore } from "@/store/workspace-documents.store";
import { useDocumentsStore } from "@/store/documents.store";
import { apiService } from "@/lib/api";
import { JurisdictionSelector } from "@/components/workspace/JurisdictionSelector";
import { Jurisdiction } from "@/types";
import { getJurisdictionById } from "@/lib/jurisdictions";
import { useAssociates } from "@/hooks/useAssociates";
import { useProjectAssociates } from "@/hooks/useProjectAssociates";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onDocumentsAdded?: (count: number) => void;
  homepageMode?: boolean;
  onWorkspaceCreated?: (projectId: string) => void;
}

export function ChatInput({
  onDocumentsAdded,
  homepageMode,
  onWorkspaceCreated,
}: ChatInputProps) {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showJurisdictionDropdown, setShowJurisdictionDropdown] = useState(false);
  const [showAssociatesDropdown, setShowAssociatesDropdown] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedVaultDocIds, setSelectedVaultDocIds] = useState<string[]>([]);
  const [selectedAssociateId, setSelectedAssociateId] = useState<string | null>(null);
  const [homepageJurisdictions, setHomepageJurisdictions] = useState<Jurisdiction[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showProAcess, setShowProAccess] = useState(false);
  const pendingMessageProcessedRef = useRef(false);

  // Google connection state
  const [googleConnectionStatus, setGoogleConnectionStatus] = useState<{
    connected: boolean;
    email: string | null;
    hasCalendarAccess: boolean;
    hasGmailAccess: boolean;
  } | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { notify } = useNotifications();

  // Get state from stores
  const { addToast, selectedPreviewDocument } = useUIStore();
  const { createProject, requiresUpgrade: projectRequiresUpgrade } =
    useProjectStore();
  const {
    currentConversation,
    sendMessage,
    requiresUpgrade: chatRequiresUpgrade,
  } = useChatStore();
  const { isUpgrading, requestUpgrade, setUpgrading } = useOrganization();
  const { user: profile, fetchProfile } = useProfile();

  const {
    settings,
    updateSetting,
    isLoading: isLoadingSettings,
  } = useProjectSettingsStore();

  const { documents: conversationDocuments, fetchProjectDocuments, removeDocumentFromProject, clearDocuments } =
    useProjectDocumentsStore();

  // Stable error handler for associates
  const handleAssociatesError = useCallback((error: string) => {
    notify.error(error);
  }, [notify]);

  // Error handler for project associate assignment - suppress "already assigned" errors
  const handleProjectAssociateError = useCallback((error: string) => {
    // Don't show error if associate is already assigned - this is expected
    if (!error.includes('already assigned')) {
      notify.error(error);
    }
  }, [notify]);

  // Get all associates (not just project associates)
  const {
    associates,
    isLoading: isLoadingAssociates,
    error: associatesError,
    fetchAssociates
  } = useAssociates({
    onError: handleAssociatesError
  });

  // Get project associates management functions
  const {
    assignAssociate: assignAssociateToProject
  } = useProjectAssociates({
    onError: handleProjectAssociateError
  });

  const { data: session } = useSession();

  // Fetch fresh profile data for organization ID in homepage mode
  useEffect(() => {
    if (homepageMode) {
      // Always fetch profile in homepage mode to ensure we have latest activeOrganizationId
      // Force refresh to bypass cache and get updated organization data
      fetchProfile(true);
    }
  }, [homepageMode, fetchProfile]);

  // Show Pro Access modal when upgrade is required
  useEffect(() => {
    if (projectRequiresUpgrade || chatRequiresUpgrade) {
      setShowProAccess(true);
    }
  }, [projectRequiresUpgrade, chatRequiresUpgrade]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "auto";

      // Get the max height based on mode
      const maxHeight = homepageMode ? 400 : 300;
      const newHeight = textareaRef.current.scrollHeight;

      // Set height to scrollHeight, but respect max height
      textareaRef.current.style.height = `${Math.min(newHeight, maxHeight)}px`;
    }
  }, [input, homepageMode]);

  // Handle direct prompt sending from external components
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handlePromptSendEvent = (event: any) => {
      if (event.detail && event.detail.promptTemplate) {
        if (currentConversation) {
          handleSend(event.detail.promptTemplate);
        }
      }
    };

    const handleHomepagePromptSelect = (event: any) => {
      if (event.detail && event.detail.prompt && homepageMode) {
        setInput(event.detail.prompt);
        // Focus the textarea
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    };

    document.addEventListener("action-prompt-send", handlePromptSendEvent);
    document.addEventListener("homepage-prompt-select", handleHomepagePromptSelect);

    return () => {
      document.removeEventListener("action-prompt-send", handlePromptSendEvent);
      document.removeEventListener("homepage-prompt-select", handleHomepagePromptSelect);
    };
  }, [currentConversation, homepageMode]);

  // Check Google connection status
  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (homepageMode) return;

      setIsCheckingConnection(true);
      try {
        const response = await apiService.get<{ data: any }>("/api/auth/google-connection/status");
        // Safely access nested data with fallback
        if (response && response.data) {
          setGoogleConnectionStatus(response.data);
        } else {
          // Fallback for unexpected response structure
          setGoogleConnectionStatus({
            connected: false,
            email: null,
            hasCalendarAccess: false,
            hasGmailAccess: false,
          });
        }
      } catch (error) {
        console.error("Error checking Google connection:", error);
        // Set safe default state on error
        setGoogleConnectionStatus({
          connected: false,
          email: null,
          hasCalendarAccess: false,
          hasGmailAccess: false,
        });
      } finally {
        setIsCheckingConnection(false);
      }
    };

    checkGoogleConnection();
  }, [homepageMode]);

  // Fetch project documents on mount / project change (workspace mode)
  useEffect(() => {
    if (!homepageMode && projectId) {
      clearDocuments();
      fetchProjectDocuments(projectId);
    }
    return () => clearDocuments();
  }, [homepageMode, projectId, fetchProjectDocuments, clearDocuments]);

  // Listen for Google connection success event and refresh status
  useEffect(() => {
    const handleConnectionSuccess = async () => {
      if (homepageMode) return;

      // Refresh connection status
      setIsCheckingConnection(true);
      try {
        const response = await apiService.get<{ data: any }>("/api/auth/google-connection/status");
        // Safely access nested data
        if (response && response.data) {
          setGoogleConnectionStatus(response.data);
          if(response.data.hasCalendarAccess) {
            updateSetting(projectId, 'googleCalendar', response.data.hasCalendarAccess);
            setIsConnecting(false);
          }
          if(response.data.hasGmailAccess) {
            updateSetting(projectId, 'gmail', response.data.hasGmailAccess);
            setIsConnecting(false);
          }
        }
      } catch (error) {
        console.error("Error checking Google connection:", error);
        setIsConnecting(false);
      } finally {
        setIsCheckingConnection(false);
        setIsConnecting(false);
      }
    };

    window.addEventListener('googleConnectionSuccess', handleConnectionSuccess);

    return () => {
      window.removeEventListener('googleConnectionSuccess', handleConnectionSuccess);
    };
  }, [homepageMode]);

  // Fetch all associates when component mounts
  useEffect(() => {
    fetchAssociates().catch(err => {
      console.error('Failed to fetch associates:', err);
    });
  }, []); // Only run once when mounting

  // Handle Google account connection
  const handleConnectGoogle = (
    type: "calendar" | "gmail"
  ) => {
    setIsConnecting(true);
    const url = `/api/auth/google-connection/connect?type=${encodeURIComponent(
      type
    )}`;
    window.location.href = url;
  };

  // Helper function to generate meaningful project names
  const generateQuickChatProjectName = useCallback((): string => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const dateStr = now.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });

    return `Wansom - ${dateStr} ${timeStr}`;
  }, []);

  // Handle send message with streaming
  const handleSend = useCallback(
    async (customMessage?: string) => {
      const messageToSend = customMessage || input;
      if (!messageToSend.trim() || isSubmitting) return;

      // Homepage mode - create new workspace and navigate
      if (homepageMode) {
        if (!session?.user?.organization?.id) {
          notify.error("Something went wrong. Please try again.");
          return;
        }

        setIsSubmitting(true);

        try {
          // Generate a meaningful project name
          const projectTitle = generateQuickChatProjectName();

          // Use active organization ID (supports org switching), fallback to primary org or session
          const organizationId = profile?.activeOrganizationId || profile?.organizationId || session?.user?.organization?.id;

          const payload = {
            title: projectTitle,
            description: "Quick AI chat session",
            organizationId,
          };

          try {
            const newProject = await createProject(payload);

            if (newProject) {
              // Collect all document IDs to attach (uploaded files + vault selections)
              const allDocIds: string[] = [...selectedVaultDocIds];

              // Upload new files first
              if (selectedFiles.length > 0) {
                try {
                  for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const doc = await useDocumentsStore.getState().uploadDocument(formData);
                    if (doc) {
                      allDocIds.push(doc.id);
                    }
                  }
                } catch (uploadError: any) {
                  console.error("Error uploading files:", uploadError);
                  notify.error("Workspace created but some files failed to upload");
                }
              }

              // Attach all documents to project
              if (allDocIds.length > 0) {
                try {
                  await useProjectDocumentsStore.getState().attachDocumentsToProject(
                    newProject.id,
                    allDocIds
                  );
                  notify.success(`AI workspace created with ${allDocIds.length} document${allDocIds.length !== 1 ? 's' : ''}!`);
                } catch {
                  notify.error("Workspace created but some documents failed to attach");
                }
                setSelectedVaultDocIds([]);
              } else {
                notify.success("AI workspace created successfully!");
              }

              // The project API already creates a conversation - use it directly
              // Set currentConversation in chat store to avoid redundant fetch
              if (newProject.conversationId) {
                useChatStore.getState().setCurrentConversation({
                  id: newProject.conversationId,
                  title: newProject.conversationTitle || 'New Conversation',
                  projectId: newProject.id,
                  messages: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  isPinned: false
                });
              }

              // Apply jurisdiction to the new project if one was selected on the dashboard
              if (homepageJurisdictions.length > 0) {
                try {
                  await useProjectSettingsStore.getState().updateSettings(newProject.id, {
                    jurisdictions: homepageJurisdictions.map(j => ({
                      id: j.id,
                      name: j.name,
                      country: j.country,
                      state: j.state,
                      legalSystem: j.legalSystem,
                      citationStyle: j.citationStyle
                    })),
                    jurisdiction: {
                      id: homepageJurisdictions[0].id,
                      name: homepageJurisdictions[0].name,
                      country: homepageJurisdictions[0].country,
                      state: homepageJurisdictions[0].state,
                      legalSystem: homepageJurisdictions[0].legalSystem,
                      citationStyle: homepageJurisdictions[0].citationStyle
                    }
                  });
                } catch {
                  // Non-fatal — workspace still works, jurisdiction can be set later
                }
              }

              // Store the message in sessionStorage to preserve it across navigation
              sessionStorage.setItem("pendingMessage", messageToSend);

              // Clear selected files and associate
              setSelectedFiles([]);
              setSelectedAssociateId(null);
              setHomepageJurisdictions([]);

              // Call callback if provided
              onWorkspaceCreated?.(newProject.id);

              // Navigate to the new project - the message will be restored in the workspace
              router.push(`/projects/${newProject.id}`);
            } else {
              throw new Error("Failed to create project");
            }
          } catch (error: any) {
            // Check if this is a subscription limit error
            if (error.status === 403 && error.requiresUpgrade) {
              setShowProAccess(true);
              return; // Don't show generic error or clear input
            }
            throw error; // Re-throw other errors
          }
        } catch (error: any) {
          const errorMessage = error.message || "Failed to create AI workspace. Please try again.";
          notify.error(errorMessage);
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Normal chat mode - requires existing conversation
      if (!currentConversation) return;

      try {
        setIsSubmitting(true);

        // Upload and attach files if any are selected
        if (selectedFiles.length > 0) {
          try {
            const uploadedDocIds: string[] = [];
            for (const file of selectedFiles) {
              const formData = new FormData();
              formData.append('file', file);

              // Upload document
              const doc = await useDocumentsStore.getState().uploadDocument(formData);
              if (doc) {
                uploadedDocIds.push(doc.id);
              }
            }

            // Attach documents to project if any were uploaded
            if (uploadedDocIds.length > 0) {
              await useProjectDocumentsStore.getState().attachDocumentsToProject(
                projectId,
                uploadedDocIds
              );
              notify.success(`${uploadedDocIds.length} file${uploadedDocIds.length !== 1 ? 's' : ''} uploaded`);
            }
          } catch (uploadError: any) {
            console.error("Error uploading files:", uploadError);
            notify.error("Failed to upload files");
            setIsSubmitting(false);
            return;
          }
        }

        try {
          await sendMessage(
            projectId,
            currentConversation.id,
            messageToSend,
            session?.user?.id,
            "",
            selectedPreviewDocument
          );
        } catch (error: any) {
          // Check if this is a subscription limit error
          if (error.status === 403 && error.requiresUpgrade) {
            setShowProAccess(true);
            return; // Don't clear input if it's a subscription error
          }
          throw error; // Re-throw other errors
        }

        if (!customMessage) {
          setInput("");
          setSelectedFiles([]); // Clear selected files after sending
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
        }
      } catch (error) {
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      input,
      isSubmitting,
      homepageMode,
      session?.user?.organization?.id,
      session?.user?.id,
      generateQuickChatProjectName,
      notify,
      createProject,
      router,
      onWorkspaceCreated,
      currentConversation,
      projectId,
      sendMessage,
      selectedFiles,
      selectedPreviewDocument,
      profile?.activeOrganizationId,
      profile?.organizationId,
    ]
  );

  // Auto-send pending message from homepage when conversation is ready
  useEffect(() => {
    if (homepageMode || typeof window === "undefined") return;
    if (pendingMessageProcessedRef.current) return;

    const pendingMessage = sessionStorage.getItem("pendingMessage");
    if (!pendingMessage) return;

    // If conversation is ready with a valid ID, auto-send the message
    if (currentConversation?.id && !isSubmitting) {
      pendingMessageProcessedRef.current = true;
      sessionStorage.removeItem("pendingMessage");

      // Auto-send the pending message
      handleSend(pendingMessage);
    }
  }, [homepageMode, currentConversation, isSubmitting, handleSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle setting changes with exclusive logic for legal drafting and contract review
  const handleSettingChange = async (
    settingKey: keyof typeof settings,
    value: boolean
  ) => {
    if (!currentConversation) return;

    try {
      // Update the setting directly
      await updateSetting(projectId, settingKey, value);

      // If toggling off canvasMode (or legacy legalDrafting), also clear the ?view=canvas URL param
      if ((settingKey === 'canvasMode' || settingKey === 'legalDrafting') && !value) {
        const url = new URL(window.location.href);
        if (url.searchParams.get('view') === 'canvas') {
          url.searchParams.delete('view');
          router.replace(url.pathname + url.search);
        }
      }

      addToast({ message: `${settingKey} setting updated`, type: "success" });
    } catch (error) {
      addToast({
        message: `Failed to update ${settingKey} setting`,
        type: "error",
      });
    }
  };

  // Handle multiple jurisdictions change
  const handleJurisdictionsChange = async (jurisdictions: Jurisdiction[]) => {
    // Homepage mode — store locally; will be applied to project on creation
    if (homepageMode) {
      setHomepageJurisdictions(jurisdictions);
      addToast({
        message: jurisdictions.length > 0
          ? `${jurisdictions.length} jurisdiction${jurisdictions.length !== 1 ? 's' : ''} selected`
          : 'Jurisdictions cleared',
        type: 'success'
      });
      return;
    }

    if (!projectId) return;

    try {
      const success = await useProjectSettingsStore.getState().updateSettings(projectId, {
        jurisdictions: jurisdictions.map(j => ({
          id: j.id,
          name: j.name,
          country: j.country,
          state: j.state,
          legalSystem: j.legalSystem,
          citationStyle: j.citationStyle
        }))
      });

      if (success) {
        addToast({
          message: jurisdictions.length > 0
            ? `${jurisdictions.length} jurisdiction${jurisdictions.length !== 1 ? 's' : ''} selected`
            : 'Jurisdictions cleared',
          type: 'success'
        });
      }
    } catch (error) {
      addToast({ message: 'Failed to update jurisdictions', type: 'error' });
    }
  };

  // Handle associate toggle (add/remove)
  const handleAssociateToggle = async (associateId: string, isCurrentlySelected: boolean) => {
    const associate = associates.find(a => a.id === associateId);

    // Homepage mode - just update local state
    if (homepageMode) {
      if (isCurrentlySelected) {
        setSelectedAssociateId(null);
        notify.success(`${associate?.name} removed`);
      } else {
        setSelectedAssociateId(associateId);
        notify.success(`${associate?.name} selected`);
      }
      return;
    }

    // Normal mode - update conversation and project
    if (!currentConversation || !projectId) return;

    try {
      let success = false;

      if (isCurrentlySelected) {
        // Remove associate from conversation
        success = await useChatStore.getState().removeAssociateFromConversation(
          projectId,
          currentConversation.id
        );
        if (success) {
          notify.success(`${associate?.name} removed`);
        }
      } else {
        // First, assign the associate to the project (if not already assigned)
        // Note: assignAssociateToProject may fail if already assigned, which is fine
        try {
          await assignAssociateToProject(projectId, associateId);
        } catch (error: any) {
          // If this is a subscription limit error, show upgrade modal
          if (error.status === 403 && error.requiresUpgrade) {
            setShowProAccess(true);
            return;
          }
          // Ignore other errors (like already assigned), continue to assign to conversation
        }

        // Then assign associate to conversation
        try {
          success = await useChatStore.getState().assignAssociateToConversation(
            projectId,
            currentConversation.id,
            associateId
          );
          if (success) {
            notify.success(`${associate?.name} added`);
          }
        } catch (error: any) {
          // If this is a subscription limit error, show upgrade modal
          if (error.status === 403 && error.requiresUpgrade) {
            setShowProAccess(true);
            return;
          }
          throw error; // Re-throw other errors
        }
      }
    } catch (error: any) {
      // Check if this is a subscription limit error
      if (error.status === 403 && error.requiresUpgrade) {
        setShowProAccess(true);
        return;
      }
      notify.error("Failed to update AI Associate");
    }
  };

  // Handle documents added
  const handleDocumentsAdded = (documents: any[]) => {
    const count = documents.length;
    addToast({
      message: `${count} document${count > 1 ? "s" : ""} added to conversation`,
      type: "success",
    });
    onDocumentsAdded?.(count);

    // Refresh conversation documents
    if (currentConversation?.id) {
      fetchProjectDocuments(currentConversation.id);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Trigger file input click - always use file picker
  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const handleRequestProAccess = async () => {
    setUpgrading(true);

    const success = await requestUpgrade();

    if (success) {
      notify.success("Pro access request submitted successfully");
      setIsConnecting(false);
      router.push("/profile");

    } else {
      notify.error("Failed to submit Pro access request");
       setIsConnecting(false);
    }

    setShowProAccess(false);
  };

  // Get current jurisdictions from settings
  const currentJurisdictions = useMemo(() => {
    // Prefer the plural array (set by the selector)
    if (settings?.jurisdictions && settings.jurisdictions.length > 0) {
      return settings.jurisdictions
        .map(j => getJurisdictionById(j.id))
        .filter(Boolean) as Jurisdiction[];
    }
    // Fall back to singular jurisdiction (set by banner Apply or legacy saves)
    const singular = settings?.jurisdiction;
    if (singular && typeof singular === 'object' && 'id' in singular) {
      const full = getJurisdictionById((singular as { id: string }).id);
      return full ? [full] : [];
    }
    return [];
  }, [settings?.jurisdictions, settings?.jurisdiction]);

  // In homepage mode use local state; in project mode use settings from store
  const activeJurisdictionsForButton = homepageMode ? homepageJurisdictions : currentJurisdictions;

  return (
    <>
      {/* Input Area - Different styling for homepage vs chat mode */}
      <div
        className="relative w-full max-w-4xl mx-auto"
      >
        <div className={homepageMode ? "w-full" : "w-full max-w-4xl mx-auto"}>
          {/* Input Area with embedded icons */}
          <div
            className={`bg-white rounded-t-xl border-t-2 border-[#0a4b5e]  focus-within:border-primary-300 transition-colors relative ${
              homepageMode ? "shadow-sm focus-within:shadow-md" : "shadow-lg"
            }`}
          >
            {/* Left side icons - show in all modes */}
            <div
              className={`absolute flex items-center gap-2 z-10 w-full ${
                homepageMode ? "left-6 bottom-3" : "left-6 bottom-2"
              }`}
            >
              {/* Documents Tool */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePaperclipClick}
                className="h-8 w-8 p-0 rounded-md hover:bg-gray-100"
                title={
                  selectedFiles.length > 0
                    ? `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected`
                    : "Attach files"
                }
              >
                <Paperclip className="h-4 w-4 text-gray-500" />
              </Button>

              {/* Tools Dropdown */}
              <DropdownMenu
                open={showToolsDropdown}
                onOpenChange={setShowToolsDropdown}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 sm:w-fit sm:px-2 p-0 rounded-md hover:bg-gray-100"
                    title={
                      homepageMode
                        ? "AI Tools (preview - will be configurable after creating workspace)"
                        : "AI Tools"
                    }
                  >
                    <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                    <span className="hidden sm:inline">Tools</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-72 p-4 mb-2"
                  side="top"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-gray-500">
                        {homepageMode
                          ? "Available AI Tools"
                          : "Workspace Settings"}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowToolsDropdown(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label
                          htmlFor="web-search"
                          className="font-medium text-sm"
                        >
                          Deep Research
                        </Label>
                      </div>
                      <Switch
                        id="web-search"
                        checked={homepageMode ? false : settings.webSearch}
                        disabled={homepageMode || isLoadingSettings}
                        onCheckedChange={
                          homepageMode
                            ? undefined
                            : (checked) => {
                                handleSettingChange("webSearch", checked);
                              }
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label
                          htmlFor="canvas-mode"
                          className="font-medium text-sm"
                        >
                          Draft & Review
                        </Label>
                      </div>
                      <Switch
                        id="canvas-mode"
                        checked={homepageMode ? false : (settings.canvasMode || settings.legalDrafting || false)}
                        disabled={homepageMode || isLoadingSettings}
                        onCheckedChange={
                          homepageMode
                            ? undefined
                            : (checked) => {
                                handleSettingChange("canvasMode", checked);
                              }
                        }
                      />
                    </div>

                    {/* Google Calendar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-sm flex items-center gap-1">
                          <img src={'/icons/calendar.svg'} className="w-6 h-6"/> Google Calendar
                        </Label>
                        {googleConnectionStatus?.hasCalendarAccess ? (
                          <Switch
                            id="google-calendar"
                            checked={
                              homepageMode
                                ? false
                                : settings.googleCalendar || false
                            }
                            disabled={homepageMode || isLoadingSettings}
                            onCheckedChange={
                              homepageMode
                                ? undefined
                                : (checked) => {
                                    handleSettingChange(
                                      "googleCalendar",
                                      checked
                                    );
                                  }
                            }
                          />
                        ) : (
                          <Button
                            onClick={() => handleConnectGoogle("calendar")}
                            variant="ghost"
                            size="sm"
                            disabled={homepageMode || isConnecting}
                            className="flex items-center gap-1 h-7 px-2"
                          >
                            {isConnecting ? "Connecting..." : "Connect"}
                            <ArrowUpRightFromSquare className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                       {/* Gmail */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-sm flex items-center gap-1">
                         <img src={'/icons/gmail.svg'} className="w-6 h-6"/> Gmail
                        </Label>
                        <Button
                          onClick={() => setShowProAccess(true)}
                          variant="ghost"
                          size="sm"
                          disabled={homepageMode}
                          className="flex items-center gap-1 h-7 px-2"
                        >
                          {isConnecting ? "Connecting..." : "Connect"}
                          <ArrowUpRightFromSquare className="h-3 w-3" />
                        </Button>
                      </div>

                    </div>
                    <div className="h-[1px] bg-gray-300 w-full"></div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="cite-sources"
                            className="font-medium text-sm"
                          >
                            Cite sources
                          </Label>
                        </div>
                        <Switch
                          id="cite-sources"
                          checked={homepageMode ? false : settings.citeSources}
                          disabled={homepageMode || isLoadingSettings}
                          onCheckedChange={
                            homepageMode
                              ? undefined
                              : (checked) => {
                                  handleSettingChange("citeSources", checked);
                                }
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="suggest-actions"
                            className="font-medium text-sm"
                          >
                            Suggest actions
                          </Label>
                        </div>
                        <Switch
                          id="suggest-actions"
                          checked={
                            homepageMode ? false : settings.suggestActions
                          }
                          disabled={homepageMode || isLoadingSettings}
                          onCheckedChange={
                            homepageMode
                              ? undefined
                              : (checked) => {
                                  handleSettingChange(
                                    "suggestActions",
                                    checked
                                  );
                                }
                          }
                        />
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Jurisdiction Selector Dropdown */}
              <DropdownMenu
                open={showJurisdictionDropdown}
                onOpenChange={setShowJurisdictionDropdown}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-8 w-8 sm:w-fit sm:px-2 p-0 rounded-md flex items-center gap-1 justify-center hover:bg-gray-100 border border-input bg-background"
                    title={
                      activeJurisdictionsForButton.length > 0
                        ? `${activeJurisdictionsForButton.length} jurisdiction${activeJurisdictionsForButton.length !== 1 ? 's' : ''} selected`
                        : "Select jurisdiction"
                    }
                  >
                    <Globe className={`h-4 w-4 ${activeJurisdictionsForButton.length > 0 ? 'text-teal-700' : 'text-gray-500'}`} />
                    <span className="hidden sm:inline text-sm text-gray-600">
                      {activeJurisdictionsForButton.length === 1
                        ? activeJurisdictionsForButton[0].name
                        : activeJurisdictionsForButton.length > 1
                        ? `${activeJurisdictionsForButton.length} Jurisdictions`
                        : 'Jurisdiction'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[340px] p-3 mb-2"
                  side="top"
                >
                  <JurisdictionSelector
                    inline={true}
                    multiSelect={true}
                    values={activeJurisdictionsForButton}
                    onChangeMulti={handleJurisdictionsChange}
                    disabled={isLoadingSettings}
                    placeholder="Search jurisdictions..."
                    maxSelections={5}
                  />
                </DropdownMenuContent>
              </DropdownMenu>

              {/* AI Associates Selector Dropdown - Show if no associate selected */}
              {((homepageMode && !selectedAssociateId) || (!homepageMode && !currentConversation?.aiAssociate)) && (
                <DropdownMenu
                  open={showAssociatesDropdown}
                  onOpenChange={setShowAssociatesDropdown}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      className="h-8 w-8 sm:w-fit sm:px-2 p-0 rounded-md flex items-center gap-1 justify-center hover:bg-gray-100 border border-input bg-background"
                      title="Select AI Associate"
                      disabled={isLoadingAssociates}
                    >
                      <Zap className="h-4 w-4 text-gray-500" />
                      <span className="hidden sm:inline text-sm text-gray-600">Workflows</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[340px] p-3 mb-2"
                    side="top"
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-700">Select AI Associates</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAssociatesDropdown(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="h-[1px] bg-gray-200" />

                      {/* Available associates list */}
                      {isLoadingAssociates ? (
                        <div className="text-sm text-center py-6 text-gray-500">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                          Loading associates...
                        </div>
                      ) : associatesError ? (
                        <div className="text-sm text-center py-6 text-red-500">
                          <X className="h-8 w-8 mx-auto mb-2" />
                          <p>Failed to load associates</p>
                          <p className="text-xs mt-1">{associatesError}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchAssociates()}
                            className="mt-2"
                          >
                            Retry
                          </Button>
                        </div>
                      ) : associates.length === 0 ? (
                        <div className="text-sm text-center py-6 text-gray-500">
                          <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No associates available</p>
                          <p className="text-xs mt-1 max-w-[280px] mx-auto">
                            Go to Workflows page to create your first AI associate
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="max-h-[300px]">
                          <div className="space-y-1 pr-3">
                            {associates.map(associate => {
                              const isSelected = homepageMode
                                ? selectedAssociateId === associate.id
                                : currentConversation?.aiAssociateId === associate.id;

                              return (
                                <div
                                  key={associate.id}
                                  className="flex items-start p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors relative"
                                  onClick={() => handleAssociateToggle(associate.id, isSelected)}
                                >
                                  <div className={cn(
                                    "h-4 w-4 border rounded flex items-center justify-center mr-3 mt-0.5 shrink-0",
                                    isSelected
                                      ? "bg-primary border-primary"
                                      : "border-gray-300"
                                  )}>
                                    {isSelected && (
                                      <svg className="h-3 w-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M5 13l4 4L19 7"></path>
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                      {associate.name}
                                    </div>
                                    {associate.description && (
                                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                        {associate.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Vault Documents Button */}
              <button
                className="h-8 w-8 p-0 rounded-md flex items-center justify-center hover:bg-gray-100 border border-input bg-background"
                title="Add documents from vault"
                onClick={() => setShowVaultModal(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
                </svg>
              </button>

              {/* Active AI Associate Badge */}
              {((homepageMode && selectedAssociateId) || (!homepageMode && currentConversation?.aiAssociate)) && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-500 rounded-md p-1">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-amber-900 max-w-[150px] truncate">
                      {homepageMode
                        ? associates.find(a => a.id === selectedAssociateId)?.name
                        : currentConversation?.aiAssociate?.name
                      }
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      if (homepageMode) {
                        // Homepage mode - just clear the selected associate
                        setSelectedAssociateId(null);
                        const associate = associates.find(a => a.id === selectedAssociateId);
                        notify.success(`${associate?.name} removed`);
                      } else if (currentConversation?.id && projectId) {
                        // Normal mode - remove from conversation
                        const { removeAssociateFromConversation } = useChatStore.getState();
                        const success = await removeAssociateFromConversation(projectId, currentConversation.id);
                        if (success) {
                          notify.success("AI Associate removed from conversation");
                        } else {
                          notify.error("Failed to remove AI Associate");
                        }
                      }
                    }}
                    className="hover:bg-amber-100 rounded-full p-1 transition-colors"
                    type="button"
                    title="Remove AI Associate"
                  >
                    <X className="h-3.5 w-3.5 text-amber-700" />
                  </button>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Selected Files Chips - Show above textarea */}
            {(selectedFiles.length > 0 || (homepageMode && selectedVaultDocIds.length > 0)) && (
              <div className="px-6 pt-4 pb-2 flex flex-wrap gap-2">
                {/* Uploaded files (pending) */}
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#E9F5F3] rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="bg-[#74C6B8] rounded-md p-1.5">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 max-w-[150px] truncate">
                          {file.name}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="hover:bg-blue-100 rounded-full p-1 transition-colors"
                      type="button"
                    >
                      <X className="h-3.5 w-3.5 text-gray-600" />
                    </button>
                  </div>
                ))}
                {/* Homepage: vault doc count badge */}
                {homepageMode && selectedVaultDocIds.length > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary rounded-md p-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-white">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedVaultDocIds.length} vault document{selectedVaultDocIds.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedVaultDocIds([])}
                      className="hover:bg-blue-100 rounded-full p-1 transition-colors"
                      type="button"
                    >
                      <X className="h-3.5 w-3.5 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedFiles.length > 0 || selectedVaultDocIds.length > 0
                  ? "Ask anything about your document..."
                  : homepageMode
                  ? "Ask wansom anything... (e.g., 'Help me draft a contract','Review this agreement')"
                  : "Ask Wansom anything..."
              }
              className={`border-0 resize-none rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-gray-500 overflow-y-auto ${
                homepageMode
                  ? selectedFiles.length > 0 || selectedVaultDocIds.length > 0
                    ? "min-h-[80px] max-h-[400px] px-6 pt-2 pb-16 pr-16 text-[13px] md:text-base"
                    : "min-h-[120px] max-h-[400px] px-6 pt-4 pb-16 pr-16 text-[13px] md:text-base"
                  : selectedFiles.length > 0
                  ? "min-h-[80px] max-h-[300px] pl-6 pr-16 pt-2 pb-16"
                  : "min-h-[100px] max-h-[300px] pl-6 pr-16 pt-4 pb-16"
              }`}
              disabled={isSubmitting}
            />

            {/* Send button positioned inside textarea */}
            <div
              className={
                homepageMode
                  ? "absolute right-3 bottom-3"
                  : "absolute right-2 bottom-2"
              }
            >
              <Button
                className="primary text-white z-10 absolute right-3 bottom-3 shadow-md h-10 w-10 rounded-lg"
                disabled={!input.trim() || isSubmitting}
                onClick={() => handleSend()}
              >
                {isSubmitting ? (
                  <Loader2
                    className={`animate-spin text-white ${
                      homepageMode ? "h-5 w-5" : "h-4 w-4"
                    }`}
                  />
                ) : (
                  <Send
                    className={`text-white ${
                      homepageMode ? "h-5 w-5" : "h-4 w-4"
                    }`}
                  />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Modals */}
      <ProAccessModal
        isOpen={showProAcess}
        onClose={() => setShowProAccess(false)}
        errorMessage={
          projectRequiresUpgrade
            ? "You have reached your workspace limit. Upgrade to create unlimited workspaces."
            : "You have reached your message limit. Upgrade to send unlimited messages."
        }
        userData={{
          name: session?.user?.name || "",
          email: session?.user?.email || "",
          accountType: "personal", // Default to personal, user can change
        }}
      />
      {/* Document Selection Modal - only show in chat mode since it needs projectId */}
      {!homepageMode && (
        <UploadDocumentModal
          open={showDocumentModal}
          mode="upload-and-attach"
          onOpenChange={setShowDocumentModal}
          projectId={projectId}
          onDocumentsAdded={handleDocumentsAdded}
        />
      )}

      {/* Vault Document Selection Modal */}
      <UploadDocumentModal
        open={showVaultModal}
        mode="select"
        onOpenChange={setShowVaultModal}
        projectId={homepageMode ? undefined : projectId}
        onDocumentsAdded={(docs) => {
          if (homepageMode) {
            // Store doc IDs to attach after project creation
            const newIds = docs.map((d: any) => d.id);
            setSelectedVaultDocIds(prev => [...prev, ...newIds.filter((id: string) => !prev.includes(id))]);
            addToast({ message: `${docs.length} document${docs.length > 1 ? 's' : ''} selected`, type: "success" });
          } else {
            handleDocumentsAdded(docs);
          }
        }}
        title="Add Documents from Vault"
        description={homepageMode
          ? "Select documents to include when you start a new conversation"
          : "Select documents from your vault to add to this workspace"
        }
      />
    </>
  );
}
