
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

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'info'
    message: string
  }>
  
  // Modal management
  activeModal: string | null;
  modalData: any;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  openUploadModal: () => void;
  
  // Workspace layout
  rightSidebarCollapsed: boolean;
  toggleRightSidebar: () => void;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
  
  // Active tab in workspace
  activeWorkspaceTab: string;
  setActiveWorkspaceTab: (tab: string) => void;
  
  // Toast notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Loading states for specific UI components
  componentLoading: Record<string, boolean>;
  setComponentLoading: (componentId: string, isLoading: boolean) => void;
  
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Theme settings
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addNotification: (type: 'success' | 'error' | 'info', message: string) => void
  removeNotification: (id: string) => void
}