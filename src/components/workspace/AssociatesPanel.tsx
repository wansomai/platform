// components/workspace/AssociatesPanel.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  GraduationCap,
  FileText,
  Scale,
  User,
  Plus,
  Settings
} from "lucide-react";
import ProAccessModal from "@/components/modals/ProAccess";

// Associate type icons mapping
const typeIcons = {
  research: GraduationCap,
  drafting: FileText,
  tax: Scale,
  general: User,
};

// Mock data - would come from API
const mockAssociates = [
  {
    id: "assoc1",
    name: "Legal Researcher",
    type: "research",
    isPro: true
  },
  {
    id: "assoc2",
    name: "General Assistant",
    type: "general",
    isPro: false
  }
];

interface AssociatesPanelProps {
  workspaceId: string;
  onSelectAssociate: (associateId: string) => void;
}

export function AssociatesPanel({ workspaceId, onSelectAssociate }: AssociatesPanelProps) {
  const [showProModal, setShowProModal] = useState(false);
  const [isRequestingPro, setIsRequestingPro] = useState(false);
  
  // Handle Pro access request
  const handleRequestProAccess = () => {
    setIsRequestingPro(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsRequestingPro(false);
      setShowProModal(false);
      window.open('https://calendly.com/wansomco/30min', '_blank');
    }, 2000);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium flex items-center">
          <MessageSquare className="h-4 w-4 mr-2" />
          AI Associates
        </h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
          <a href="/associates" target="_blank">
            <Settings className="h-4 w-4" />
          </a>
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {mockAssociates.map((associate) => {
            const TypeIcon = typeIcons[associate.type as keyof typeof typeIcons] || User;
            
            return (
              <Card 
                key={associate.id}
                className={`cursor-pointer hover:shadow-sm transition-all ${
                  associate.isPro ? "relative overflow-hidden" : ""
                }`}
                onClick={() => {
                  if (associate.isPro) {
                    setShowProModal(true);
                  } else {
                    onSelectAssociate(associate.id);
                  }
                }}
              >
                {associate.isPro && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-white text-xs py-1 px-3 rounded-bl-lg">
                    PRO
                  </div>
                )}
                <CardContent className="p-3 flex items-center">
                  <div className="bg-gray-100 p-2 rounded-full mr-3">
                  <TypeIcon className="h-4 w-4 text-gray-700" />
                 </div>
                 <div>
                   <h4 className="font-medium text-sm">{associate.name}</h4>
                   <p className="text-xs text-gray-500">{associate.type.charAt(0).toUpperCase() + associate.type.slice(1)} Specialist</p>
                 </div>
               </CardContent>
             </Card>
           );
         })}
         
         {/* Add new associate button */}
         <Button 
           variant="outline" 
           className="w-full flex items-center justify-center py-5 border-dashed"
           asChild
         >
           <a href="/associates" target="_blank">
             <Plus className="h-4 w-4 mr-2" />
             Add Associate
           </a>
         </Button>
       </div>
     </ScrollArea>
     
     {/* Pro Access Modal */}
     <ProAccessModal
       isOpen={showProModal}
       onClose={() => setShowProModal(false)}
       onRequestAccess={handleRequestProAccess}
       isLoading={isRequestingPro}
     />
   </div>
 );
}