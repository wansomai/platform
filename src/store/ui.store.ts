// src/store/ui.store.ts
import { create } from 'zustand'

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
  
  // Modal management
  activeModal: string | null;
  modalData: any;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  
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
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar state
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Modal management
  activeModal: null,
  modalData: null,
  openModal: (modalId, data = null) => set({ activeModal: modalId, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  
  // Workspace layout
  rightSidebarCollapsed: false,
  toggleRightSidebar: () => set((state) => ({ rightSidebarCollapsed: !state.rightSidebarCollapsed })),
  setRightSidebarCollapsed: (collapsed) => set({ rightSidebarCollapsed: collapsed }),
  
  // Active tab in workspace
  activeWorkspaceTab: 'chat',
  setActiveWorkspaceTab: (tab) => set({ activeWorkspaceTab: tab }),
  
  // Toast notifications
  toasts: [],
  addToast: (toast) => set((state) => ({ 
    toasts: [...state.toasts, { 
      id: Date.now().toString(), 
      ...toast 
    }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id)
  })),
  
  // Add missing properties
  clearToasts: () => set({ toasts: [] }),
  componentLoading: {},
  setComponentLoading: (componentId, isLoading) => 
    set((state) => ({ 
      componentLoading: { ...state.componentLoading, [componentId]: isLoading } 
    })),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  theme: 'light' as const,
  setTheme: (theme) => set({ theme })
}))