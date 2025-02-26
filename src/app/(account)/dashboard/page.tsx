"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjectStore } from "@/store/project.store"
import { useAuthStore } from "@/store/auth.store"
import { 
  FolderPlus, 
  Clock, 
  BarChart3, 
  Briefcase, 
  FileText, 
  Users, 
  CalendarDays, 
  Folder, 
  ArrowRight, 
  Loader2 
} from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { projects, fetchProjects, createProject, isLoading: projectsLoading } = useProjectStore()
  
  // Fetch projects on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects()
    }
  }, [isAuthenticated, fetchProjects])
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])
  
  // Handle new project creation
  const handleCreateProject = async () => {
    const project = await createProject({
      title: "New Project",
      description: "A new legal project"
    })
    
    if (project) {
      router.push(`/projects/${project.id}`)
    }
  }
  
  const isLoading = authLoading || projectsLoading
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        
        <Skeleton className="h-64" />
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.fullName || 'User'}</h1>
          <p className="text-gray-500">{user?.organization?.name || 'Your Organization'}</p>
        </div>
        
        <Button onClick={handleCreateProject}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
      
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'active').length}
              </div>
              <Briefcase className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {/* In a real app, this would show the count of recent activities */}
                {Math.min(projects.length * 2, 10)}
              </div>
              <Clock className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Document Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {/* Sum the document counts from all projects */}
                {projects.reduce((total, project) => total + project.documents_count, 0)}
              </div>
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>
            Your most recently updated projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Create your first project to get started
              </p>
              <Button onClick={handleCreateProject}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => (
                <Link 
                  key={project.id} 
                  href={`/projects/${project.id}`} 
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {project.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {project.documents_count} documents • {project.team_count} team members
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">
                        {project.last_activity}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
              
              {projects.length > 5 && (
                <Link href="/projects" className="block">
                  <div className="text-center p-2">
                    <span className="text-sm text-primary-600 font-medium">
                      View all projects
                    </span>
                  </div>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}