// Modal component types

import { BaseModalProps } from './index';

export interface ConfirmationModalProps extends BaseModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive';
  onConfirm: () => void;
  isLoading?: boolean;
}

export interface FormModalProps extends BaseModalProps {
  title: string;
  children: React.ReactNode;
  onSubmit: (data: any) => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface InfoModalProps extends BaseModalProps {
  title: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface SuccessModalProps extends BaseModalProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export interface ErrorModalProps extends BaseModalProps {
  title: string;
  error: string | Error;
  onRetry?: () => void;
  retryText?: string;
}