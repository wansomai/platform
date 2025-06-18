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
} from "lucide-react";
import { useProjectStore } from "@/store/project.store"
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { useDocumentsStore } from "@/store/documents.store";
// Quick Action Card Component
interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color?: string;
}

const QuickActionCard = ({ icon: Icon, title, description, href, color = "text-primary-600" }: QuickActionProps) => (
  <Card className="hover:shadow-md transition-all cursor-pointer">
    <Link href={href} className="block p-6">
      <div className="flex items-start space-x-4">
        <div className={`rounded-full p-3 ${color.replace('text', 'bg')}/10`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="space-y-1">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  </Card>
);



export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { fetchProjects, projects, isLoading } = useProjectStore();
  const { documents, fetchDocuments } = useDocumentsStore();
  const [showProjectModal, setShowProjectModal] = useState(false);
  useEffect(() => {
    fetchProjects();
    fetchDocuments();
  }, [fetchProjects, fetchDocuments]);


  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-black">
              Welcome back, {session?.user?.name?.split(" ")[0] || "User"}
            </h1>
            <p className="text-primary-100 mt-1 text-black">
              Here's what's happening across your legal workspace
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="outline" className="text-white  hover:bg-black bg-primary hover:text-white" onClick={() => setShowProjectModal(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Project Workspace
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickActionCard
              icon={FileUp}
              title="Upload Document"
              description="Add contracts, pleadings, or evidence to your vault"
              href="/vault"
              color="text-blue-600"
            />
            <QuickActionCard
              icon={Briefcase}
              title="Create Project Workspace"
              description="Organize your deep work into dedicated  workspaces"
              href="/projects"
              color="text-purple-600"
            />
            <QuickActionCard
              icon={MessageSquare}
              title="AI Assistant"
              description="Get help with legal research and document analysis"
              href="/assistant"
              color="text-green-600"
            />
            <QuickActionCard
              icon={Zap}
              title="Start Workflow"
              description="Automated predefined legal process with templates"
              href="/workflows"
              color="text-amber-600"
            />
          </div>
        </div>

        {/* Activity Feed & Assistant */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Card className="h-[400px] flex flex-col">
            <CardContent className="p-0 overflow-hidden flex-1">
              <Tabs defaultValue="projects" className="h-full flex flex-col">
                <div className="px-4 pt-4">
                  <TabsList className="w-full">
                  <TabsTrigger value="projects" className="flex-1">Workspaces</TabsTrigger>
                    <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
                   
                  </TabsList>
                </div>
                <TabsContent value="documents" className="flex-1 overflow-auto p-0 m-0">
                  <div className="pt-2 divide-y divide-gray-100">
                    {documents
                      .map((a, i) => (

                        <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-wrap overflow-hidden" key={i}>
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
                <TabsContent value="projects" className="flex-1 overflow-auto p-0 m-0">

                  <div className="pt-2 divide-y divide-gray-100">
                    {isLoading ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading projects...</p>
                      </div>
                    ) : projects?.length === 0 ? (
                      <div className="text-center p-6">
                        <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <h3 className="text-lg font-medium">No workspaces yet</h3>
                        <p className="text-sm text-gray-500 mb-4">Create your first workspace to get started</p>
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
                                <div >
                                  <h3 className="font-medium">{project.title}</h3>
                                  <p className="text-xs text-gray-500">
                                    {project.documents_count} documents • {project.team_count} team members
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
              <Button variant="ghost"  className="w-full" onClick={() => router.push('/projects')}>
                View all Workspaces
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <CreateProjectModal open={showProjectModal} onClose={() => setShowProjectModal(false)} />
    </div>
  );
}