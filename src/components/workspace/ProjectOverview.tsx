"use client"

import { useParams } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  MessageSquare,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  Briefcase,
  Edit,
  Loader2
} from "lucide-react"
import { useProjectStore, ProjectDetails } from "@/store/project.store"
import { useChatStore } from "@/store/chat.store"
import { useUIStore } from "@/store/ui.store"
import { formatDistanceToNow, format, differenceInDays } from 'date-fns'
import { useState } from "react"
import { EditProjectModal } from "@/components/projects/EditProjectModal"
interface ProjectOverviewProps {
  project: ProjectDetails;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const { setActiveWorkspaceTab } = useUIStore()
  const [isEditing, setIsEditing] = useState(false);  
  
  // Calculate progress based on documents, team members, events
  const calculateProgress = () => {
    if (!project) return 0;
    
    let score = 0;
    const maxScore = 5;
    
    // Handle potential undefined values safely
    const knowledge_base = project.knowledge_base || {};
    
    // Has client information
    if (knowledge_base.client && 
        Object.keys(knowledge_base.client).length > 0 &&
        knowledge_base.client.name) {
      score += 1;
    }
    
    // Has team members
    if (knowledge_base.team && 
        Array.isArray(knowledge_base.team) &&
        knowledge_base.team.length > 0) {
      score += 1;
    }
    
    // Has documents
    if (knowledge_base.documents && 
        Array.isArray(knowledge_base.documents) &&
        knowledge_base.documents.length > 0) {
      score += 1;
    }
    
    // Has events
    if (knowledge_base.events && 
        Array.isArray(knowledge_base.events) &&
        knowledge_base.events.length > 0) {
      score += 1;
    }
    
    // Has AI interactions
    if (project.messages_count > 0) {
      score += 1;
    }
    
    return (score / maxScore) * 100;
  }
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'on hold':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  }
  
  // Safe access function for nested properties
  const safeGet = (obj: any, path: string, defaultValue: any = null) => {
    const keys = path.split('.');
    return keys.reduce((o, key) => (o && o[key] !== undefined ? o[key] : defaultValue), obj);
  };
  
  const progress = calculateProgress();
  const knowledge_base = project.knowledge_base || {};
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{project.title || "Untitled Project"}</h1>
          <p className="text-gray-500">
            Created {project.createdAt ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true }) : "recently"}
          </p>
        </div>
        <div className="flex gap-3">
          <Badge className={getStatusColor(project.status)}>
            {project.status || "Active"}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </div>
      </div>
      
      {/* Project Progress Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Project Progress</CardTitle>
          <CardDescription>
            Complete these steps to set up your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="grid gap-3 pt-2">
              {(!knowledge_base.client || 
                !Object.keys(knowledge_base.client).length || 
                !knowledge_base.client.name) ? (
                <Button 
                  variant="ghost" 
                  className="justify-start text-sm h-auto py-2"
                  onClick={() => setActiveWorkspaceTab('client')}
                >
                  <div className="flex gap-3 items-center">
                    <div className="bg-gray-100 rounded-full p-1">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Add client information</p>
                      <p className="text-gray-500 text-xs">Enter the client details for this project</p>
                    </div>
                  </div>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400" />
                </Button>
              ) : (
                <div className="flex gap-3 items-center py-2 px-3">
                  <div className="bg-green-100 rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Client information added</p>
                    <p className="text-gray-500 text-xs">{knowledge_base.client?.name || "Client"}</p>
                  </div>
                </div>
              )}
              
              {!safeGet(knowledge_base, 'team.length', 0) ? (
                <Button 
                  variant="ghost" 
                  className="justify-start text-sm h-auto py-2"
                  onClick={() => setActiveWorkspaceTab('team')}
                >
                  <div className="flex gap-3 items-center">
                    <div className="bg-gray-100 rounded-full p-1">
                      <Users className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Add team members</p>
                      <p className="text-gray-500 text-xs">Invite team members to collaborate</p>
                    </div>
                  </div>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400" />
                </Button>
              ) : (
                <div className="flex gap-3 items-center py-2 px-3">
                  <div className="bg-green-100 rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Team members added</p>
                    <p className="text-gray-500 text-xs">
                      {safeGet(knowledge_base, 'team.length', 0)} member{safeGet(knowledge_base, 'team.length', 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
              
              {!safeGet(knowledge_base, 'documents.length', 0) ? (
                <Button 
                  variant="ghost" 
                  className="justify-start text-sm h-auto py-2"
                  onClick={() => setActiveWorkspaceTab('documents')}
                >
                  <div className="flex gap-3 items-center">
                    <div className="bg-gray-100 rounded-full p-1">
                      <FileText className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Upload documents</p>
                      <p className="text-gray-500 text-xs">Add relevant files to the project</p>
                    </div>
                  </div>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400" />
                </Button>
              ) : (
                <div className="flex gap-3 items-center py-2 px-3">
                  <div className="bg-green-100 rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Documents uploaded</p>
                    <p className="text-gray-500 text-xs">
                      {safeGet(knowledge_base, 'documents.length', 0)} document{safeGet(knowledge_base, 'documents.length', 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
              
              {!safeGet(knowledge_base, 'events.length', 0) ? (
                <Button 
                  variant="ghost" 
                  className="justify-start text-sm h-auto py-2"
                  onClick={() => setActiveWorkspaceTab('schedule')}
                >
                  <div className="flex gap-3 items-center">
                    <div className="bg-gray-100 rounded-full p-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Schedule events</p>
                      <p className="text-gray-500 text-xs">Add important dates and deadlines</p>
                    </div>
                  </div>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400" />
                </Button>
              ) : (
                <div className="flex gap-3 items-center py-2 px-3">
                  <div className="bg-green-100 rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Events scheduled</p>
                    <p className="text-gray-500 text-xs">
                      {safeGet(knowledge_base, 'events.length', 0)} event{safeGet(knowledge_base, 'events.length', 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
              
              {!project.messages_count ? (
                <Button 
                  variant="ghost" 
                  className="justify-start text-sm h-auto py-2"
                  onClick={() => setActiveWorkspaceTab('chat')}
                >
                  <div className="flex gap-3 items-center">
                    <div className="bg-gray-100 rounded-full p-1">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Ask the AI Assistant</p>
                      <p className="text-gray-500 text-xs">Get help with your legal questions</p>
                    </div>
                  </div>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400" />
                </Button>
              ) : (
                <div className="flex gap-3 items-center py-2 px-3">
                  <div className="bg-green-100 rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">AI conversations started</p>
                    <p className="text-gray-500 text-xs">
                      {project.messages_count} message{project.messages_count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Project stats */}
      <div className="flex flex-wrap gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Team Members</CardDescription>
            <CardTitle className="text-2xl">
              {project.team_count || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <Button 
                variant="link" 
                className="px-0 h-auto text-xs" 
                onClick={() => setActiveWorkspaceTab('team')}
              >
                Manage team
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Documents</CardDescription>
            <CardTitle className="text-2xl">
              {project.documents_count || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <Button 
                variant="link" 
                className="px-0 h-auto text-xs" 
                onClick={() => setActiveWorkspaceTab('documents')}
              >
                View documents
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Assistant Usage</CardDescription>
            <CardTitle className="text-2xl">
              {project.messages_count || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <Button 
                variant="link" 
                className="px-0 h-auto text-xs" 
                onClick={() => setActiveWorkspaceTab('chat')}
              >
                Chat with assistant
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Activity</CardDescription>
            <CardTitle className="text-2xl">
              {project.last_activity && project.last_activity !== 'Recent' 
                ? formatDistanceToNow(new Date(project.last_activity), { addSuffix: true })
                : "Recent"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Recent activity on this project
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Project description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {project.description || 'No description provided.'}
          </p>
        </CardContent>
      </Card>
      
      {/* Recent activity or upcoming events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {knowledge_base.events && 
             Array.isArray(knowledge_base.events) &&
             knowledge_base.events.length > 0 ? (
              <div className="space-y-4">
                {knowledge_base.events
                  .slice(0, 3)
                  .map((event: any) => (
                    <div key={event.id} className="flex items-start">
                      <div className="bg-primary-50 p-2 rounded-md mr-3">
                        <Calendar className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{event.title}</h4>
                        <p className="text-xs text-gray-500">{format(new Date(event.date), 'PPP')}</p>
                      </div>
                    </div>
                  ))
                }
                <Button 
                  variant="outline" 
                  className="w-full text-sm"
                  onClick={() => setActiveWorkspaceTab('schedule')}
                >
                  View All Events
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-4">No upcoming events</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveWorkspaceTab('schedule')}
                >
                  Schedule an Event
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {knowledge_base.documents && 
             Array.isArray(knowledge_base.documents) &&
             knowledge_base.documents.length > 0 ? (
              <div className="space-y-4">
                {knowledge_base.documents
                  .slice(0, 3)
                  .map((doc: any) => (
                    <div key={doc.id} className="flex items-start">
                      <div className="bg-blue-50 p-2 rounded-md mr-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{doc.name}</h4>
                        <p className="text-xs text-gray-500">
                          Uploaded {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                }
                <Button 
                  variant="outline" 
                  className="w-full text-sm"
                  onClick={() => setActiveWorkspaceTab('documents')}
                >
                  View All Documents
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-4">No documents uploaded</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveWorkspaceTab('documents')}
                >
                  Upload a Document
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <EditProjectModal
          project={project}
          open={isEditing}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false);
          }}
        />
      </div>
    </div>
  )}