// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

const QuickActionCard = ({
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
    <div className={`block p-6 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="flex items-start space-x-4">
        <div className={`rounded-full p-3 ${color.replace("text", "bg")}/10 ${disabled ? 'opacity-50' : ''}`}>
          {loading ? (
            <Loader2 className={`h-6 w-6 animate-spin ${color}`} />
          ) : (
            <Icon className={`h-6 w-6 ${color}`} />
          )}
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{title}</h3>
            {loading && (
              <span className="text-xs text-gray-500 animate-pulse">Creating...</span>
            )}
          </div>
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
};

// Helper function to generate meaningful project names
const generateQuickChatProjectName = (): string => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const dateStr = now.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric' 
  });
  
  return `Wansom - ${dateStr} ${timeStr}`;
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { fetchProjects, projects, isLoading, createProject } = useProjectStore();
  const { documents, fetchDocuments } = useDocumentsStore();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [isCreatingQuickChat, setIsCreatingQuickChat] = useState(false);
  const { notify } = useNotifications();

  useEffect(() => {
    fetchProjects();
    fetchDocuments();
  }, [fetchProjects, fetchDocuments]);

  const handleQuickChatCreate = async () => {
    if (!session?.user?.organization?.id) {
      notify.error('Something went wrong. Please try again.');
      return;
    }

    setIsCreatingQuickChat(true);
    
    try {
      // Generate a meaningful project name
      const projectTitle = generateQuickChatProjectName();
      
      const payload = {
        title: projectTitle,
        description: 'Quick AI chat session',
        organizationId: session.user.organization.id
      };

      const newProject = await createProject(payload);
      
      if (newProject) {
        notify.success('AI workspace created successfully!');
        // Navigate to the new project
        router.push(`/projects/${newProject.id}`);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error: any) {
      notify.error('Failed to create AI workspace. Please try again.');
      console.error('Error creating quick chat:', error);
    } finally {
      setIsCreatingQuickChat(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-5xl text-black">
              Welcome Back, {session?.user?.name?.split(" ")[0] || "User"}
            </h1>
            <p className="text-primary-100 mt-1 text-black">
              Here's what's happening across your legal workspace
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickActionCard
              icon={MessageSquare}
              title="Quick AI Assistant"
              description="Chat with legal specific AI, get quick responses to your questions"
              onClick={handleQuickChatCreate}
              color="text-green-600"
              loading={isCreatingQuickChat}
              disabled={isCreatingQuickChat}
            />
            <QuickActionCard
              icon={Briefcase}
              title="Create Project Workspace"
              description="Collaborate, organize your work into case or client files"
              href="/projects"
              color="text-purple-600"
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
            <QuickActionCard
              icon={Zap}
              title="Start Workflow"
              description="Automate predefined legal processes with templates"
              href="/workflows"
              color="text-amber-600"
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
                    {documents.map((a, i) => (
                      <div
                        className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-wrap overflow-hidden"
                        key={i}
                      >
                        <div className={`rounded-full p-2 bg-blue-100 mt-1`}>
                          <FileText className={`h-4 w-4 text-blue-500`} />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex justify-between">
                            <h4 className="text-sm font-medium">{a.title}</h4>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent
                  value="projects"
                  className="flex-1 overflow-auto p-0 m-0"
                >
                  <div className="pt-2 divide-y divide-gray-100">
                    {isLoading ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">
                          Loading projects...
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
                        <Button onClick={() => setShowProjectModal(true)}>
                          <FolderPlus className="mr-2 h-4 w-4" />
                          Create Workspace
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {projects?.slice(0, 3).map((project) => (
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
                                  <h3 className="font-medium">
                                    {project.title}
                                  </h3>
                                  <p className="text-xs text-gray-500">
                                    {project.documents_count} documents •{" "}
                                    {project.team_count} team members
                                  </p>
                                </div>
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
                onClick={() => router.push("/projects")}
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
        onClose={() => setShowProjectModal(false)}
      />
    </div>
  );
}