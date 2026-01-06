// app/dashboard/workflows/page.tsx
"use client"

import {useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  FileText,
  Clipboard,
  Crown,
  Snowflake,
  Sparkles,
  User,
  FileSearch,
  BarChart,
  Pencil,
  ChevronRight,
  Loader2,
  Scale,
  MessageSquare,
  Edit,
  Trash2,
} from "lucide-react"
import ProAccessModal from "@/components/modals/ProAccess"
import { LightBulbIcon } from "@heroicons/react/24/outline"
import { AIAssociate } from "@/types"
import { useAssociates } from "@/hooks/useAssociates"
import { useRouter } from "next/navigation"
import { useProjectStore } from "@/store/project.store"
import { useChatStore } from "@/store/chat.store"
import { useProfile } from "@/store/profile.store"
import { useSession } from "next-auth/react"
import { useNotifications } from "@/hooks/useNotifications"

// Workflow type definition
interface Workflow {
  id: string
  title: string
  description: string
  category: string
  status: "active" | "completed" | "draft"
  progress: number
  dueDate?: string
  assignee?: string
  createdAt: string
  steps: WorkflowStep[]
}

interface WorkflowStep {
  id: string
  title: string
  completed: boolean
  dueDate?: string
  assignee?: string
}

// Template workflow definitions organized by category
const workflowCategories = {
  "Litigation & Disputes": [
    {
      id: "litigation1",
      title: "Case Preparation",
      description: "Litigation case preparation workflow",
      category: "litigation",
      icon: Snowflake,
      color: "text-purple-600",
    },
    {
      id: "litigation2",
      title: "Discovery Management",
      description: "Document discovery and evidence collection",
      category: "litigation",
      icon: FileSearch,
      color: "text-purple-600",
    },
    {
      id: "litigation3",
      title: "Deposition Prep",
      description: "Witness preparation and deposition planning",
      category: "litigation",
      icon: User,
      color: "text-purple-600",
    },
  ],
  "Corporate & Transactional": [
    {
      id: "corporate1",
      title: "Contract Review",
      description: "Legal contract review and approval",
      category: "contracts",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      id: "corporate2",
      title: "Due Diligence",
      description: "M&A due diligence workflow",
      category: "corporate",
      icon: Clipboard,
      color: "text-blue-600",
    },
    {
      id: "corporate3",
      title: "Entity Formation",
      description: "Business entity setup and registration",
      category: "corporate",
      icon: Plus,
      color: "text-blue-600",
    },
  ],
  "Compliance & Regulatory": [
    {
      id: "compliance1",
      title: "Compliance Check",
      description: "Regulatory compliance verification",
      category: "compliance",
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      id: "compliance2",
      title: "Tax Filings",
      description: "Tax preparation and regulatory filings",
      category: "compliance",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      id: "compliance3",
      title: "Risk Assessment",
      description: "Legal risk evaluation and mitigation",
      category: "compliance",
      icon: BarChart,
      color: "text-green-600",
    },
  ],
  "Intellectual Property": [
    {
      id: "ip1",
      title: "Patent Filing",
      description: "Patent application and prosecution",
      category: "ip",
      icon: LightBulbIcon,
      color: "text-amber-600",
    },
    {
      id: "ip2",
      title: "Trademark Search",
      description: "Trademark clearance and registration",
      category: "ip",
      icon: Search,
      color: "text-amber-600",
    },
    {
      id: "ip3",
      title: "IP Portfolio",
      description: "Intellectual property management",
      category: "ip",
      icon: Crown,
      color: "text-amber-600",
    },
  ],
  "Research & Analysis": [
    {
      id: "research1",
      title: "Legal Research",
      description: "Case law and statute research",
      category: "research",
      icon: Sparkles,
      color: "text-indigo-600",
    },
    {
      id: "research2",
      title: "Document Drafting",
      description: "Legal document creation and templates",
      category: "drafting",
      icon: Pencil,
      color: "text-indigo-600",
    },
    {
      id: "research3",
      title: "Precedent Analysis",
      description: "Case precedent research and analysis",
      category: "research",
      icon: FileSearch,
      color: "text-indigo-600",
    },
  ],
}

// Flatten for backward compatibility
const workflowTemplates = Object.values(workflowCategories).flat()

export default function WorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false)
  const [showAllTemplates, setShowAllTemplates] = useState(false)

  // Pro access modal states
  const [showProModal, setShowProModal] = useState(false)
  const [isRequestingPro, setIsRequestingPro] = useState(false)

  // Get workflow status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Handle Pro access request
  const handleRequestProAccess = () => {
    setIsRequestingPro(true)

    // Simulate API call to request pro access
    setTimeout(() => {
      setIsRequestingPro(false)
      setShowProModal(false)
      window.open("https://calendly.com/wansomco/30min", "_blank")
    }, 2000)
  }
 const router = useRouter();
  const { data: session } = useSession();
  const { user: profile } = useProfile();
  const { createProject } = useProjectStore();
  const { createConversation } = useChatStore();
  const { notify } = useNotifications();

  const {
    associates,
    isLoading,
    error,
    fetchAssociates,
    deleteAssociate
  } = useAssociates();

  useEffect(() => {
    fetchAssociates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this associate?')) return;
    await deleteAssociate(id);
  };

  const handleEdit = (associate: AIAssociate) => {
    // TODO: Implement edit functionality
    alert('Edit functionality coming soon!');
  };

  const handleUseInChat = async (associate: AIAssociate) => {
    try {
      // Check if user is logged in
      if (!session?.user?.organization?.id) {
        notify.error("Please log in to use this feature");
        return;
      }

      // Show loading notification
      notify.info(`Creating workspace with ${associate.name}...`);

      // Generate a meaningful project name
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const dateStr = now.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
      const projectTitle = `${associate.name} - ${dateStr} ${timeStr}`;

      // Use active organization ID
      const organizationId = profile?.activeOrganizationId || profile?.organizationId || session?.user?.organization?.id;

      // Create new project/workspace
      const newProject = await createProject({
        title: projectTitle,
        description: `Workspace with AI Associate: ${associate.name}`,
        organizationId,
      });

      if (!newProject) {
        notify.error("Failed to create workspace");
        return;
      }

      // Create conversation with the associate linked
      const conversation = await createConversation(
        newProject.id,
        `Chat with ${associate.name}`,
        associate.id
      );

      if (!conversation) {
        notify.error("Failed to create conversation");
        return;
      }

      // Success notification
      notify.success(`Workspace created with ${associate.name}!`);

      // Navigate to the new workspace
      router.push(`/projects/${newProject.id}`);
    } catch (error: any) {
      console.error("Error creating workspace with associate:", error);
      notify.error(error.message || "Failed to create workspace");
    }
  };
  // Update the JSX to use filteredResults instead of filteredAssociates
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl"> 
          {/* "Header */}
      <div className="bg-gradient-to-r from-[#E9F5F3] to-amber-100  rounded-lg p-4 flex flex-col md:flex-row  items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 p-2 rounded-full hidden md:block">
            <Crown className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-medium">What are AI Associates?</h3>
            <p className="text-sm text-gray-600">
              AI Associates are specialized assistants that help with specific legal tasks. Try a premade associate to start, or create your own.
            </p>
          </div>
        </div>
     
      </div>  
      
      {/* Template Showcase */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Premade by Wansom</h2>
          {workflowTemplates.length > 3 && (
            <Button
              variant="link"
              onClick={() => setShowAllTemplates(!showAllTemplates)}
              className="text-primary hover:text-amber-600"
            >
              {showAllTemplates ? "Show less" : "Show more"}
              <ChevronRight className={`ml-1 h-4 w-4 transition-transform ${showAllTemplates ? 'rotate-90' : ''}`} />
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {workflowTemplates
            .slice(0, showAllTemplates ? workflowTemplates.length : 3)
            .map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-sm transition-all border-gray-200 hover:border-gray-300"
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-lg p-2 ${template.color.replace("text", "bg")}/10 flex-shrink-0`}>
                      <template.icon className={`h-5 w-5 ${template.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{template.title}</h3>
                      <p className="text-xs text-gray-500 truncate">{template.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-1 h-auto"
                      onClick={() => setShowProModal(true)}
                    >
                      New Chat <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    {/* My Associates Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              My Associates
              <span className="text-sm font-normal text-muted-foreground">
                ({associates.length})
              </span>
            </h2>
              <Button
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700" onClick={() => router.push('/workflows/new')}
         
        >
          <Plus className="mr-2 h-4 w-4" />
          New Associate
        </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : associates.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Scale className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No associates yet</h3>
                <p className="text-muted-foreground mb-4 text-center max-w-md">
                  Create your first AI associate to scale your legal team and automate workflows
                </p>
                <Button onClick={() => router.push('/workflows/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Associate
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {associates.map((associate) => (
                <Card key={associate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                          <span className="text-xl font-bold text-primary">
                            {associate.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {associate.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {associate.description || associate.instructions?.substring(0, 60) + '...'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUseInChat(associate)}
                          className="gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Use in chat
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(associate)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                         <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(associate.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      {/* Modals */}
      <ProAccessModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        onRequestAccess={handleRequestProAccess}
        isLoading={isRequestingPro}
      />
    </div>
  )
}
