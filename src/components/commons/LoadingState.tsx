// components/commons/LoadingStates LoadingStates.tsx
import React from 'react';
import { Loader2, FileText, MessageSquare, Users, Briefcase } from 'lucide-react';
import LogoAnimation from '@/components/commons/LogoAnimation';
import { Button } from '@/components/ui/button';

// Base loading component
interface BaseLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Workspace/Page loading for major loading states
interface WorkspaceLoadingProps extends BaseLoadingProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

export const WorkspaceLoading: React.FC<WorkspaceLoadingProps> = ({ 
  title = "Loading workspace",
  subtitle,
  description = "Setting up your AI assistant...",
  size = "lg",
  className = ""
}) => {
  const sizeClasses = {
    sm: "h-64",
    md: "h-96", 
    lg: "h-screen"
  };

  const logoSizes = {
    sm: "md",
    md: "md",
    lg: "lg"
  } as const;

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} bg-gray-50 ${className}`}>
      <div className="flex flex-col items-center space-y-4 text-center max-w-md mx-auto p-6">
        <div className="relative">
          <LogoAnimation size={logoSizes[size]} className="text-primary-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className={`font-semibold text-gray-900 ${
            size === 'lg' ? 'text-xl' : size === 'md' ? 'text-lg' : 'text-base'
          }`}>
            {title}
          </h2>
          {subtitle && (
            <p className={`text-gray-600 ${
              size === 'lg' ? 'text-base' : 'text-sm'
            }`}>
              {subtitle}
            </p>
          )}
          <p className={`text-gray-500 animate-pulse ${
            size === 'lg' ? 'text-sm' : 'text-xs'
          }`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

// Project-specific loading state
export const ProjectLoading: React.FC<{ projectTitle?: string }> = ({ projectTitle }) => (
  <WorkspaceLoading
    title={projectTitle ? `Loading ${projectTitle}` : 'Loading workspace'}
    subtitle={projectTitle}
    size="md"
    className="min-h-[400px] h-full"
  />
);

// Component-level loading for smaller areas
interface ComponentLoadingProps extends BaseLoadingProps {
  text?: string;
  inline?: boolean;
}

export const ComponentLoading: React.FC<ComponentLoadingProps> = ({ 
  text = "Loading...",
  size = "md",
  inline = false,
  className = ""
}) => {
  const spinnerSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  if (inline) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className={`animate-spin ${spinnerSizes[size]}`} />
        <span className={`text-gray-500 ${textSizes[size]}`}>{text}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className={`animate-spin ${spinnerSizes[size]} mb-2`} />
      <p className={`text-gray-500 ${textSizes[size]}`}>{text}</p>
    </div>
  );
};

// Empty state component for when no data is available
interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = "",
  size = "md"
}) => {
  const containerSizes = {
    sm: "p-4 space-y-3",
    md: "p-6 space-y-4", 
    lg: "p-8 space-y-6"
  };

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  const titleSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl"
  };

  const descriptionSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${containerSizes[size]} ${className}`}>
      {Icon && (
        <div className="mb-4">
          <Icon className={`mx-auto text-gray-300 ${iconSizes[size]}`} />
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className={`font-medium text-gray-900 ${titleSizes[size]}`}>
          {title}
        </h3>
        
        {description && (
          <p className={`text-gray-500 max-w-sm ${descriptionSizes[size]}`}>
            {description}
          </p>
        )}
      </div>
      
      {action && (
        <Button
          variant={action.variant || 'default'}
          onClick={action.onClick}
          className="mt-4"
          size={size === 'sm' ? 'sm' : 'default'}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Specialized empty states for common scenarios
export const EmptyConversations: React.FC<{ onCreateNew?: () => void }> = ({ onCreateNew }) => (
  <EmptyState
    icon={MessageSquare}
    title="No conversations yet"
    description="Start a new conversation to begin working with your AI assistant."
    action={onCreateNew ? {
      label: "Start Conversation",
      onClick: onCreateNew
    } : undefined}
  />
);

export const EmptyDocuments: React.FC<{ onUpload?: () => void }> = ({ onUpload }) => (
  <EmptyState
    icon={FileText}
    title="No documents uploaded"
    description="Upload documents to build your knowledge base and enhance AI responses."
    action={onUpload ? {
      label: "Upload Document",
      onClick: onUpload
    } : undefined}
  />
);

export const EmptyProjects: React.FC<{ onCreateNew?: () => void }> = ({ onCreateNew }) => (
  <EmptyState
    icon={Briefcase}
    title="No projects yet"
    description="Create your first project to start organizing your work with AI assistance."
    action={onCreateNew ? {
      label: "Create Project",
      onClick: onCreateNew
    } : undefined}
  />
);

export const EmptyTeam: React.FC<{ onInvite?: () => void }> = ({ onInvite }) => (
  <EmptyState
    icon={Users}
    title="No team members"
    description="Invite colleagues to collaborate on this project."
    action={onInvite ? {
      label: "Invite Members",
      onClick: onInvite,
      variant: "outline"
    } : undefined}
  />
);

// Chat-specific empty state
export const ChatEmptyState: React.FC<{ projectTitle?: string }> = ({ projectTitle }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 text-center">
    <div className="max-w-md mx-auto space-y-6">
      <div className="space-y-4">
        
        <div className="space-y-2">
          <p className="text-gray-600 text-3xl capitalize">
            All Your favorite legal tools in a unified AI workspace
          </p>
        </div>
        
      </div>
    </div>
  </div>
);

// Error state component
interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  description = "We encountered an error while loading this content.",
  action,
  className = ""
}) => (
  <div className={`flex flex-col items-center justify-center h-full min-h-[400px] text-center ${className}`}>
    <div className="space-y-4">
      <div className="text-red-500">
        <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  </div>
);