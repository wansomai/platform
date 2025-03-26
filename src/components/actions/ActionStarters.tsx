// src/components/actions/ActionStarters.tsx
"use client"

import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/useNotifications";
import { FileText, FileQuestion, BookOpen } from "lucide-react"


// Action types
export type ActionType = 'generate-document' | 'research-question' | 'summarize-document';

// Action metadata
export interface ActionMeta {
  id: ActionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  promptTemplate: string;
}

// Available actions with prompt templates
export const AVAILABLE_ACTIONS: ActionMeta[] = [
  {
    id: 'generate-document',
    title: 'Generate Document',
    description: 'Create a legal document based on the conversation',
    icon: <FileText className="h-4 w-4 mr-2 text-primary-600" />,
    promptTemplate: "I would like you to generate me a legal document based on our conversation. Please ask me all the questions you need one at a time before you can generate the document."
  },
  {
    id: 'research-question',
    title: 'Research Question',
    description: 'Research a legal question using external sources',
    icon: <FileQuestion className="h-4 w-4 mr-2 text-primary-600" />,
    promptTemplate: "I need help researching a legal question. Please ask me what specific legal question or topic I want to research, and then provide a comprehensive analysis with relevant legal authorities and regulations."
  },
  {
    id: 'summarize-document',
    title: 'Summarize Document',
    description: 'Create a summary of uploaded documents',
    icon: <BookOpen className="h-4 w-4 mr-2 text-primary-600" />,
    promptTemplate: "I would like you to help me summarize the documents attached to this conversation."
  }
];

// Component to show action cards
export function ActionStarters({ onSelect }: { onSelect: (prompt: string, actionTitle: string) => void }) {
  const { notify } = useNotifications()

  const handleActionClick = (action: ActionMeta) => {
    // Send the prompt directly to the chat
    onSelect(action.promptTemplate, action.title);
    
    // Show a toast notification
    notify.info(`${action.title} started`)
  }

  return (
    <div className="space-y-4">
      {AVAILABLE_ACTIONS.map((action) => (
        <div 
          key={action.id}
          className="rounded-lg border p-3 hover:border-primary-300 hover:bg-primary-50 transition-colors"
        >
          <div className="flex items-center mb-1">
            {action.icon}
            <h4 className="font-medium text-sm">{action.title}</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{action.description}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => handleActionClick(action)}
          >
            Use Action
          </Button>
        </div>
      ))}
    </div>
  );
}