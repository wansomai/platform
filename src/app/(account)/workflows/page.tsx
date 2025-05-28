// app/dashboard/workflows/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,

} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Search,
  Zap,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Clipboard,
  Crown,
  Snowflake,
  Sparkles,
  MessageSquare,
  Info,
  User,
  FileSearch,
  Globe,
  UserPlus,
  BarChart,
  Pencil,
} from "lucide-react";
import ProAccessModal from "@/components/modals/ProAccess";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import { CreateAssociateModal } from "@/components/associates/CreateAssociateModal";
import { useAssociatesStore } from "@/store/associates.store";

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

// Template workflow definitions
const workflowTemplates = [
  {
    id: "template1",
    title: "Contract Review",
    description: "Standard legal contract review and approval",
    category: "contracts",
    icon: FileText,
    color: "text-blue-600",
    steps: 4,
  },
  {
    id: "template11",
    title: "Document Drafting",
    description: "Draft and review legal documents with templates and clauses",
    category: "drafting",
    icon: FileText,
    color: "text-blue-600",
    steps: 4,
  },
  {
    id: "template2",
    title: "Due Diligence",
    description: "Comprehensive due diligence for M&A",
    category: "corporate",
    icon: Clipboard,
    color: "text-purple-600",
    steps: 5,
  },
  {
    id: "template3",
    title: "Compliance Check",
    description: "Regulatory compliance verification",
    category: "compliance",
    icon: CheckCircle2,
    color: "text-green-600",
    steps: 4,
  },
  {
    id: "template4",
    title: "Case Preparation",
    description: "Litigation case preparation workflow",
    category: "litigation",
    icon: Snowflake,
    color: "text-purple-600",
    steps: 4,
  },
  {
    id: "template5",
    title: "Tax Filings & Compliance",
    description: "Streamline tax preparation, automate regulatory filings",
    category: "compliance",
    icon: Calendar,
    color: "text-red-600",
    steps: 4,
  },
  {
    id: "template6",
    title: "Intellectual Property Filings",
    description:
      "Simplify trademark searches, patent applications, and IP portfolio management with automated workflows",
    category: "ip",
    icon: LightBulbIcon,
    color: "text-amber-600",
    steps: 4,
  },
  {
    id: "template7",
    title: "Legal Research",
    description:
      "Conduct comprehensive legal research across statutes, case law, and regulations with AI-powered analysis and relevant citation finding",
    category: "research",
    icon: Sparkles,
    color: "text-green-600",
    steps: 4,
  },
];

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState("active"); // Changed default to "draft"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null
  );
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Pro access modal states
  const [showProModal, setShowProModal] = useState(false);
  const [isRequestingPro, setIsRequestingPro] = useState(false);

  // Get workflow status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Completed
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Draft
          </Badge>
        );
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
      year: "numeric",
    });
  };

  // Handle Pro access request
  const handleRequestProAccess = () => {
    setIsRequestingPro(true);

    // Simulate API call to request pro access
    setTimeout(() => {
      setIsRequestingPro(false);
      setShowProModal(false);
      window.open("https://calendly.com/wansomco/30min", "_blank");
    }, 2000);
  };

  const { associates, fetchAllAssociates, isLoading } = useAssociatesStore();

  // In a useEffect
  useEffect(() => {
    fetchAllAssociates();
  }, [fetchAllAssociates, showCreateModal]); // Add showCreateModal as dependency

  const [filteredResults, setFilteredResults] = useState<any[]>([]);

  // Move filtering logic into useEffect
  useEffect(() => {
    const filtered = associates.filter((associate) => {
      const matchesSearch =
        associate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        associate.instructions.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
    setFilteredResults(filtered);
  }, [associates, searchTerm]); // Add dependencies

  // Update the JSX to use filteredResults instead of filteredAssociates
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* "Header */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 flex flex-col md:flex-row  items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 p-2 rounded-full hidden md:block">
            <Crown className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-medium">What are AI Associates?</h3>
            <p className="text-sm text-gray-600">
              AI Associates are specialized assistants that help with specific
              legal tasks. They can be configured with custom instructions and
              tools to assist with research, drafting, analysis, and more.
            </p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Associate
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search Associates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Template Showcase */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Associate Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {workflowTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div
                    className={`rounded-full p-3 ${template.color.replace(
                      "text",
                      "bg"
                    )}/10`}
                  >
                    <template.icon className={`h-6 w-6 ${template.color}`} />
                  </div>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <h3 className="font-medium mt-4">{template.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {template.description}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {template.steps} steps
                </p>
                <Button
                  variant="ghost"
                  className="w-full mt-4"
                  onClick={() => setShowProModal(true)}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Use in workspace
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
            <h2 className="text-xl font-semibold">Your Associates</h2>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-gray-50">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <Zap className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No Associates found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? `No Associates match "${searchTerm}"`
                    : "Create a new Associates to get more done."}
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Associate
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResults.map((associate) => (
                  <Card
                    key={associate.id}
                    className="overflow-hidden border-gray-200 hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* Rest of the card content remains the same */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <Sparkles className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{associate.name}</h3>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {associate.tools?.includes("documentSearch") && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-white"
                              >
                                <FileSearch className="h-3 w-3 mr-1" />
                                Docs
                              </Badge>
                            )}
                            {associate.tools?.includes("webSearch") && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-white"
                              >
                                <Globe className="h-3 w-3 mr-1" />
                                Web
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {associate.instructions.substring(0, 350)}...
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                  {associate.steps.length} steps
                </p>
                        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            Created{" "}
                            {new Date(associate.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <User className="h-3.5 w-3.5 mr-1" />
                            {associate.createdBy || "Unknown"}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="flex border-t mt-auto">
                        {/* <Button
                          variant="ghost"
                          className="flex-1 rounded-none py-2 h-auto text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowWorkflowDetails(true);
                          }}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          Details
                        </Button> */}

                        <div className="w-px bg-gray-200"></div>

                        <Button
                          variant="ghost"
                          className="flex-1 rounded-none py-2 h-auto text-gray-600 hover:text-green-600 hover:bg-green-50"
                          onClick={() => {
                            setShowProModal(true)
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Use in Chat
                        </Button>
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
                      <div
                        key={step.id}
                        className="flex items-start gap-3 p-3 rounded-md bg-gray-50"
                      >
                        <div
                          className={`rounded-full p-1 ${
                            step.completed ? "bg-green-100" : "bg-gray-200"
                          }`}
                        >
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
                <Button
                  variant="outline"
                  onClick={() => setShowWorkflowDetails(false)}
                >
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

      {/* Modals */}
      <CreateAssociateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreatePro={() => {
          setShowCreateModal(false);
          setShowProModal(true);
        }}
      />
      <ProAccessModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        onRequestAccess={handleRequestProAccess}
        isLoading={isRequestingPro}
      />
    </div>
  );
}
