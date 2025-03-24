// app/projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Filter,
  Briefcase,
  FileText,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  MoreVertical,
  CheckCircle,
  ArrowRight,
  FolderPlus,
  ArrowUpDown,
  SlidersHorizontal,
  Star,
  StarOff
} from "lucide-react";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { useProjectStore } from "@/store/project.store";
import CreateProjectModal from "@/components/projects/CreateProjectModal";

// Project status badges
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case "completed":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
    case "on hold":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">On Hold</Badge>;
    case "archived":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Archived</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, fetchProjects, isLoading } = useProjectStore();
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [favoriteProjects, setFavoriteProjects] = useState<string[]>([]);
  
  // Fetch projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
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
  
  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let result = 0;
    
    // Check if either project is in favorites
    const aIsFavorite = favoriteProjects.includes(a.id);
    const bIsFavorite = favoriteProjects.includes(b.id);
    
    // Favorites always come first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    // Then sort by the selected criteria
    switch (sortBy) {
      case "name":
        result = a.title.localeCompare(b.title);
        break;
      case "updated":
        result = new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
        break;
      case "created":
        result = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      case "activity":
        result = b.messages_count - a.messages_count;
        break;
      case "documents":
        result = b.documents_count - a.documents_count;
        break;
      default:
        result = 0;
    }
    
    // Apply sort order
    return sortOrder === "asc" ? -result : result;
  });
  
  // Handle toggling a project as favorite
  const toggleFavorite = (projectId: string) => {
    setFavoriteProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };
  
  // Handle project creation
  const handleCreateProject = () => {
    setShowCreateModal(true);
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
          <Button variant="outline" className="hidden md:flex">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            View Options
          </Button>
          
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
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on hold">On Hold</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="created">Date Created</SelectItem>
            <SelectItem value="name">Project Name</SelectItem>
            <SelectItem value="activity">Activity Level</SelectItem>
            <SelectItem value="documents">Document Count</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="hidden sm:flex"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="hidden sm:flex"
        >
          {viewMode === "grid" ? (
            <TableBodyIcon className="h-4 w-4" />
          ) : (
            <div className="grid grid-cols-2 gap-1">
              <div className="h-1.5 w-1.5 bg-current rounded"></div>
              <div className="h-1.5 w-1.5 bg-current rounded"></div>
              <div className="h-1.5 w-1.5 bg-current rounded"></div>
              <div className="h-1.5 w-1.5 bg-current rounded"></div>
            </div>
          )}
        </Button>
      </div>
      
      {/* Project Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Workspaces</p>
                <h3 className="text-2xl font-bold mt-1">{projects?.length || 0}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Workspaces</p>
                <h3 className="text-2xl font-bold mt-1">
                  {projects?.filter(p => p.status.toLowerCase() === "active").length || 0}
                </h3>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Documents</p>
                <h3 className="text-2xl font-bold mt-1">
                  {projects?.reduce((sum, p) => sum + p.documents_count, 0) || 0}
                </h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Team Members</p>
                <h3 className="text-2xl font-bold mt-1">
                  {projects?.reduce((sum, p) => sum + p.team_count, 0) || 0}
                </h3>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
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
      ) : viewMode === "grid" ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((project) => (
            <Card 
              key={project.id} 
              className="overflow-hidden hover:shadow-md transition-all"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex-1 truncate mr-2">{project.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(project.status)}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(project.id);
                      }}
                    >
                      {favoriteProjects.includes(project.id) ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Star className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">{project.description || "No description"}</CardDescription>
              </CardHeader>
              
              <CardContent className="pb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Documents</p>
                    <p className="font-medium">{project.documents_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Team Members</p>
                    <p className="font-medium">{project.team_count}</p>
                  </div>
            
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-4">
                <Button variant="ghost" size="sm" className="ml-auto">
                  View Workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <span className="sr-only">Favorite</span>
                  </TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProjects.map((project) => (
                  <TableRow 
                    key={project.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(project.id);
                        }}
                      >
                        {favoriteProjects.includes(project.id) ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <Star className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{project.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">
                        {project.description || "No description"}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>{project.documents_count}</TableCell>
                    <TableCell>{project.team_count}</TableCell>
                    <TableCell>{format(new Date(project.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{project.last_activity ? project.last_activity : "None"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                            <Briefcase className="mr-2 h-4 w-4" />
                            View Project
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/documents`)}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Documents
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/team`)}>
                            <Users className="mr-2 h-4 w-4" />
                            Manage Team
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(project.id);
                            }}
                          >
                            {favoriteProjects.includes(project.id) ? (
                              <>
                                <StarOff className="mr-2 h-4 w-4" />
                                Remove from Favorites
                              </>
                            ) : (
                              <>
                                <Star className="mr-2 h-4 w-4" />
                                Add to Favorites
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

// Helper function for TableBody icon
function TableBodyIcon(props:any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3v18"></path>
      <rect width="18" height="18" x="3" y="3" rx="2"></rect>
      <path d="M3 9h18"></path>
      <path d="M3 15h18"></path>
    </svg>
  );
}