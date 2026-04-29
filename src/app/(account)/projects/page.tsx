// app/projects/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Search,
  Briefcase,
  ArrowRight,
  FolderPlus,
  ArrowUpDown,
  MoreVertical,
  UserPlus,
  Trash2,
  Pin,
  PinOff,
} from "lucide-react";
import { format } from "date-fns";
import { useProjectStore } from "@/store/project.store";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { WorkspacePermissionModal } from "@/components/projects/WorkspacePermissionModal";
import { useNotifications } from "@/hooks/useNotifications";
import { useProfile } from "@/store/profile.store";
import { apiService } from "@/lib/api";

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, fetchProjects, isLoading, removeProject } = useProjectStore();
  const { notify } = useNotifications();
  const { fetchProfile } = useProfile();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [favoriteProjects, setFavoriteProjects] = useState<string[]>([]);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<{ id: string; title: string } | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // pinnedProjectIds: ordered array preserving FIFO pin order
  const [pinnedProjectIds, setPinnedProjectIds] = useState<string[]>([]);

  // Track if we've already handled the connection notification
  const connectionHandledRef = useRef(false);

  // Fetch projects, profile, and pin state on mount
  useEffect(() => {
    fetchProjects();
    fetchProfile(true);
    apiService.get<{ data: Array<{ itemId: string }> }>('/api/pins?itemType=project')
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setPinnedProjectIds(data.map((p) => p.itemId));
        }
      })
      .catch(() => {});
  }, [fetchProjects, fetchProfile]);

  const handleToggleProjectPin = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isPinned = pinnedProjectIds.includes(projectId);
    // Optimistic update
    setPinnedProjectIds(prev =>
      isPinned ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
    try {
      await apiService.post('/api/pins', { itemType: 'project', itemId: projectId });
    } catch {
      // Revert on failure
      setPinnedProjectIds(prev =>
        isPinned ? [...prev, projectId] : prev.filter(id => id !== projectId)
      );
    }
  };

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
    setTimeout(() => {
      router.replace('/projects');
    }, 100);
  }, [searchParams, router, notify]);

  // Filter and sort projects
  const filteredProjects = projects
    ? projects.filter((project) => {
        const matchesSearch = 
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = 
          statusFilter === "all" || 
          project.status.toLowerCase() === statusFilter.toLowerCase();
        
        return matchesSearch && matchesStatus;
      })
    : [];
  
  // Sort projects — pinned first (FIFO order), then favorites, then selected criteria
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const aPin = pinnedProjectIds.indexOf(a.id);
    const bPin = pinnedProjectIds.indexOf(b.id);
    const aPinned = aPin !== -1;
    const bPinned = bPin !== -1;

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    if (aPinned && bPinned) return aPin - bPin; // preserve FIFO

    const aIsFavorite = favoriteProjects.includes(a.id);
    const bIsFavorite = favoriteProjects.includes(b.id);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    let result = 0;
    switch (sortBy) {
      case "name":
        result = a.title.localeCompare(b.title);
        break;
      case "updated":
        result = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        break;
      case "created":
        result = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      case "activity":
        result = b.messagesCount - a.messagesCount;
        break;
      case "documents":
        result = b.documentsCount - a.documentsCount;
        break;
      default:
        result = 0;
    }
    return sortOrder === "asc" ? -result : result;
  });

  // Handle project creation
  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  // Handle project deletion
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      const success = await removeProject(projectToDelete.id);

      if (!success) {
        throw new Error('Failed to delete workspace');
      }

      // Show success notification
      notify.success('Workspace deleted successfully');

      // Close dialog
      setProjectToDelete(null);
    } catch (error: any) {
      console.error('Error deleting project:', error);
      notify.error(error.message || 'Failed to delete workspace. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">All Workspaces</h1>
          <p className="text-gray-500">Manage your legal projects and client matters</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleCreateProject}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Create Workspace
          </Button>
        </div>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search workspaces..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="hidden sm:flex"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Projects Display */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-2"></div>
          <p className="text-gray-500">Loading workspaces...</p>
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-gray-50">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Briefcase className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No workspaces found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first workspace to get started"}
          </p>
          <Button onClick={handleCreateProject}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Create Workspace
          </Button>
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((project) => (
            <Card
              key={project.id}
              className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle
                    className="flex-1 truncate mr-2 flex items-center gap-1.5"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    {pinnedProjectIds.includes(project.id) && (
                      <Pin className="h-3 w-3 text-amber-500 shrink-0" />
                    )}
                    {project.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => handleToggleProjectPin(project.id, e)}
                      >
                        {pinnedProjectIds.includes(project.id)
                          ? <><PinOff className="h-4 w-4 mr-2" />Unpin</>
                          : <><Pin className="h-4 w-4 mr-2" />Pin to top</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectForMembers({ id: project.id, title: project.title });
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete({ id: project.id, title: project.title });
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription
                  className="line-clamp-2"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  {project.description || "No description"}
                </CardDescription>
              </CardHeader>

              <CardFooter className="border-t pt-4">
                <p className="text-gray-600 text-sm">Created {format(new Date(project.createdAt), "PP")} </p>
                <Button variant="ghost" size="sm" className="ml-auto"   onClick={() => router.push(`/projects/${project.id}`)}>
              
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Share Modal */}
      {selectedProjectForMembers && (
        <WorkspacePermissionModal
          open={!!selectedProjectForMembers}
          onClose={() => setSelectedProjectForMembers(null)}
          projectId={selectedProjectForMembers.id}
          projectTitle={selectedProjectForMembers.title}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{projectToDelete?.title}</strong>? This action cannot be undone.
              All conversations, documents, and data associated with this workspace will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}