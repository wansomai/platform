// src/components/chat/ProcessingStatus.tsx
import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import LogoAnimation from '../commons/LogoAnimation';

interface ProcessingStatusProps {
  status: string;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ status }) => {
  const steps = [
    { key: 'started', label: 'Securing your workspace...', icon: Circle },
    { key: 'processing_documents', label: 'Searching through documents', icon: Circle },
    { key: 'searching_web', label: 'Searching the web', icon: Circle },
    { key: 'generating_response', label: 'Generating response', icon: Circle },
    { key: 'saving_response', label: 'Saving response', icon: Circle },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === status);

  return (
    <div className="flex items-center space-x-2">
      <LogoAnimation size="sm" className="text-primary-600" />
      <div className="flex items-center space-x-1">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const Icon = isCompleted ? CheckCircle2 : step.icon;
          
          return (
            <div key={step.key} className="flex items-center">
              {index > 0 && (
                <div className={`w-2 h-px mx-1 ${
                  isCompleted ? 'bg-primary' : 'bg-gray-300'
                }`} />
              )}
              <div className="relative">
                {isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                ) : (
                  <Icon className={`h-4 w-4 ${
                    isCompleted ? 'text-green-500' : 'text-gray-300'
                  }`} />
                )}
                {isActive && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs text-gray-600">{step.label}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};