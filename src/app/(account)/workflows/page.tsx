// app/dashboard/workflows/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Zap,
  Plus,
  ChevronRight,
  Calendar,
  BarChart,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserPlus,
  FileText,
  ArrowRight,
  ArrowUpRight,
  Clipboard,
  Filter,
  Pencil,
  Crown,
  Snowflake
} from "lucide-react";
import ProAccessModal from "@/components/modals/ProAccess";
import { LightBulbIcon } from "@heroicons/react/24/outline";

// Workflow type definition
interface Workflow {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "active" | "completed" | "draft";
  progress: number;
  dueDate?: string;
  assignee?: string;
  createdAt: string;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  assignee?: string;
}

// Simulated workflow data - all set to draft or with low progress to indicate they need Pro access
const mockWorkflows: Workflow[] = [
  {
    id: "wf1",
    title: "Contract Review",
    description: "Standard contract review workflow with annotations and approval process",
    category: "contracts",
    status: "draft", // Changed to draft
    progress: 0, // Changed to 0 progress
    dueDate: "2025-03-25",
    assignee: "John Doe",
    createdAt: "2025-03-10",
    steps: [
      { id: "s1", title: "Initial document review", completed: false },
      { id: "s2", title: "Legal team annotations", completed: false },
      { id: "s3", title: "Client approval", completed: false },
      { id: "s4", title: "Final signatures", completed: false }
    ]
  },
  {
    id: "wf2",
    title: "Due Diligence",
    description: "M&A due diligence process with document collection and analysis",
    category: "corporate",
    status: "draft", // Changed to draft
    progress: 0, // Changed to 0 progress
    dueDate: "2025-04-15",
    assignee: "Sarah Johnson",
    createdAt: "2025-03-05",
    steps: [
      { id: "s1", title: "Document collection", completed: false },
      { id: "s2", title: "Document categorization", completed: false },
      { id: "s3", title: "Legal analysis", completed: false },
      { id: "s4", title: "Risk assessment", completed: false },
      { id: "s5", title: "Final report", completed: false }
    ]
  },
  {
    id: "wf3",
    title: "Compliance Check",
    description: "Regulatory compliance verification process",
    category: "compliance",
    status: "draft", // Changed to draft
    progress: 0, // Changed to 0 progress
    assignee: "Michael Brown",
    createdAt: "2025-02-20",
    steps: [
      { id: "s1", title: "Identify applicable regulations", completed: false },
      { id: "s2", title: "Document current practices", completed: false },
      { id: "s3", title: "Gap analysis", completed: false },
      { id: "s4", title: "Implementation plan", completed: false }
    ]
  },
  {
    id: "wf4",
    title: "Case Preparation",
    description: "Litigation case preparation workflow",
    category: "litigation",
    status: "draft",
    progress: 0,
    createdAt: "2025-03-15",
    steps: [
      { id: "s1", title: "Evidence collection", completed: false },
      { id: "s2", title: "Witness statements", completed: false },
      { id: "s3", title: "Legal research", completed: false },
      { id: "s4", title: "Document filing", completed: false }
    ]
  }
];

// Template workflow definitions
const workflowTemplates = [
  {
    id: "template1",
    title: "Contract Review",
    description: "Standard legal contract review and approval",
    category: "contracts",
    icon: FileText,
    color: "text-blue-600",
    steps: 4
  },
  {
    id: "template2",
    title: "Due Diligence",
    description: "Comprehensive due diligence for M&A",
    category: "corporate",
    icon: Clipboard,
    color: "text-purple-600",
    steps: 5
  },
  {
    id: "template3",
    title: "Compliance Check",
    description: "Regulatory compliance verification",
    category: "compliance",
    icon: CheckCircle2,
    color: "text-green-600",
    steps: 4
  },
  {
    id: "template4",
    title: "Case Preparation",
    description: "Litigation case preparation workflow",
    category: "litigation",
    icon: Snowflake,
    color: "text-purple-600",
    steps: 4
  },
  {
    id: "template5",
    title: "Tax Filings & Compliance",
    description: "Streamline tax preparation, automate regulatory filings",
    category: "compliance",
    icon: Calendar,
    color: "text-red-600",
    steps: 4
  },
  {
    id: "template6",
    title: "Intellectual Property Filings",
    description: "Simplify trademark searches, patent applications, and IP portfolio management with automated workflows",
    category: "ip",
    icon: LightBulbIcon,
    color: "text-amber-600",
    steps: 4
  },
  {
    id: "template7",
    title: "Legal Research",
    description: "Conduct comprehensive legal research across statutes, case law, and regulations with AI-powered analysis and relevant citation finding",
    category: "research",
    icon: Calendar,
    color: "text-green-600",
    steps: 4
  }
];

export default function WorkflowsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("active"); // Changed default to "draft"
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewWorkflowDialog, setShowNewWorkflowDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);
  const [newWorkflowTemplate, setNewWorkflowTemplate] = useState("");
  const [newWorkflowTitle, setNewWorkflowTitle] = useState("");
  const [newWorkflowAssignee, setNewWorkflowAssignee] = useState("");
  const [newWorkflowDueDate, setNewWorkflowDueDate] = useState("");
  
  // Pro access modal states
  const [showProModal, setShowProModal] = useState(false);
  const [isRequestingPro, setIsRequestingPro] = useState(false);
  
  // Filter workflows based on tab and search term
  const filteredWorkflows = mockWorkflows.filter((workflow) => {
    const matchesTab = 
      (activeTab === "active" && workflow.status === "active") ||
      (activeTab === "completed" && workflow.status === "completed") ||
      (activeTab === "draft" && workflow.status === "draft") ||
      (activeTab === "all");
    
    const matchesSearch = 
      workflow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });
  
  // Get workflow status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };
  
  // All handlers now show Pro modal
  const handleWorkflowClick = (workflow: Workflow) => {
    setShowProModal(true);
  };
  
  const handleStartWorkflow = () => {
    setShowProModal(true);
  };
  
  const handleCreateWorkflow = () => {
    setShowProModal(true);
    setShowNewWorkflowDialog(false);
  };
  
  // Handle Pro access request
  const handleRequestProAccess = () => {
    setIsRequestingPro(true);
    
    // Simulate API call to request pro access
    setTimeout(() => {
      setIsRequestingPro(false);
      setShowProModal(false);
      window.open('https://calendly.com/wansomco/30min', '_blank');
    }, 2000);
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-gray-500">Manage your legal processes with predefined workflows</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowProModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>
      
      {/* "Pro Feature" Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 p-2 rounded-full">
            <Crown className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-medium">Pro Feature</h3>
            <p className="text-sm text-gray-600">Workflows are available as part of our Pro plan</p>
          </div>
        </div>
        <Button 
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          onClick={() => setShowProModal(true)}
        >
          <Crown className="mr-2 h-4 w-4" />
          Upgrade to Pro
        </Button>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setShowProModal(true)}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </Button>
      </div>
      
      {/* Template Showcase */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Workflow Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {workflowTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`rounded-full p-3 ${template.color.replace('text', 'bg')}/10`}>
                    <template.icon className={`h-6 w-6 ${template.color}`} />
                  </div>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <h3 className="font-medium mt-4">{template.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                <p className="text-xs text-gray-400 mt-2">{template.steps} steps</p>
                <Button 
                  variant="ghost" 
                  className="w-full mt-4"
                  onClick={() => handleStartWorkflow()}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Start Workflow
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Workflow Tabs and List */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Workflows</h2>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              {/* <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger> */}
            </TabsList>
          </div>
          
          <TabsContent value={activeTab} className="mt-0">
            {filteredWorkflows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-gray-50">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <Zap className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No workflows found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? `No workflows match "${searchTerm}"` : "Start a new workflow to get organized"}
                </p>
                <Button onClick={() => setShowProModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Workflow
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWorkflows.map((workflow) => (
                  <Card
                    key={workflow.id}
                    className="hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleWorkflowClick(workflow)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{workflow.title}</h3>
                            {getStatusBadge(workflow.status)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
                          <div className="flex flex-wrap gap-4 mt-4">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              {workflow.dueDate ? formatDate(workflow.dueDate) : "No due date"}
                            </div>
                            {workflow.assignee && (
                              <div className="flex items-center text-xs text-gray-500">
                                <UserPlus className="h-3.5 w-3.5 mr-1" />
                                {workflow.assignee}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            Created {formatDate(workflow.createdAt)}
                          </div>
                          <div className="w-32">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{workflow.progress}% complete</span>
                              <span>{workflow.steps.filter(s => s.completed).length}/{workflow.steps.length} steps</span>
                            </div>
                            <Progress value={workflow.progress} className="h-2" />
                          </div>
                          <Button variant="ghost" size="sm" className="mt-2">
                            View Details
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Workflow Details Dialog - This will never be actually shown as all clicks show Pro modal */}
      <Dialog open={showWorkflowDetails} onOpenChange={setShowWorkflowDetails}>
        <DialogContent className="sm:max-w-[700px]">
          {selectedWorkflow && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedWorkflow.title}</DialogTitle>
                  {getStatusBadge(selectedWorkflow.status)}
                </div>
                <DialogDescription>
                  {selectedWorkflow.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex flex-wrap gap-4">
                  <div className="bg-gray-100 px-3 py-2 rounded-md text-sm flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    {selectedWorkflow.dueDate ? (
                      <>Due by {formatDate(selectedWorkflow.dueDate)}</>
                    ) : (
                      <>No due date</>
                    )}
                  </div>
                  
                  {selectedWorkflow.assignee && (
                    <div className="bg-gray-100 px-3 py-2 rounded-md text-sm flex items-center">
                      <UserPlus className="h-4 w-4 mr-2 text-gray-500" />
                      Assigned to {selectedWorkflow.assignee}
                    </div>
                  )}
                  
                  <div className="bg-gray-100 px-3 py-2 rounded-md text-sm flex items-center">
                    <BarChart className="h-4 w-4 mr-2 text-gray-500" />
                    Progress: {selectedWorkflow.progress}%
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Workflow Steps</h3>
                  <div className="space-y-3">
                    {selectedWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-start gap-3 p-3 rounded-md bg-gray-50">
                        <div className={`rounded-full p-1 ${step.completed ? 'bg-green-100' : 'bg-gray-200'}`}>
                          {step.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">
                              {index + 1}. {step.title}
                            </h4>
                            {step.dueDate && (
                              <span className="text-xs text-gray-500">
                                Due: {formatDate(step.dueDate)}
                              </span>
                            )}
                          </div>
                          {step.assignee && (
                            <p className="text-xs text-gray-500 mt-1">
                              Assigned to: {step.assignee}
                            </p>
                          )}
                        </div>
                        {!step.completed && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowProModal(true)}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWorkflowDetails(false)}>
                  Close
                </Button>
                <Button onClick={() => setShowProModal(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Workflow
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* New Workflow Dialog - this will open but trying to create will show Pro modal */}
      <Dialog open={showNewWorkflowDialog} onOpenChange={setShowNewWorkflowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Start a new legal workflow based on a template or create a custom one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template" className="text-right">
                Template
              </Label>
              <Select value={newWorkflowTemplate} onValueChange={setNewWorkflowTemplate}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a workflow template" />
                </SelectTrigger>
                <SelectContent>
                  {workflowTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Workflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={newWorkflowTitle}
                onChange={(e) => setNewWorkflowTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter workflow title"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignee" className="text-right">
                Assignee
              </Label>
              <Select value={newWorkflowAssignee} onValueChange={setNewWorkflowAssignee}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Assign to team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user1">John Doe</SelectItem>
                  <SelectItem value="user2">Sarah Johnson</SelectItem>
                  <SelectItem value="user3">Michael Brown</SelectItem>
                  <SelectItem value="current">Assign to me</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={newWorkflowDueDate}
                onChange={(e) => setNewWorkflowDueDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewWorkflowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkflow} 
              disabled={!newWorkflowTitle || !newWorkflowTemplate}
            >
              Create Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Pro Access Request Modal */}
      <ProAccessModal 
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        onRequestAccess={handleRequestProAccess}
        isLoading={isRequestingPro}
      />
    </div>
  );
}