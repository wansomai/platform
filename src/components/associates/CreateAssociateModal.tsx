// components/associates/CreateAssociateModal.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileSearch,
  Search,
  Sparkles,
  Plus,
  X,
  HelpCircle,
  Info
} from "lucide-react";

// Available tools definition
const AVAILABLE_TOOLS = [
  {
    id: "documentSearch",
    name: "Document Search",
    description: "Search through workspace documents",
    icon: FileSearch,
    isPro: false
  },
  {
    id: "webSearch",
    name: "Web Search",
    description: "Search the internet for information",
    icon: Search,
    isPro: false
  }
];

interface CreateAssociateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePro: () => void;
}

export function CreateAssociateModal({ isOpen, onClose, onCreatePro }: CreateAssociateModalProps) {
  // Form state
  const [associate, setAssociate] = useState({
    name: "",
    instructions: "",
    tools: ["documentSearch", "webSearch"], // Default tools
    steps: [
      { id: "step1", description: "Identify key issues from the query" },
      { id: "step2", description: "Research and analyze relevant information" },
      { id: "step3", description: "Provide structured findings with recommendations" }
    ] as Array<{ id: string; description: string }>
  });
  
  // Reset form when modal is opened/closed
  React.useEffect(() => {
    if (!isOpen) {
      setAssociate({
        name: "",
        instructions: "",
        tools: ["documentSearch", "webSearch"],
        steps: [
          { id: "step1", description: "Identify key issues from the query" },
          { id: "step2", description: "Research and analyze relevant information" },
          { id: "step3", description: "Provide structured findings with recommendations" }
        ]
      });
    }
  }, [isOpen]);
  
  // Tool selection handling
  const toggleTool = (toolId: string) => {
    if (associate.tools.includes(toolId)) {
      setAssociate({
        ...associate,
        tools: associate.tools.filter(t => t !== toolId)
      });
    } else {
      setAssociate({
        ...associate,
        tools: [...associate.tools, toolId]
      });
    }
  };
  
  // Steps management
  const addStep = () => {
    const newStepId = `step${associate.steps.length + 1}`;
    setAssociate({
      ...associate,
      steps: [...associate.steps, { id: newStepId, description: "" }]
    });
  };
  
  const updateStep = (stepId: string, description: string) => {
    setAssociate({
      ...associate,
      steps: associate.steps.map(step => 
        step.id === stepId ? { ...step, description } : step
      )
    });
  };
  
  const removeStep = (stepId: string) => {
    setAssociate({
      ...associate,
      steps: associate.steps.filter(step => step.id !== stepId)
    });
  };
  
  // Validation
  const isFormValid = associate.name.trim() !== "" && 
                      associate.instructions.trim() !== "" &&
                      associate.tools.length > 0 &&
                      associate.steps.every(step => step.description.trim() !== "");
  
  // Handle create
  const handleCreateAssociate = () => {
    if (!isFormValid) return;
    
    // Here would be the API call to create the associate
    console.log("Creating associate:", associate);
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Create AI Associate
          </DialogTitle>
          <DialogDescription>
            Configure a specialized AI assistant to help with specific legal tasks
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6 flex-1 overflow-y-auto">
          {/* Associate Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Associate Name
            </Label>
            <Input
              id="name"
              value={associate.name}
              onChange={(e) => setAssociate({...associate, name: e.target.value})}
              placeholder="e.g., Contract Reviewer, Legal Researcher"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose a descriptive name that indicates the associate's specialization
            </p>
          </div>
          
          {/* Specialized Instructions */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="instructions" className="text-sm font-medium">
                Specialized Instructions
              </Label>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 text-xs"
                asChild
              >
                <a href="#" target="_blank">
                  <HelpCircle className="h-3 w-3 mr-1" />
                  Writing Tips
                </a>
              </Button>
            </div>
            <Textarea
              id="instructions"
              value={associate.instructions}
              onChange={(e) => setAssociate({...associate, instructions: e.target.value})}
              placeholder="Detailed instructions on how the associate should approach tasks, what to focus on, and any specialized knowledge to apply..."
              className="mt-1 min-h-[150px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Be specific about methodology, priorities, output format, and any specialized knowledge the associate should apply.
            </p>
          </div>
          
          {/* Task Execution Steps */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Task Execution Steps
              </Label>
              <Button 
                variant="outline"
                size="sm"
                onClick={addStep}
                className="h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Step
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1 mb-3">
              Define a sequence of steps the associate will follow when processing requests
            </p>
            
            <div className="space-y-3">
              {associate.steps.map((step, index) => (
                <div key={step.id} className="flex gap-2 items-start">
                  <div className="bg-primary/10 text-primary font-medium rounded-full h-6 w-6 flex items-center justify-center text-sm flex-shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <Input
                      value={step.description}
                      onChange={(e) => updateStep(step.id, e.target.value)}
                      placeholder={`Step ${index + 1} description...`}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                    onClick={() => removeStep(step.id)}
                    disabled={associate.steps.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Tools Access */}
          <div>
            <Label className="text-sm font-medium">
              Tools Access
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {AVAILABLE_TOOLS.map((tool) => (
                <div 
                  key={tool.id}
                  className={`flex p-3 rounded-lg border transition-all ${
                    associate.tools.includes(tool.id) 
                      ? "border-primary bg-primary/5" 
                      : "border-gray-200"
                  }`}
                >
                  <Checkbox 
                    id={`tool-${tool.id}`}
                    checked={associate.tools.includes(tool.id)}
                    onCheckedChange={() => toggleTool(tool.id)}
                    className="mr-3 mt-1"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={`tool-${tool.id}`}
                      className="font-medium text-sm flex items-center cursor-pointer"
                    >
                      <tool.icon className="h-4 w-4 mr-2 text-gray-700" />
                      {tool.name}
                    </Label>
                    <p className="text-xs text-gray-500">{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Guidance box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800 text-sm">Creating Effective Associates</h4>
                <p className="text-xs text-blue-700 mt-1">
                  The most effective AI associates have clear, specific instructions and well-defined steps.
                  Focus on a single specialty rather than trying to create a general-purpose assistant.
                  For example, a "Contract Analyzer" will perform better than a vague "Legal Helper."
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAssociate}
              disabled={!isFormValid}
            >
              Create Associate
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}