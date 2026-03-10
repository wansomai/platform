// src/components/chat/CanvasStreamingOverlay.tsx
import React from 'react';
import { Loader2, FileText, Sparkles, Save, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import LogoAnimation from '../commons/LogoAnimation';

interface CanvasStreamingOverlayProps {
  status: string;
  message?: string;
  actionType?: string;
  show: boolean;
}

export const CanvasStreamingOverlay: React.FC<CanvasStreamingOverlayProps> = ({ 
  status, 
  message, 
  actionType,
  show 
}) => {
  if (!show) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'analyzing_request':
        return {
          icon: Settings,
          title: 'Analyzing Request',
          description: message || 'Understanding your requirements...',
          color: 'blue'
        };
      case 'processing_context':
        return {
          icon: FileText,
          title: 'Processing Context',
          description: message || 'Reviewing project documents and instructions...',
          color: 'blue'
        };
      case 'generating_document':
        return {
          icon: Sparkles,
          title: 'Generating Document',
          description: message || 'Creating your legal document...',
          color: 'purple'
        };
      case 'editing_document':
        return {
          icon: Sparkles,
          title: 'Editing Document',
          description: message || 'Applying your changes to the document...',
          color: 'purple'
        };
        
      case 'saving_document':
        return {
          icon: Save,
          title: 'Saving Changes',
          description: message || 'Saving updates to your canvas...',
          color: 'green'
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          title: 'Complete!',
          description: message || `Document ${actionType === 'generating' ? 'generated' : 'updated'} successfully!`,
          color: 'green',
          isComplete: true
        };
      case 'error':
        return {
          icon: AlertCircle,
          title: 'Error',
          description: message || 'Failed to process document',
          color: 'red',
          isError: true
        };
      default:
        return {
          icon: Loader2,
          title: 'Processing',
          description: message || 'Working on your document...',
          color: 'blue'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const getColorClasses = (color: string, isComplete?: boolean, isError?: boolean) => {
    if (isError) {
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-200',
        text: 'text-red-900',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600',
        accent: 'bg-red-500'
      };
    }
    
    if (isComplete) {
      return {
        bg: 'bg-green-500/10',
        border: 'border-green-200',
        text: 'text-green-900',
        iconBg: 'bg-green-100',
        iconText: 'text-green-600',
        accent: 'bg-green-500'
      };
    }

    switch (color) {
      case 'purple':
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-200',
          text: 'text-purple-900',
          iconBg: 'bg-purple-100',
          iconText: 'text-purple-600',
          accent: 'bg-purple-500'
        };
      case 'green':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-200',
          text: 'text-green-900',
          iconBg: 'bg-green-100',
          iconText: 'text-green-600',
          accent: 'bg-green-500'
        };
      default:
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-200',
          text: 'text-green-900',
          iconBg: 'bg-green-100',
          iconText: 'text-green-600',
          accent: 'bg-green-500'
        };
    }
  };

  const colors = getColorClasses(config.color, config.isComplete, config.isError);

  return (
    <div className={`absolute inset-0 ${colors.bg} backdrop-blur-sm z-10 flex items-center justify-center`}>
      <div className={`${colors.bg} border ${colors.border} rounded-xl p-8 max-w-sm mx-4 shadow-lg backdrop-blur-md`}>
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Main icon with animation */}
          <div className={`relative ${colors.iconBg} rounded-full p-4`}>
            {config.isComplete ? (
              <Icon className={`h-8 w-8 ${colors.iconText}`} />
            ) : config.isError ? (
              <Icon className={`h-8 w-8 ${colors.iconText}`} />
            ) : (
              <>
                <Icon className={`h-8 w-8 ${colors.iconText} ${Icon === Loader2 ? 'animate-spin' : ''}`} />
                {Icon !== Loader2 && (
                  <div className={`absolute -top-1 -right-1`}>
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status text */}
          <div className="space-y-2">
            <h3 className={`text-lg font-semibold ${colors.text}`}>
              {config.title}
            </h3>
            <p className={`text-sm ${colors.text} opacity-75`}>
              {config.description}
            </p>
          </div>

          {/* Progress indicator */}
          {!config.isComplete && !config.isError && (
            <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${colors.accent} rounded-full animate-pulse`} 
                   style={{ width: '60%' }}></div>
            </div>
          )}

          {/* AI branding */}
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-200/50">
            <LogoAnimation size='sm'  className={colors.iconText} />
            <span className={`text-xs ${colors.text} opacity-50`}>
              Wansom AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};