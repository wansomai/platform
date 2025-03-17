// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  FileText, 
  FolderPlus, 
  ArrowRight, 
  MessageSquare, 
  Clock, 
  Briefcase, 
  Upload, 
  PlusCircle, 
  FileUp, 
  Calendar, 
  Zap, 
  BarChart3 
} from "lucide-react";
import { useProjectStore } from "@/store/project.store"
import CreateProjectModal from "@/components/projects/CreateProjectModal";

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

// Activity Item Component
interface ActivityItemProps {
  icon: React.ElementType;
  title: string;
  timestamp: string;
  description: string;
  color?: string;
}

const ActivityItem = ({ icon: Icon, title, timestamp, description, color = "text-gray-500" }: ActivityItemProps) => (
  <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
    <div className={`rounded-full p-2 ${color.replace('text', 'bg')}/10 mt-1`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
    <div className="space-y-1 flex-1">
      <div className="flex justify-between">
        <h4 className="text-sm font-medium">{title}</h4>
        <span className="text-xs text-gray-500">{timestamp}</span>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { fetchProjects, projects, isLoading } = useProjectStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [showProjectModal, setShowProjectModal] = useState(false);
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Mock data for activities
  const recentActivities = [
    { 
      icon: FileText, 
      title: "Contract uploaded", 
      timestamp: "30m ago", 
      description: "Johnson Service Agreement was added to Project Alpha", 
      color: "text-blue-600" 
    },
    { 
      icon: MessageSquare, 
      title: "New assistant conversation", 
      timestamp: "2h ago", 
      description: "You started a new conversation about contract review", 
      color: "text-green-600" 
    },
    { 
      icon: Briefcase, 
      title: "Project created", 
      timestamp: "5h ago", 
      description: "You created Project Beta", 
      color: "text-purple-600" 
    },
    { 
      icon: Calendar, 
      title: "Deadline approaching", 
      timestamp: "1d ago", 
      description: "Contract review deadline for Project Alpha is in 2 days", 
      color: "text-red-600" 
    },
  ];

  // Stats for the overview
  const stats = [
    { label: "Active Projects", value: projects?.filter(p => p.status === "active").length || 0, icon: Briefcase },
    { label: "Documents", value: projects?.reduce((acc, project) => acc + project.documents_count, 0) || 0, icon: FileText },
    { label: "Recent Activity", value: recentActivities.length, icon: Clock },
  ];

  // Workflow metrics for visualization
  const workflowMetrics = [
    { name: "Contract Reviews", completed: 8, total: 12, color: "bg-blue-500" },
    { name: "Due Diligence", completed: 3, total: 5, color: "bg-green-500" },
    { name: "Compliance Checks", completed: 6, total: 10, color: "bg-purple-500" },
  ];

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
            <Button variant="outline" className="text-white border-white hover:bg-primary-700 bg-green-500" onClick={() => setShowProjectModal(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
            <Button variant="outline" className="text-white border-white bg-black" onClick={() => router.push("/assistant")}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Ask Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
              href="/dashboard/vault?action=upload" 
              color="text-blue-600"
            />
            <QuickActionCard 
              icon={Briefcase} 
              title="Create Project" 
              description="Start a new legal project and organize documents" 
              href="/projects/new" 
              color="text-purple-600"
            />
            <QuickActionCard 
              icon={MessageSquare} 
              title="AI Assistant" 
              description="Get help with legal research and document analysis" 
              href="/dashboard/assistant" 
              color="text-green-600"
            />
            <QuickActionCard 
              icon={Zap} 
              title="Start Workflow" 
              description="Begin a predefined legal process with templates" 
              href="/dashboard/workflows" 
              color="text-amber-600"
            />
          </div>

          {/* Recent Projects */}
          <h2 className="text-xl font-semibold pt-4">Active Projects</h2>
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading projects...</p>
                </div>
              ) : projects?.length === 0 ? (
                <div className="text-center p-6">
                  <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No projects yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Create your first project to get started</p>
                  <Button onClick={() => router.push('/projects/new')}>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Create Project
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
                      <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <Briefcase className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
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
                  {projects && projects.length > 3 && (
                    <div className="p-3 text-center">
                      <Button variant="ghost" onClick={() => router.push('/projects')}>
                        View all projects
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed & Assistant */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Card className="h-[400px] flex flex-col">
            <CardContent className="p-0 overflow-hidden flex-1">
              <Tabs defaultValue="all" className="h-full flex flex-col">
                <div className="px-4 pt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                    <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
                    <TabsTrigger value="projects" className="flex-1">Projects</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="all" className="flex-1 overflow-auto p-0 m-0">
                  <div className="pt-2 divide-y divide-gray-100">
                    {recentActivities.map((activity, i) => (
                      <ActivityItem 
                        key={i} 
                        icon={activity.icon} 
                        title={activity.title} 
                        timestamp={activity.timestamp} 
                        description={activity.description} 
                        color={activity.color} 
                      />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="documents" className="flex-1 overflow-auto p-0 m-0">
                  <div className="pt-2 divide-y divide-gray-100">
                    {recentActivities
                      .filter(a => a.icon === FileText || a.title.includes('document') || a.title.includes('contract'))
                      .map((activity, i) => (
                        <ActivityItem 
                          key={i} 
                          icon={activity.icon} 
                          title={activity.title} 
                          timestamp={activity.timestamp} 
                          description={activity.description} 
                          color={activity.color} 
                        />
                      ))}
                  </div>
                </TabsContent>
                <TabsContent value="projects" className="flex-1 overflow-auto p-0 m-0">
                  <div className="pt-2 divide-y divide-gray-100">
                    {recentActivities
                      .filter(a => a.icon === Briefcase || a.title.includes('project'))
                      .map((activity, i) => (
                        <ActivityItem 
                          key={i} 
                          icon={activity.icon} 
                          title={activity.title} 
                          timestamp={activity.timestamp} 
                          description={activity.description} 
                          color={activity.color} 
                        />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="border-t p-3 bg-gray-50">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => router.push('/activity')}>
                View all activity
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