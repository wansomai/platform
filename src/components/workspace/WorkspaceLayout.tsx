// components/workspace/WorkspaceLayout.tsx
'use client'
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ConversationDetails } from "@/components/workspace/ConversationDetails";
import { AssociatesPanel } from "@/components/workspace/AssociatesPanel";
import { AssociateChat } from "../associates/AssociateChat";

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("context");
  const [activeAssociate, setActiveAssociate] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);

  // Sample workspace ID
  const workspaceId = "sample-workspace-id";

  return (
    <div className="flex h-screen">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        {/* ... existing header code ... */}
        
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {activeAssociate ? (
            <AssociateChat 
              associate={activeAssociate}
              onBack={() => setActiveAssociate(null)}
            />
          ) : (
            <ChatInterface />
          )}
        </div>
      </div>

      {/* Right Sidebar - Context Panel */}
      <div className="w-80 border-l bg-white flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="context">Context</TabsTrigger>
            <TabsTrigger value="associates">Associates</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex-1 overflow-auto">
          {activeTab === "context" ? (
            <ConversationDetails />
          ) : (
            <AssociatesPanel 
              workspaceId={workspaceId}
              onSelectAssociate={(associateId) => {
                // In a real implementation, you would fetch the associate details
                // For now, using mock data
                setActiveAssociate({
                  id: associateId,
                  name: associateId === "assoc1" ? "Legal Researcher" : "General Assistant",
                  type: associateId === "assoc1" ? "research" : "general"
                });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}