// Common component prop types and interfaces

export interface BaseModalProps {
  open: boolean;
  onClose: () => void;
}

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Re-export component-specific types
export * from './chat';
export * from './document';
export * from './project';
export * from './modal';