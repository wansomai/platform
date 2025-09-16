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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/store/chat.store";
import { useUIStore } from "@/store/ui.store";
import { useProjectStore } from "@/store/project.store";
import { useNotifications } from "@/hooks/useNotifications";
import { useSession } from "next-auth/react";
import ProAccessModal from "../modals/ProAccess";
import { UploadDocumentModal } from "../modals/UploadModal";
import { useProjectSettingsStore } from "@/store/workspace-settings.store";
import { useProjectDocumentsStore } from "@/store/workspace-documents.store";

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
  const [isRequestingPro, setIsRequestingPro] = useState(false);

  // Get state from stores
  const { addToast } = useUIStore();
  const { notify } = useNotifications();
  const { createProject, requiresUpgrade: projectRequiresUpgrade } = useProjectStore();
  const { currentConversation, sendMessage, requiresUpgrade: chatRequiresUpgrade } = useChatStore();

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
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

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
            ""
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
  const testSEnd = () => {
    console.log("send clicked");
  };

  // Handle setting changes with exclusive logic for legal drafting and contract review
  const handleSettingChange = async (
    settingKey: keyof typeof settings,
    value: boolean
  ) => {
    if (!currentConversation) return;

    try {
      let updatesToMake: Partial<typeof settings> = { [settingKey]: value };

      // Exclusive toggle logic: only one of legalDrafting or contractReview can be active
      if (settingKey === "legalDrafting" && value) {
        updatesToMake.contractReview = false;
      } else if (settingKey === "contractReview" && value) {
        updatesToMake.legalDrafting = false;
      }

      // Update all settings that need to change
      for (const [key, val] of Object.entries(updatesToMake)) {
        await updateSetting(projectId, key as keyof typeof settings, val);
      }

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

  // Handle Pro access request
  const handleRequestProAccess = async (formData: { name: string; email: string; accountType: string }) => {
    setIsRequestingPro(true);
    const payload = {
      email: formData.email,
      name: formData.name,
      account_type: formData.accountType,
      request_type: "message_limit"
    };
    try {
      const response = await fetch("/api/prorequests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      await response.json();
      setShowProAccess(false);
      notify.success('Pro access request submitted successfully');
    } catch (error) {
      setIsRequestingPro(false);
      setShowProAccess(false);
      notify.error('Failed to submit Pro access request');
    } finally {
      setIsRequestingPro(false);
      setShowProAccess(false);
    }
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
                    {homepageMode && (
                      <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        Create a workspace to use Tools.
                      </p>
                    )}
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
                          Legal drafting
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
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label
                          htmlFor="contract-review"
                          className="font-medium text-sm"
                        >
                          Contract Review
                        </Label>
                      </div>
                      <Switch
                        id="contract-review"
                        checked={homepageMode ? false : settings.contractReview}
                        disabled={homepageMode || isLoadingSettings}
                        onCheckedChange={
                          homepageMode
                            ? undefined
                            : (checked) => {
                                handleSettingChange("contractReview", checked);
                              }
                        }
                      />
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
              className={`border-0 resize-none rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-gray-500 ${
                homepageMode
                  ? "min-h-[120px]  max-h-[200px] px-6 py-4 pr-16 text-[13px] md:text-base"
                  : "min-h-[100px] max-h-[180px] pl-6 pr-16 pt-4 pb-6"
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
        isLoading={isRequestingPro}
        errorMessage="You have reached your message limit (5 messages per month). Request Pro access to send unlimited messages."
        userData={{
          name: session?.user?.name || '',
          email: session?.user?.email || '',
          accountType: 'personal' // Default to personal, user can change
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
