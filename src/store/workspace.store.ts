// src/store/workspace.store.ts
import { create } from 'zustand'

interface WorkspaceState {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))