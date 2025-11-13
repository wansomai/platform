// app/dashboard/page.tsx
"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import WelcomeBanner from "@/components/layout/WelcomeBanner";
import {
  FileText,
  FolderPlus,
  ArrowRight,
  MessageSquare,
  Briefcase,
  FileUp,
  Zap,
  Loader2,
} from "lucide-react";
import { useProjectStore } from "@/store/project.store";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { useDocumentsStore } from "@/store/documents.store";
import { useNotifications } from "@/hooks/useNotifications";
import { ChatInput } from "@/components/chat/ChatInput";
// Quick Action Card Component
interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  color?: string;
  loading?: boolean;
  disabled?: boolean;
}

const QuickActionCard = React.memo(({
  icon: Icon,
  title,
  description,
  href,
  onClick,
  color = "text-primary-600",
  loading = false,
  disabled = false,
}: QuickActionProps) => {
  const content = (
    <div className={`block p-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="">
        <div className=" flex flex-shrink-0">
 <div className={`rounded-full p-3 ${color.replace("text", "bg")}/10 ${disabled ? 'opacity-50' : ''}`}>
          {loading ? (
            <Loader2 className={`h-6 w-6 animate-spin ${color}`} />
          ) : (
            <Icon className={`h-6 w-6 ${color}`} />
          )}
        </div>
            <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">{title}</h3>
            {loading && (
              <span className="text-xs text-gray-500 animate-pulse">Creating...</span>
            )}
          </div>
        </div>
       
        <div className="space-y-1 flex-1">
      
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );

  if (href && !loading && !disabled) {
    return (
      <Card className="hover:shadow-md transition-all">
        <Link href={href}>{content}</Link>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-md transition-all ${!disabled && !loading ? 'hover:shadow-md' : ''}`}>
      <div onClick={disabled || loading ? undefined : onClick}>
        {content}
      </div>
    </Card>
  );
});

export default function DashboardPage() {
  const router = useRouter();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [isCreatingQuickChat, setIsCreatingQuickChat] = useState(false);
    const { fetchProjects, projects, isLoading: projectsLoading } = useProjectStore();
  const { documents, fetchDocuments, isLoading: documentsLoading } = useDocumentsStore();
  const { notify } = useNotifications();

  // Load dashboard data on mount only
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchProjects(),
          fetchDocuments({ limit: 5 })
        ]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
        notify.error(errorMessage);
      }
    };

    loadData();
  }, []); // Only run on mount

  // Memoized computed values for performance
  const recentProjects = useMemo(() => 
    projects?.slice(0, 3) || [], 
    [projects]
  );

  const recentDocuments = useMemo(() => 
    documents?.slice(0, 5) || [], 
    [documents]
  );

  // Memoized event handlers
  const handleShowProjectModal = useCallback(() => {
    setShowProjectModal(true);
  }, []);

  const handleCloseProjectModal = useCallback(() => {
    setShowProjectModal(false);
  }, []);

  const handleWorkspaceCreated = useCallback((projectId: string) => {
    // Optional: Handle workspace creation if needed
  }, []);

  // Memoized router navigation handlers
  const navigateToVault = useCallback(() => {
    router.push("/vault");
  }, [router]);

  const navigateToProjects = useCallback(() => {
    router.push("/projects");
  }, [router]);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Quick Actions & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl">Start working with AI</h2>
          
      {/* AI Chat Input Section */}
      <div className="w-full max-w-4xl mx-auto space-y-6">

        <ChatInput 
          homepageMode={true}
          onWorkspaceCreated={handleWorkspaceCreated}
        />
        
        {/* Helper text */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Enter</kbd> to send, 
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono ml-1">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-2">
            <QuickActionCard
              icon={MessageSquare}
              title="New Workspace"
              description="Create a dedicated workspace for each client matter or case."
              onClick={handleShowProjectModal}
              color="text-green-600"
              loading={isCreatingQuickChat}
              disabled={isCreatingQuickChat}
            />
            <QuickActionCard
              icon={Zap}
              title="Start Workflow"
              description="Automate predefined legal processes with AI"
              href="/workflows"
              color="text-amber-600"
              disabled={isCreatingQuickChat}
            />
            <QuickActionCard
              icon={FileUp}
              title="Upload Documents"
              description="Add contracts, pleadings, or evidence to your vault"
              href="/vault"
              color="text-blue-600"
              disabled={isCreatingQuickChat}
            />

          </div>
        </div>

        {/* Activity Feed & Assistant */}
        <div className="space-y-6">
          <h2 className="text-2xl">Recent Activity</h2>
          <Card className="h-[400px] flex flex-col">
            <CardContent className="p-0 overflow-hidden flex-1">
              <Tabs defaultValue="projects" className="h-full flex flex-col">
                <div className="px-4 pt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="projects" className="flex-1">
                      Workspaces
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex-1">
                      Documents
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent
                  value="documents"
                  className="flex-1 overflow-auto p-0 m-0"
                >
                  <div className="pt-2 divide-y divide-gray-100">
                    {documentsLoading ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">
                          Loading documents...
                        </p>
                      </div>
                    ) : documents?.length === 0 ? (
                      <div className="text-center p-6">
                        <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <h3 className="text-lg font-medium">
                          No documents yet
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Upload your first document to get started
                        </p>
                        <Button onClick={navigateToVault}>
                          <FileUp className="mr-2 h-4 w-4" />
                          Upload Document
                        </Button>
                      </div>
                    ) : (
                      recentDocuments.map((a, i) => (
                        <div
                          className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-wrap overflow-hidden"
                          key={i}
                        >
                          <div className={`rounded-full p-2 bg-green-100 mt-1`}>
                            <FileText className={`h-4 w-4 text-primary`} />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex justify-between">
                              <h4 className="text-sm font-medium">{a.title}</h4>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
                <TabsContent
                  value="projects"
                  className="flex-1 overflow-auto p-0 m-0"
                >
                  <div className="pt-2 divide-y divide-gray-100">
                    {projectsLoading ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">
                          Loading workspaces...
                        </p>
                      </div>
                    ) : projects?.length === 0 ? (
                      <div className="text-center p-6">
                        <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <h3 className="text-lg font-medium">
                          No workspaces yet
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Create your first workspace to get started
                        </p>
                        <Button onClick={handleShowProjectModal}>
                          <FolderPlus className="mr-2 h-4 w-4" />
                          Create Workspace
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {recentProjects.map((project) => (
                          <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="block"
                          >
                            <div className="flex items-center flex-wrap justify-between p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-3 ">
                                <div className="p-2 bg-gray-100 rounded-full">
                                  <Briefcase className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-sm">
                                    {project.title}
                                  </h3>
                                 
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500 mr-2">
                                  {new Date(project.updatedAt).toLocaleDateString()}
                                </span>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="border-t p-3 bg-gray-50">
              <Button
                variant="ghost"
                className="w-full"
                onClick={navigateToProjects}
                disabled={isCreatingQuickChat}
              >
                View all Workspaces
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <CreateProjectModal
        open={showProjectModal}
        onClose={handleCloseProjectModal}
      />
    </div>
  );
}