// src/components/actions/ActionHandler.tsx
"use client"

import React, { useState } from 'react'
import { useParams } from "next/navigation"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, FileQuestion, BookOpen } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUIStore } from "@/store/ui.store"
import { useChatStore } from "@/store/chat.store"

// Action types
export type ActionType = 'generate-document' | 'research-question' | 'summarize-document';

// Action metadata
export interface ActionMeta {
  id: ActionType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Available actions
export const AVAILABLE_ACTIONS: ActionMeta[] = [
  {
    id: 'generate-document',
    title: 'Generate Document',
    description: 'Create a legal document based on the conversation',
    icon: <FileText className="h-4 w-4 mr-2 text-primary-600" />
  },
  {
    id: 'research-question',
    title: 'Research Question',
    description: 'Research a legal question using external sources',
    icon: <FileQuestion className="h-4 w-4 mr-2 text-primary-600" />
  },
  {
    id: 'summarize-document',
    title: 'Summarize Document',
    description: 'Create a summary of uploaded documents',
    icon: <BookOpen className="h-4 w-4 mr-2 text-primary-600" />
  }
];

// Import action form components
import { DocumentGenerationForm } from './DocumentGenerationForm';
import { ResearchQuestionForm } from './ResearchQuestionForm';
import { DocumentSummaryForm } from './DocumentSummaryForm';

// Action forms mapping
const ActionForms: Record<ActionType, React.FC<{onSubmit: (data: any) => void, onCancel: () => void}>> = {
  'generate-document': DocumentGenerationForm,
  'research-question': ResearchQuestionForm,
  'summarize-document': DocumentSummaryForm
};

// Main action handler component
export function ActionHandler({ 
  open, 
  actionType, 
  onClose, 
  onSubmit 
}: { 
  open: boolean;
  actionType: ActionType;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {AVAILABLE_ACTIONS.find(a => a.id === actionType)?.icon}
            {AVAILABLE_ACTIONS.find(a => a.id === actionType)?.title}
          </DialogTitle>
          <DialogDescription>
            {AVAILABLE_ACTIONS.find(a => a.id === actionType)?.description}
          </DialogDescription>
        </DialogHeader>
        
        {React.createElement(ActionForms[actionType], { 
          onSubmit,
          onCancel: onClose
        })}
      </DialogContent>
    </Dialog>
  );
}

// Action result display component for the chat
export function ActionResult({ action, result }: { action: string, result: any }) {
  const actionMeta = AVAILABLE_ACTIONS.find(a => a.id === action);
  
  if (!actionMeta) return null;
  
  return (
    <div className="bg-secondary-50 rounded-lg p-4 my-2 border border-secondary-200">
      <div className="flex items-center mb-2">
        {actionMeta.icon}
        <h4 className="font-medium">{actionMeta.title} Result</h4>
      </div>
      <div className="text-sm">
        {/* Custom rendering based on action type */}
        {action === 'generate-document' && (
          <div>
            <p>Generated document available for download</p>
            <Button size="sm" variant="outline" className="mt-2">
              <FileText className="h-4 w-4 mr-2" />
              Download Document
            </Button>
          </div>
        )}
        {action === 'research-question' && (
          <div>
            <p>Research results summary</p>
            <div className="mt-2 text-xs bg-white p-2 rounded border">
              {result.summary}
            </div>
          </div>
        )}
        {action === 'summarize-document' && (
          <div>
            <p>Document summary</p>
            <div className="mt-2 text-xs bg-white p-2 rounded border">
              {result.summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component to trigger actions from the context panel
export function ActionSelector({ onSelect }: { onSelect: (action: ActionType) => void }) {
  return (
    <div className="space-y-4">
      {AVAILABLE_ACTIONS.map((action) => (
        <div 
          key={action.id}
          className="rounded-lg border p-3 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
          onClick={() => onSelect(action.id)}
        >
          <div className="flex items-center mb-1">
            {action.icon}
            <h4 className="font-medium text-sm">{action.title}</h4>
          </div>
          <p className="text-xs text-muted-foreground">{action.description}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(action.id);
            }}
          >
            Use Action
          </Button>
        </div>
      ))}
    </div>
  );
}