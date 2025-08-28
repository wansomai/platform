// src/components/chat/CanvasProcessingStatus.tsx
import React from 'react';
import { CheckCircle2, Circle, Loader2, FileText, Settings, Save, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import LogoAnimation from '../commons/LogoAnimation';

interface CanvasProcessingStatusProps {
  status: string;
  message?: string;
}

export const CanvasProcessingStatus: React.FC<CanvasProcessingStatusProps> = ({ status, message }) => {
  const steps = [
    { 
      key: 'analyzing_request', 
      label: 'Analyzing request', 
      icon: Settings,
      description: 'Understanding your requirements...'
    },
    { 
      key: 'processing_context', 
      label: 'Processing context', 
      icon: FileText,
      description: 'Reviewing project documents...'
    },
    { 
      key: 'generating_document', 
      label: 'Generating document', 
      icon: Sparkles,
      description: 'Creating new legal document...'
    },
    { 
      key: 'editing_document', 
      label: 'Updating document', 
      icon: Sparkles,
      description: 'Applying your changes...'
    },
    { 
      key: 'saving_document', 
      label: 'Saving changes', 
      icon: Save,
      description: 'Updating canvas...'
    },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === status);
  const currentStep = steps.find(step => step.key === status);

  // Calculate progress percentage
  const progressPercentage = currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  if (status === 'completed') {
    return (
      <div className="flex items-center space-x-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-700">
          {message || 'Document updated successfully!'}
        </span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center space-x-2">
        <Circle className="h-4 w-4 text-red-600" />
        <span className="text-sm font-medium text-red-700">
          {message || 'Failed to process document'}
        </span>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-center space-x-3 mb-3">
        <LogoAnimation size="sm" className="text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground">
              Working on your document
            </span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          {currentStep && (
            <p className="text-xs text-muted-foreground mt-1">
              {message || currentStep.description}
            </p>
          )}
        </div>
      </div>
      
      {/* shadcn Progress Bar */}
      <div className="space-y-2">
        <Progress 
          value={progressPercentage} 
          className="h-2 bg-muted"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {Math.max(currentStepIndex + 1, 1)} of {steps.length}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
      </div>
    </div>
  );
};