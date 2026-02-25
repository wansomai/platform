// app/dashboard/workflows/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Plus,
  Crown,
  ChevronRight,
  Scale,
  MessageSquare,
  Trash2,
  Pencil,
  MoreVertical,
} from "lucide-react";
import { AIAssociate, PracticeArea, PRACTICE_AREA_LABELS } from "@/types";
import { useAssociates } from "@/hooks/useAssociates";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/project.store";
import { useChatStore } from "@/store/chat.store";
import { useProfile } from "@/store/profile.store";
import { useSession } from "next-auth/react";
import { useNotifications } from "@/hooks/useNotifications";
import { DeleteConfirmationDialog } from "@/components/modals/ConfirmationDialog";
import LogoAnimation from "@/components/commons/LogoAnimation";
import ProAccessModal from "@/components/modals/ProAccess";
import { useOrganization } from "@/store/profile.store";
import { premadeAssociates } from "@/lib/constants/premadeAssociates";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WorkflowsPage() {
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [associateToDelete, setAssociateToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showProAccess, setShowProAccess] = useState(false);

  const router = useRouter();
  const { data: session } = useSession();
  const { user: profile } = useProfile();
  const { createProject } = useProjectStore();
  const { createConversation } = useChatStore();
  const { notify } = useNotifications();
  const { isUpgrading, requestUpgrade } = useOrganization();

  const {
    associates,
    isLoading,
    error,
    fetchAssociates,
    deleteAssociate,
    isProcessing,
  } = useAssociates();

  useEffect(() => {
    fetchAssociates();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!associateToDelete) return;
    await deleteAssociate(associateToDelete.id);
    setAssociateToDelete(null);
  };

  const handleUseInChat = async (associate: AIAssociate) => {
    try {
      // Check if user is logged in
      if (!session?.user?.organization?.id) {
        notify.error("Please log in to use this feature");
        return;
      }

      // Show loading notification
      notify.info(`Creating workspace with ${associate.name}...`);

      // Generate a meaningful project name
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
      const projectTitle = `${associate.name} - ${dateStr} ${timeStr}`;

      // Use active organization ID
      const organizationId =
        profile?.activeOrganizationId ||
        profile?.organizationId ||
        session?.user?.organization?.id;

      // Create new project/workspace
      const newProject = await createProject({
        title: projectTitle,
        description: `Workspace with AI Associate: ${associate.name}`,
        organizationId,
      });

      if (!newProject) {
        notify.error("Failed to create workspace");
        return;
      }

      // Create conversation with the associate linked
      try {
        const conversation = await createConversation(
          newProject.id,
          `Chat with ${associate.name}`,
          associate.id
        );

        if (!conversation) {
          notify.error("Failed to create conversation");
          return;
        }

        // Success notification
        notify.success(`Workspace created with ${associate.name}!`);

        // Navigate to the new workspace
        router.push(`/projects/${newProject.id}`);
      } catch (convError: any) {
        // Check if this is a subscription limit error
        if (convError.status === 403 && convError.requiresUpgrade) {
          setShowProAccess(true);
          return;
        }
        throw convError; // Re-throw other errors
      }
    } catch (error: any) {
      // Check if this is a subscription limit error
      if (error.status === 403 && error.requiresUpgrade) {
        setShowProAccess(true);
        return;
      }
      console.error("Error creating workspace with associate:", error);
      notify.error(error.message || "Failed to create workspace");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* "Header */}
      <div className="bg-gradient-to-r from-[#E9F5F3] to-amber-100  rounded-lg p-4 flex flex-col md:flex-row  items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 p-2 rounded-full hidden md:block">
            <Crown className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-medium">What are AI Associates?</h3>
            <p className="text-sm text-gray-600">
              AI Associates are specialized assistants that help with specific
              legal tasks. Try a premade associate to start, or create your own.
            </p>
          </div>
        </div>
      </div>

      {/* Template Showcase */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Premade by Wansom</h2>
          {premadeAssociates.length > 3 && (
            <Button
              variant="link"
              onClick={() => setShowAllTemplates(!showAllTemplates)}
              className="text-primary hover:text-amber-600"
            >
              {showAllTemplates ? "Show less" : "Show more"}
              <ChevronRight
                className={`ml-1 h-4 w-4 transition-transform ${
                  showAllTemplates ? "rotate-90" : ""
                }`}
              />
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {premadeAssociates
            .slice(0, showAllTemplates ? premadeAssociates.length : 3)
            .map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-sm transition-all border-gray-200 hover:border-gray-300 cursor-pointer"
                onClick={() => router.push(`/workflows/template/${template.id}`)}
              >
                <CardContent className="p-4">
                  <div className="mb-1">
                    <div
                      className={`rounded-lg p-2 ${template.color.replace(
                        "text",
                        "bg"
                      )}/10 flex-shrink-0 w-fit`}
                    >
                      <template.icon className={`h-5 w-5 ${template.color}`} />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{template.name}</h3>
                      <p className="text-xs text-gray-500 truncate">
                        {template.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
      {/* My Associates Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            My Associates
            <span className="text-sm font-normal text-muted-foreground">
              ({associates.length})
            </span>
          </h2>
          <Button
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            onClick={() => router.push("/workflows/new")}
            disabled={isProcessing}
          >
            <Plus className="mr-2 h-4 w-4" />
            New AI Associate
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
          <LogoAnimation/>
          </div>
        ) : associates.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No associates yet</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Create your first AI associate to scale your legal team and
                automate workflows
              </p>
              <Button
                onClick={() => router.push("/workflows/new")}
                disabled={isProcessing}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Associate
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {associates.map((associate) => (
              <Card
                key={associate.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">
                          {associate.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {associate.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {associate.description ||
                          associate.instructions?.substring(0, 60) + "..."}
                      </p>
                      {associate.practiceAreas?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {associate.practiceAreas.slice(0, 3).map((area) => (
                            <span
                              key={area}
                              className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                            >
                              {PRACTICE_AREA_LABELS[area] || area}
                            </span>
                          ))}
                          {associate.practiceAreas.length > 3 && (
                            <span className="text-xs px-2 py-0.5 text-muted-foreground">
                              +{associate.practiceAreas.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseInChat(associate);
                        }}
                        disabled={isProcessing}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Use in Chat
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                            disabled={isProcessing}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/workflows/${associate.id}`);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssociateToDelete({
                                id: associate.id,
                                name: associate.name,
                              });
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!associateToDelete}
        onOpenChange={(open) => !open && setAssociateToDelete(null)}
        onConfirm={handleDeleteConfirm}
        itemName={associateToDelete?.name}
        itemType="associate"
        isLoading={isProcessing}
      />

      {/* Pro Access Modal */}
      <ProAccessModal
        isOpen={showProAccess}
        onClose={() => setShowProAccess(false)}
        userData={{
          name: profile?.fullName ?? undefined,
          email: profile?.email,
          accountType: profile?.organization?.accountType
        }}
      />
    </div>
  );
}
