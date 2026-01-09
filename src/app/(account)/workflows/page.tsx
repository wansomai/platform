// app/dashboard/workflows/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Plus,
  CheckCircle2,
  FileText,
  Clipboard,
  Crown,
  User,
  ChevronRight,
  Loader2,
  Scale,
  MessageSquare,
  Trash2,
  Zap,
} from "lucide-react";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import { AIAssociate, PracticeArea } from "@/types";
import { useAssociates } from "@/hooks/useAssociates";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/project.store";
import { useChatStore } from "@/store/chat.store";
import { useProfile } from "@/store/profile.store";
import { useSession } from "next-auth/react";
import { useNotifications } from "@/hooks/useNotifications";
import { DeleteConfirmationDialog } from "@/components/modals/ConfirmationDialog";
import LogoAnimation from "@/components/commons/LogoAnimation";


interface WorkflowStep {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  assignee?: string;
}

// Premade AI Associate Templates - Ready to use legal AI assistants
const premadeAssociates = [
  {
    id: "contract-review",
    name: "Contract Review Specialist",
    description:
      "Expert at reviewing, analyzing, and drafting commercial contracts",
    instructions: `You are a Contract Review Specialist AI with expertise in commercial contracts, NDAs, service agreements, and terms of service. Your role is to:

1. Carefully review contracts for key terms, obligations, and potential risks
2. Identify unfavorable clauses, ambiguous language, and missing provisions
3. Suggest specific improvements and redlines with clear explanations
4. Flag critical issues like unlimited liability, unfavorable termination clauses, or missing indemnification
5. Ensure contracts align with industry best practices and client interests

Always be thorough, precise, and explain your reasoning in business-friendly language.`,
    practiceAreas: [PracticeArea.CONTRACTS_COMMERCIAL],
    icon: FileText,
    color: "text-blue-600",
  },
  {
    id: "compliance-advisor",
    name: "Compliance & Regulatory Advisor",
    description:
      "Helps navigate regulatory requirements and compliance obligations",
    instructions: `You are a Compliance & Regulatory Advisor AI specializing in corporate compliance, data privacy (GDPR, CCPA), and regulatory frameworks. Your role is to:

1. Identify applicable regulatory requirements for specific business activities
2. Assess compliance gaps and recommend remediation steps
3. Help draft privacy policies, terms of service, and compliance documentation
4. Provide guidance on data protection, consent management, and security requirements
5. Explain complex regulations in clear, actionable terms

Focus on practical, implementable compliance strategies that balance legal requirements with business operations.`,
    practiceAreas: [
      PracticeArea.COMPLIANCE_REGULATORY,
      PracticeArea.PRIVACY_DATA_PROTECTION,
    ],
    icon: CheckCircle2,
    color: "text-green-600",
  },
  {
    id: "litigation-assistant",
    name: "Litigation Research Assistant",
    description:
      "Conducts legal research, analyzes case law, and prepares litigation materials",
    instructions: `You are a Litigation Research Assistant AI with expertise in case law analysis, legal research, and litigation strategy. Your role is to:

1. Research relevant case law, statutes, and legal precedents
2. Analyze fact patterns and identify applicable legal principles
3. Draft case summaries, legal memoranda, and research reports
4. Identify strengths and weaknesses in legal arguments
5. Suggest litigation strategies based on precedent and legal analysis

Provide thorough, well-cited analysis with proper legal reasoning and attention to jurisdictional differences.`,
    practiceAreas: [PracticeArea.LITIGATION_DISPUTE_RESOLUTION],
    icon: Scale,
    color: "text-purple-600",
  },
  {
    id: "ip-specialist",
    name: "IP & Trademark Specialist",
    description:
      "Assists with trademark searches, IP protection, and licensing matters",
    instructions: `You are an Intellectual Property Specialist AI focusing on trademarks, copyrights, and licensing. Your role is to:

1. Guide trademark clearance searches and registration strategy
2. Analyze trademark conflicts and likelihood of confusion
3. Draft and review IP licensing agreements and assignments
4. Provide guidance on copyright protection and fair use
5. Help develop IP protection strategies for brands and creative works

Combine technical IP knowledge with practical business considerations to provide actionable IP guidance.`,
    practiceAreas: [
      PracticeArea.INTELLECTUAL_PROPERTY,
      PracticeArea.TECHNOLOGY_LICENSING,
    ],
    icon: LightBulbIcon,
    color: "text-amber-600",
  },
  {
    id: "ma-advisor",
    name: "M&A Due Diligence Advisor",
    description:
      "Assists with mergers, acquisitions, and due diligence processes",
    instructions: `You are an M&A Due Diligence Advisor AI specializing in mergers, acquisitions, and corporate transactions. Your role is to:

1. Guide due diligence checklists and document review processes
2. Identify key legal and business risks in target companies
3. Analyze corporate structure, contracts, and liabilities
4. Review material agreements, employment matters, and IP holdings
5. Help prepare due diligence reports and transaction summaries

Focus on practical risk identification and clear communication of findings to facilitate informed transaction decisions.`,
    practiceAreas: [
      PracticeArea.MERGERS_AND_ACQUISITIONS,
      PracticeArea.CORPORATE_GOVERNANCE,
    ],
    icon: Clipboard,
    color: "text-indigo-600",
  },
  {
    id: "employment-advisor",
    name: "Employment & HR Legal Advisor",
    description:
      "Provides guidance on employment law, policies, and workplace compliance",
    instructions: `You are an Employment & HR Legal Advisor AI with expertise in employment law, workplace policies, and labor compliance. Your role is to:

1. Draft and review employment agreements, offer letters, and separation agreements
2. Provide guidance on employee handbooks, workplace policies, and HR procedures
3. Advise on employment law compliance (wage and hour, discrimination, FMLA, etc.)
4. Help navigate employee relations issues and termination processes
5. Explain employment law risks and recommend compliant approaches

Balance legal compliance with practical HR considerations and business needs.`,
    practiceAreas: [PracticeArea.EMPLOYMENT_LABOR],
    icon: User,
    color: "text-teal-600",
  },
];

export default function WorkflowsPage() {
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [associateToDelete, setAssociateToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);

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
    deleteAssociate,
    createAssociate,
    isProcessing,
  } = useAssociates();

  useEffect(() => {
    fetchAssociates();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!associateToDelete) return;
    await deleteAssociate(associateToDelete.id);
    setAssociateToDelete(null);
  };

  const handleEdit = (associate: AIAssociate) => {
    // TODO: Implement edit functionality
    alert("Edit functionality coming soon!");
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
      const organizationId =
        profile?.activeOrganizationId ||
        profile?.organizationId ||
        session?.user?.organization?.id;

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

  // Handle premade associate selection - creates the associate for the user
  const handlePremadeAssociate = async (
    template: (typeof premadeAssociates)[0]
  ) => {
    // Prevent multiple clicks
    if (creatingTemplateId) return;

    try {
      setCreatingTemplateId(template.id);

      // Create the associate from the template
      const newAssociate = await createAssociate({
        name: template.name,
        description: template.description,
        instructions: template.instructions,
        practiceAreas: template.practiceAreas,
      });

      if (!newAssociate) {
        notify.error("Failed to create associate");
        return;
      }

      // Success - associate is now in their collection
      notify.success(`${template.name} added! Click "Use in chat" to start.`);
    } catch (error: any) {
      console.error("Error creating associate from template:", error);
      notify.error(error.message || "Failed to create associate");
    } finally {
      setCreatingTemplateId(null);
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
              AI Associates are specialized assistants that help with specific
              legal tasks. Try a premade associate to start, or create your own.
            </p>
          </div>
        </div>
      </div>

      {/* Template Showcase */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Premade by Wansom</h2>
          {premadeAssociates.length > 3 && (
            <Button
              variant="link"
              onClick={() => setShowAllTemplates(!showAllTemplates)}
              className="text-primary hover:text-amber-600"
            >
              {showAllTemplates ? "Show less" : "Show more"}
              <ChevronRight
                className={`ml-1 h-4 w-4 transition-transform ${
                  showAllTemplates ? "rotate-90" : ""
                }`}
              />
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {premadeAssociates
            .slice(0, showAllTemplates ? premadeAssociates.length : 3)
            .map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-sm transition-all border-gray-200 hover:border-gray-300 cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <div
                      className={`rounded-lg p-2 ${template.color.replace(
                        "text",
                        "bg"
                      )}/10 flex-shrink-0`}
                    >
                      <template.icon className={`h-5 w-5 ${template.color}`} />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-1 h-auto"
                      onClick={() => handlePremadeAssociate(template)}
                      disabled={!!creatingTemplateId || isProcessing}
                    >
                      {creatingTemplateId === template.id ? (
                        <>
                          <LogoAnimation/>
                          
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 mr-1" />
                          Use Template
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{template.name}</h3>
                      <p className="text-xs text-gray-500 truncate">
                        {template.description}
                      </p>
                    </div>
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
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            onClick={() => router.push("/workflows/new")}
            disabled={isProcessing || !!creatingTemplateId}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Associate
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
          <LogoAnimation/>
          </div>
        ) : associates.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No associates yet</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Create your first AI associate to scale your legal team and
                automate workflows
              </p>
              <Button
                onClick={() => router.push("/workflows/new")}
                disabled={isProcessing || !!creatingTemplateId}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Associate
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {associates.map((associate) => (
              <Card
                key={associate.id}
                className="hover:shadow-md transition-shadow"
              >
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
                        {associate.description ||
                          associate.instructions?.substring(0, 60) + "..."}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUseInChat(associate)}
                        className="gap-2"
                        disabled={isProcessing || !!creatingTemplateId}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Use in chat
                      </Button>
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(associate)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button> */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setAssociateToDelete({
                            id: associate.id,
                            name: associate.name,
                          })
                        }
                        disabled={isProcessing || !!creatingTemplateId}
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!associateToDelete}
        onOpenChange={(open) => !open && setAssociateToDelete(null)}
        onConfirm={handleDeleteConfirm}
        itemName={associateToDelete?.name}
        itemType="associate"
        isLoading={isProcessing}
      />
    </div>
  );
}
