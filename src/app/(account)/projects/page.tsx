"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  FileText,
  FolderPlus,
  Search,
  Users,
  Filter,
  Clock,
  MoreHorizontal,
  Folder,
  ArrowRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProjectStore } from "@/store/project.store"
import { useUIStore } from "@/store/ui.store"
import { formatDistanceToNow } from 'date-fns'

export default function ProjectsPage() {
  const router = useRouter()
  const { projects, fetchProjects, createProject, isLoading } = useProjectStore()
  const { addToast } = useUIStore()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("updated")
  
  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])
  
  // Handle new project creation
  const handleCreateProject = async () => {
    try {
      const project = await createProject({
        title: "New Project",
        description: "A new legal project"
      })
      
      if (project) {
        router.push(`/projects/${project.id}`)
      }
    } catch (error) {
      addToast({
        message: "Failed to create project",
        type: "error"
      })
    }
  }
  
  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      // Filter by search term
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
      // Filter by status
      const matchesStatus = statusFilter === "all" || project.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "updated":
        default:
          // Sort by last activity (most recent first)
          return a.last_activity.localeCompare(b.last_activity)
      }
    })
  
  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completed</Badge>
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Archived</Badge>
      case "on hold":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">On Hold</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        
        <Button onClick={handleCreateProject}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="on hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Last Updated</SelectItem>
              <SelectItem value="created">Date Created</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-60" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Folder className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-1">No projects found</h2>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? "Try a different search term or filter"
              : "Create your first project to get started"}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateProject}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id} className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-semibold line-clamp-1">{project.title}</h2>
                    {getStatusBadge(project.status)}
                  </div>
                  
                  <p className="mt-2 text-gray-600 line-clamp-2">
                    {project.description || "No description provided."}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{project.documents_count} Documents</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{project.team_count} Members</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{project.last_activity}</span>
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm capitalize">{project.status}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-end">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View Project
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}