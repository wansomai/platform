// src/store/ui.store.ts
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { UIState } from '@/types'

export const useUIStore = create<UIState>((set,get) => ({
  // Sidebar state
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  notifications: [],
  
  // Modal management
  activeModal: null,
  modalData: null,
  openModal: (modalId, data = null) => set({ activeModal: modalId, modalData: data }),
  openUploadModal: () => set({ activeModal: 'upload' }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  
  // Workspace layout
  rightSidebarCollapsed: false,
  toggleRightSidebar: () => set((state) => ({ rightSidebarCollapsed: !state.rightSidebarCollapsed })),
  setRightSidebarCollapsed: (collapsed) => set({ rightSidebarCollapsed: collapsed }),

  // Document preview
  selectedPreviewDocument: null,
  setSelectedPreviewDocument: (document) => set({ selectedPreviewDocument: document }),
  clearPreviewDocument: () => set({ selectedPreviewDocument: null }),
  
  // Active tab in workspace - set default to 'overview'
  activeWorkspaceTab: 'chat',
  setActiveWorkspaceTab: (tab) => {
    set({ activeWorkspaceTab: tab });
  },
  
  // Toast notifications
  toasts: [],
  addToast: (toast) => set((state) => ({ 
    toasts: [...state.toasts, { 
      id: Date.now().toString(), 
      ...toast,
      duration: toast.duration || 5000 // Default 5s duration if not specified
    }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id)
  })),
  addNotification: (type, message) => {
    const id = uuidv4()
    set((state) => ({
      notifications: [...state.notifications, { id, type, message }]
    }))

    // Auto remove notification after 5 seconds
    setTimeout(() => {
      get().removeNotification(id)
    }, 5000)
  },

  removeNotification: (id: string) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  
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