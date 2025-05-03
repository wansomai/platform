// components/associates/AssociateCard.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { 
  MessageSquare, 
  GraduationCap,
  FileText,
  Scale,
  User,
  Clock,
  Crown,
  Lock
} from "lucide-react";

// Associate type icons mapping
const typeIcons = {
  research: GraduationCap,
  drafting: FileText,
  tax: Scale,
  general: User,
};

// Associate type colors mapping
const typeColors = {
  research: "bg-blue-100 text-blue-700",
  drafting: "bg-emerald-100 text-emerald-700",
  tax: "bg-amber-100 text-amber-700",
  general: "bg-gray-100 text-gray-700",
};

interface AssociateCardProps {
  associate: {
    id: string;
    name: string;
    type: string;
    description: string;
    tools: string[];
    status: string;
    isPro: boolean;
  };
  onUseInWorkspace: () => void;
}

export function AssociateCard({ associate, onUseInWorkspace }: AssociateCardProps) {
  const TypeIcon = typeIcons[associate.type as keyof typeof typeIcons] || User;
  const typeColor = typeColors[associate.type as keyof typeof typeColors] || "bg-gray-100 text-gray-700";
  
  // Tool name formatting
  const getToolName = (toolId: string) => {
    const toolNames: Record<string, string> = {
      "documentSearch": "Document Search",
      "webSearch": "Web Search",
      "lawReference": "Law Reference",
      "documentTemplates": "Templates",
      "clauseLibrary": "Clause Library"
    };
    
    return toolNames[toolId] || toolId;
  };
  
  return (
    <Card className="overflow-hidden border hover:shadow-md transition-all">
      <CardHeader className={`${typeColor.replace('text', 'bg').replace('bg', 'bg-opacity-20')} pb-4`}>
        <div className="flex justify-between items-start">
          <div className={`p-3 rounded-full ${typeColor}`}>
            <TypeIcon className="h-5 w-5" />
          </div>
          <div className="flex space-x-2">
            {associate.isPro && (
              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            )}
            <Badge variant="outline" className={associate.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}>
              {associate.status === "active" ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                  Active
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1.5" />
                  Idle
                </>
              )}
            </Badge>
          </div>
        </div>
        <h3 className="text-lg font-medium mt-4">{associate.name}</h3>
        <p className="text-sm text-gray-500">{associate.type.charAt(0).toUpperCase() + associate.type.slice(1)} Specialist</p>
      </CardHeader>
      
      <CardContent className="py-4">
        <p className="text-sm text-gray-700 mb-4">{associate.description}</p>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Tools</h4>
          <div className="flex flex-wrap gap-1">
            {associate.tools.map((tool) => (
              <Badge key={tool} variant="outline" className="bg-gray-50">
                {getToolName(tool)}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t bg-gray-50 py-3">
        <Button 
          onClick={onUseInWorkspace}
          className="w-full"
          variant={associate.isPro ? "default" : "outline"}
        >
          {associate.isPro ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Upgrade to Use
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Use in Workspace
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}