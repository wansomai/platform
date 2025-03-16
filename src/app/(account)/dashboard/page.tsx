// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Folder, FolderPlus, ArrowRight, FileText, Clock, Briefcase } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { useRouter } from "next/navigation";
import { Project } from "@/types";
import { useProjectStore } from "@/store/project.store";
import { useSession } from "next-auth/react";
// Project type definition

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false)
  const { fetchProjects,projects,isLoading } = useProjectStore();
  useEffect(() => {
    fetchProjects();
  }, []);

  // This should be handled by middleware, but we'll add this check as a fallback
  if (!session?.user) {
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
    

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8 space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {session?.user?.name || 'User'}</h1>
          <p className="text-gray-500">{session?.user?.organization?.name || 'Your Organization'}</p>
        </div>
        
        <Button onClick={()=>setOpen(true)}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {projects?.filter(p => p.status === 'active').length || 0}
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
                {Math.min(projects?.length * 2, 10) || 0}
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
                {projects?.reduce((total, project) => total + project.documents_count, 0) || 0}
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
            Your most recently updated Projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
          ) : (
            <div className="space-y-2">
            {projects?.slice(0, 5).map((project) => (
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
            
            {projects?.length > 5 && (
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
      </main>
         {/* Create Project Modal Component - you'll need to create this */}
         {open && (
        <CreateProjectModal 
          open={open} 
          onClose={() => setOpen(false)} 
         
        />
      )}
    </div>
  );
}