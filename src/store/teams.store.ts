// src/store/teams.store.ts
import { create } from 'zustand'
import { apiService } from '@/lib/api'

export interface TeamMember {
  id: string
  email: string
  fullName: string | null
  role: string
  avatarUrl?: string | null
  joinedAt: string
}

export interface Invitation {
  id: string
  email: string
  role: string
  token: string
  expiresAt: string
  invitedById: string
  invitedByName: string
  createdAt: string
}

interface TeamsState {
  members: TeamMember[]
  invitations: Invitation[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchTeamMembers: (organizationId: string) => Promise<TeamMember[]>
  fetchInvitations: (organizationId: string) => Promise<Invitation[]>
  inviteTeamMember: (organizationId: string, email: string, role: string) => Promise<boolean>
  cancelInvitation: (organizationId: string, invitationId: string) => Promise<boolean>
  removeTeamMember: (organizationId: string, userId: string) => Promise<boolean>
  updateMemberRole: (organizationId: string, userId: string, role: string) => Promise<boolean>
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export const useTeamsStore = create<TeamsState>((set, get) => ({
  members: [],
  invitations: [],
  isLoading: false,
  error: null,
  
  fetchTeamMembers: async (organizationId) => {
    try {
      set({ isLoading: true, error: null })
      const response = await apiService.get<{ data: TeamMember[] }>(`/api/organizations/${organizationId}/members`)
      set({ members: response.data, isLoading: false })
      return response.data
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch team members', 
        isLoading: false 
      })
      return []
    }
  },
  
  fetchInvitations: async (organizationId) => {
    try {
      set({ isLoading: true, error: null })
      const response = await apiService.get<{ data: Invitation[] }>(`/api/organizations/${organizationId}/invitations`)
      set({ invitations: response.data, isLoading: false })
      return response.data
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch invitations', 
        isLoading: false 
      })
      return []
    }
  },
  
  inviteTeamMember: async (organizationId, email, role) => {
    try {
      set({ isLoading: true, error: null })
      const response = await apiService.post(`/api/organizations/${organizationId}/invitations`, {
        email,
        role
      })
      
      // Refresh invitations list after successful invitation
      await get().fetchInvitations(organizationId)
      
      set({ isLoading: false })
      return true
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to invite team member', 
        isLoading: false 
      })
      return false
    }
  },
  
  cancelInvitation: async (organizationId, invitationId) => {
    try {
      set({ isLoading: true, error: null })
      await apiService.delete(`/api/organizations/${organizationId}/invitations/${invitationId}`)
      
      // Update invitations list
      set((state) => ({
        invitations: state.invitations.filter(inv => inv.id !== invitationId),
        isLoading: false
      }))
      
      return true
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to cancel invitation', 
        isLoading: false 
      })
      return false
    }
  },
  
  removeTeamMember: async (organizationId, userId) => {
    try {
      set({ isLoading: true, error: null })
      await apiService.delete(`/api/organizations/${organizationId}/members/${userId}`)
      
      // Update members list
      set((state) => ({
        members: state.members.filter(member => member.id !== userId),
        isLoading: false
      }))
      
      return true
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to remove team member', 
        isLoading: false 
      })
      return false
    }
  },
  
  updateMemberRole: async (organizationId, userId, role) => {
    try {
      set({ isLoading: true, error: null })
      await apiService.put(`/api/organizations/${organizationId}/members/${userId}`, { role })
      
      // Update member role in state
      set((state) => ({
        members: state.members.map(member => 
          member.id === userId ? { ...member, role } : member
        ),
        isLoading: false
      }))
      
      return true
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update member role', 
        isLoading: false 
      })
      return false
    }
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}))