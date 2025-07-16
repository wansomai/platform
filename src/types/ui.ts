
// types/ui.ts 
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  rightSidebarCollapsed: boolean;
  
  // Modal management
  activeModal: string | null;
  modalData: any;
  
  // Workspace layout
  activeWorkspaceTab: string;
  
  // Notifications
  toasts: Toast[];
  notifications: Notification[];
  
  // Loading states
  componentLoading: Record<string, boolean>;
  
  // Search & filters
  searchQuery: string;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
}