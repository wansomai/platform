// src/components/chat/ChatInput.tsx
"use client";
import { useRef, useState, useEffect, useCallback } from "react";
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
  Settings,
  ArrowUpRightFromSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/store/chat.store";
import { useUIStore } from "@/store/ui.store";
import { useProjectStore } from "@/store/project.store";
import { useOrganization } from "@/store/profile.store";
import { useNotifications } from "@/hooks/useNotifications";
import { useSession } from "next-auth/react";
import ProAccessModal from "../modals/ProAccess";
import { UploadDocumentModal } from "../modals/UploadModal";
import { useProjectSettingsStore } from "@/store/workspace-settings.store";
import { useProjectDocumentsStore } from "@/store/workspace-documents.store";
import { apiService } from "@/lib/api";

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
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showProAcess, setShowProAccess] = useState(false);

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

  const {
    settings,
    updateSetting,
    isLoading: isLoadingSettings,
  } = useProjectSettingsStore();

  const { documents: conversationDocuments, fetchProjectDocuments } =
    useProjectDocumentsStore();

  // Get right sidebar state from UI store
  const { rightSidebarCollapsed, setRightSidebarCollapsed } = useUIStore();

  const { data: session } = useSession();

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

  // Restore pending message from homepage when in workspace mode
  useEffect(() => {
    if (!homepageMode && typeof window !== "undefined") {
      const pendingMessage = sessionStorage.getItem("pendingMessage");
      if (pendingMessage && !input) {
        // Restore the message to the input
        setInput(pendingMessage);
        // Clear the stored message to prevent it from being restored again
        sessionStorage.removeItem("pendingMessage");
      }
    }
  }, [homepageMode, input]);

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

    document.addEventListener("action-prompt-send", handlePromptSendEvent);

    return () => {
      document.removeEventListener("action-prompt-send", handlePromptSendEvent);
    };
  }, [currentConversation]);

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

  // Handle Google account connection
  const handleConnectGoogle = (
    type: "calendar" | "gmail"
  ) => {
    setIsConnecting(true);
   setShowProAccess(true);
    // const url = `/api/auth/google-connection/connect?type=${encodeURIComponent(
    //   type
    // )}`;
    // window.location.href = url;
  };

  // Handle Google account disconnection
  const handleDisconnectGoogle = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect your Google account? This will disable Calendar and Gmail features."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/auth/google-connection/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        setGoogleConnectionStatus({
          connected: false,
          email: null,
          hasCalendarAccess: false,
          hasGmailAccess: false,
        });
        notify.success("Google account disconnected");

        // Disable Calendar and Gmail settings
        if (settings.googleCalendar) {
          await updateSetting(projectId, "googleCalendar", false);
        }
        if (settings.gmail) {
          await updateSetting(projectId, "gmail", false);
        }
      } else {
        notify.error("Failed to disconnect Google account");
      }
    } catch (error) {
      console.error("Error disconnecting Google:", error);
      notify.error("Failed to disconnect Google account");
    }
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

          const payload = {
            title: projectTitle,
            description: "Quick AI chat session",
            organizationId: session.user.organization.id,
          };

          const newProject = await createProject(payload);

          if (newProject) {
            notify.success("AI workspace created successfully!");

            // Store the message in sessionStorage to preserve it across navigation
            sessionStorage.setItem("pendingMessage", messageToSend);

            // Call callback if provided
            onWorkspaceCreated?.(newProject.id);

            // Navigate to the new project - the message will be restored in the workspace
            router.push(`/projects/${newProject.id}`);
          } else {
            throw new Error("Failed to create project");
          }
        } catch (error: any) {
          notify.error("Failed to create AI workspace. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Normal chat mode - requires existing conversation
      if (!currentConversation) return;

      try {
        setIsSubmitting(true);

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
    ]
  );

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

      addToast({ message: `${settingKey} setting updated`, type: "success" });
    } catch (error) {
      addToast({
        message: `Failed to update ${settingKey} setting`,
        type: "error",
      });
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
  // Toggle sidebar function
  const toggleSidebar = () => {
    setRightSidebarCollapsed(!rightSidebarCollapsed);
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

  return (
    <>
      {/* Input Area - Different styling for homepage vs chat mode */}
      <div
        className={
          homepageMode
            ? "relative w-full max-w-4xl mx-auto"
            : "fixed bottom-2 left-1/2 transform -translate-x-1/2 z-50 w-[80vw]"
        }
      >
        <div className={homepageMode ? "w-full" : "w-full max-w-3xl mx-auto"}>
          {/* Input Area with embedded icons */}
          <div
            className={`bg-white rounded-xl border-2 border-gray-200 focus-within:border-primary-300 transition-colors relative ${
              homepageMode ? "shadow-sm focus-within:shadow-md" : "shadow-lg"
            }`}
          >
            {/* Left side icons - show in all modes */}
            <div
              className={`absolute flex items-center gap-1 z-10 w-full ${
                homepageMode ? "left-6 bottom-3" : "left-6 bottom-2"
              }`}
            >
              {/* Documents Tool */}
              <Button
                variant="outline"
                size="sm"
                onClick={
                  homepageMode ? undefined : () => setShowDocumentModal(true)
                }
                className={`h-8 w-8 p-0 rounded-md ${
                  homepageMode
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-gray-100"
                }`}
                title={
                  homepageMode
                    ? "Documents (available after creating workspace)"
                    : `Documents (${conversationDocuments?.length || 0})`
                }
                disabled={homepageMode}
              >
                <Paperclip className="h-6 w-6 text-gray-500" />
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
                    className="h-8 w-fit px-2 rounded-md hover:bg-gray-100"
                    title={
                      homepageMode
                        ? "AI Tools (preview - will be configurable after creating workspace)"
                        : "AI Tools"
                    }
                  >
                    <SlidersHorizontal className="h-6 w-6 text-gray-500" />{" "}
                    Tools
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
                          htmlFor="legal-drafting"
                          className="font-medium text-sm"
                        >
                          Draft & Review
                        </Label>
                      </div>
                      <Switch
                        id="legal-drafting"
                        checked={homepageMode ? false : settings.legalDrafting}
                        disabled={homepageMode || isLoadingSettings}
                        onCheckedChange={
                          homepageMode
                            ? undefined
                            : (checked) => {
                                handleSettingChange("legalDrafting", checked);
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
                        {googleConnectionStatus?.hasGmailAccess ? (
                          <Switch
                            id="gmail"
                            checked={
                              homepageMode
                                ? false
                                : settings.gmail || false
                            }
                            disabled={homepageMode || isLoadingSettings}
                            onCheckedChange={
                              homepageMode
                                ? undefined
                                : (checked) => {
                                    handleSettingChange(
                                      "gmail",
                                      checked
                                    );
                                  }
                            }
                          />
                        ) : (
                          <Button
                            onClick={() => handleConnectGoogle("gmail")}
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
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label
                          htmlFor="case-preparation"
                          className="font-medium text-sm"
                        >
                          Case Preparation
                        </Label>
                      </div>
                      <Switch
                        id="case-preparation"
                        checked={false}
                        disabled={true}
                        onCheckedChange={
                          homepageMode
                            ? undefined
                            : (checked) => {
                                setShowProAccess(true);
                              }
                        }
                      />
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
              {/* Settings Button for Sidebar Toggle */}
              <button
                className={`h-8 w-fit px-3 py-2 rounded-lg shadow-lg flex gap-1 items-center border-gray-10 border ${
                  homepageMode
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-gray-50"
                }`}
                onClick={homepageMode ? undefined : toggleSidebar}
                disabled={homepageMode}
                title={
                  homepageMode
                    ? "Settings (available after creating workspace)"
                    : "Settings"
                }
              >
                <Settings className="h-4 w-4 text-gray-500 text-xs" />
                Settings
              </button>
            </div>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                homepageMode
                  ? "Ask anything legal-related... (e.g., 'Help me draft a contract','Review this agreement')"
                  : "Ask Wansom..."
              }
              className={`border-0 resize-none rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-gray-500 overflow-y-auto ${
                homepageMode
                  ? "min-h-[120px] max-h-[400px] px-6 pt-4 pb-16 pr-16 text-[13px] md:text-base"
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
        onRequestAccess={handleRequestProAccess}
        isLoading={isUpgrading}
        errorMessage="You have reached your message limit (20 messages on free plan). Request Pro access to send unlimited messages."
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
    </>
  );
}
