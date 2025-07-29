// app/projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Search,
  Briefcase,
  ArrowRight,
  FolderPlus,
  ArrowUpDown,
} from "lucide-react";
import {  format } from "date-fns";
import { useProjectStore } from "@/store/project.store";
import CreateProjectModal from "@/components/projects/CreateProjectModal";


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
    
    // Apply sort order
    return sortOrder === "asc" ? -result : result;
  });

  
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
              className="overflow-hidden hover:shadow-md transition-all"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex-1 truncate mr-2">{project.title}</CardTitle>
           
                </div>
                <CardDescription className="line-clamp-2">{project.description || "No description"}</CardDescription>
              </CardHeader>

              
              <CardFooter className="border-t pt-4">
                <p className="text-gray-600 text-sm">Created {format(new Date(project.createdAt), "PP")} </p>
                <Button variant="ghost" size="sm" className="ml-auto">
                  View Workspace
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
    </div>
  );
}