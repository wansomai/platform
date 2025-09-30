// src/store/profile.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiService } from '../lib/api';
import { API_CONSTANTS } from '../lib/utils/constants';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
  organization?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  avatar?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UpdateProfileData {
  name?: string;
  email?: string;
}

interface InviteMemberData {
  email: string;
  role: string;
}

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface TeamDataResponse {
  members: TeamMember[];
  invitations: Invitation[];
}

// Store State Interface
interface ProfileState {
  // User data
  user: User | null;
  teamMembers: TeamMember[];
  invitations: Invitation[];

  // UI state
  isLoading: boolean;
  isSaving: boolean;
  isInviting: boolean;
  error: string | null;
  lastFetched: number | null;

  // Team UI state
  searchQuery: string;

  // Actions - Profile
  fetchProfile: (forceRefresh?: boolean) => Promise<User | null>;
  updateProfile: (data: UpdateProfileData) => Promise<User | null>;

  // Actions - Team Management
  fetchTeamData: (forceRefresh?: boolean) => Promise<void>;
  inviteMember: (data: InviteMemberData) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  cancelInvitation: (invitationId: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, role: string) => Promise<boolean>;

  // Actions - UI
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setInviting: (inviting: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Cache management
  invalidateCache: () => void;
  refreshAll: () => Promise<void>;

  // Getters
  getFilteredMembers: () => TeamMember[];
  getCurrentUser: () => User | null;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      teamMembers: [],
      invitations: [],
      isLoading: false,
      isSaving: false,
      isInviting: false,
      error: null,
      lastFetched: null,
      searchQuery: '',

      // Fetch user profile
      fetchProfile: async (forceRefresh = false): Promise<User | null> => {
        const state = get();

        // Cache check
        const now = Date.now();
        const hasRecentData = state.lastFetched && (now - state.lastFetched) < API_CONSTANTS.CACHE_DURATION;

        if (hasRecentData && !forceRefresh && state.user) {
          return state.user;
        }

        try {
          set({ isLoading: true, error: null });

          const response = await apiService.get<ApiResponse<User>>('/api/profile');
          const user = response.data;

          set({
            user,
            isLoading: false,
            lastFetched: now
          });

          return user;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch profile';
          set({
            error: errorMessage,
            isLoading: false
          });
          return null;
        }
      },

      // Update user profile
      updateProfile: async (data: UpdateProfileData): Promise<User | null> => {
        try {
          set({ isSaving: true, error: null });

          const response = await apiService.put<ApiResponse<User>>('/api/profile', data);
          const updatedUser = response.data;

          set({
            user: updatedUser,
            isSaving: false,
            lastFetched: Date.now()
          });

          return updatedUser;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
          set({
            error: errorMessage,
            isSaving: false
          });
          return null;
        }
      },

      // Fetch team members and invitations
      fetchTeamData: async (forceRefresh = false): Promise<void> => {
        const state = get();

        // Cache check for team data
        const now = Date.now();
        const hasRecentData = state.lastFetched && (now - state.lastFetched) < API_CONSTANTS.CACHE_DURATION;

        if (hasRecentData && !forceRefresh && state.teamMembers.length > 0) {
          return;
        }

        try {
          set({ isLoading: true, error: null });

          const [membersResponse, invitationsResponse] = await Promise.all([
            apiService.get<ApiResponse<TeamMember[]>>('/api/organization/members'),
            apiService.get<ApiResponse<Invitation[]>>('/api/organization/invitations')
          ]);

          set({
            teamMembers: membersResponse.data || [],
            invitations: invitationsResponse.data || [],
            isLoading: false,
            lastFetched: now
          });
        } catch (error: any) {
          console.error('Error fetching team data:', error);

          // Fallback to mock data for development
          const state = get();
          const mockMembers: TeamMember[] = state.user ? [{
            id: '1',
            name: state.user.name,
            email: state.user.email,
            role: 'admin',
            joinedAt: new Date().toISOString(),
            avatar: state.user.image
          }] : [];

          set({
            teamMembers: mockMembers,
            invitations: [],
            error: null, // Don't show error for team data in development
            isLoading: false
          });
        }
      },

      // Invite a new team member
      inviteMember: async (data: InviteMemberData): Promise<boolean> => {
        try {
          set({ isInviting: true, error: null });

          const response = await apiService.post<ApiResponse<Invitation>>('/api/organization/invite', data);
          const newInvitation = response.data;

          // Add to invitations list
          set((state) => ({
            invitations: [...state.invitations, newInvitation],
            isInviting: false
          }));

          return true;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to send invitation';
          set({
            error: errorMessage,
            isInviting: false
          });
          return false;
        }
      },

      // Remove a team member
      removeMember: async (memberId: string): Promise<boolean> => {
        try {
          set({ error: null });

          await apiService.delete(`/api/organization/members/${memberId}`);

          // Remove from team members list
          set((state) => ({
            teamMembers: state.teamMembers.filter(member => member.id !== memberId)
          }));

          return true;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to remove member';
          set({ error: errorMessage });
          return false;
        }
      },

      // Cancel an invitation
      cancelInvitation: async (invitationId: string): Promise<boolean> => {
        try {
          set({ error: null });

          await apiService.delete(`/api/organization/invitations/${invitationId}`);

          // Remove from invitations list
          set((state) => ({
            invitations: state.invitations.filter(inv => inv.id !== invitationId)
          }));

          return true;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel invitation';
          set({ error: errorMessage });
          return false;
        }
      },

      // Update member role
      updateMemberRole: async (memberId: string, role: string): Promise<boolean> => {
        try {
          set({ error: null });

          const response = await apiService.put<ApiResponse<TeamMember>>(`/api/organization/members/${memberId}`, { role });
          const updatedMember = response.data;

          // Update member in list
          set((state) => ({
            teamMembers: state.teamMembers.map(member =>
              member.id === memberId ? updatedMember : member
            )
          }));

          return true;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to update member role';
          set({ error: errorMessage });
          return false;
        }
      },

      // UI Actions
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setSaving: (saving: boolean) => set({ isSaving: saving }),
      setInviting: (inviting: boolean) => set({ isInviting: inviting }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Cache management
      invalidateCache: () => {
        set({ lastFetched: null });
      },

      // Refresh all data
      refreshAll: async () => {
        const state = get();
        await Promise.all([
          state.fetchProfile(true),
          state.fetchTeamData(true)
        ]);
      },

      // Getters
      getFilteredMembers: () => {
        const state = get();
        const members = state.teamMembers || [];
        if (!state.searchQuery) return members;

        const query = state.searchQuery.toLowerCase();
        return members.filter(member =>
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query)
        );
      },

      getCurrentUser: () => {
        return get().user;
      },
    }),
    {
      name: 'profile-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        teamMembers: state.teamMembers,
        invitations: state.invitations,
        lastFetched: state.lastFetched,
      }),
      version: 1,
    }
  )
);

// Selector hooks for better performance
export const useProfile = () => {
  const user = useProfileStore(state => state.user);
  const isLoading = useProfileStore(state => state.isLoading);
  const isSaving = useProfileStore(state => state.isSaving);
  const error = useProfileStore(state => state.error);
  const fetchProfile = useProfileStore(state => state.fetchProfile);
  const updateProfile = useProfileStore(state => state.updateProfile);

  return { user, isLoading, isSaving, error, fetchProfile, updateProfile };
};

export const useTeamManagement = () => {
  const teamMembers = useProfileStore(state => state.teamMembers);
  const invitations = useProfileStore(state => state.invitations);
  const isLoading = useProfileStore(state => state.isLoading);
  const isInviting = useProfileStore(state => state.isInviting);
  const searchQuery = useProfileStore(state => state.searchQuery);
  const error = useProfileStore(state => state.error);
  const getFilteredMembers = useProfileStore(state => state.getFilteredMembers);

  const fetchTeamData = useProfileStore(state => state.fetchTeamData);
  const inviteMember = useProfileStore(state => state.inviteMember);
  const removeMember = useProfileStore(state => state.removeMember);
  const cancelInvitation = useProfileStore(state => state.cancelInvitation);
  const updateMemberRole = useProfileStore(state => state.updateMemberRole);
  const setSearchQuery = useProfileStore(state => state.setSearchQuery);

  return {
    teamMembers,
    invitations,
    isLoading,
    isInviting,
    searchQuery,
    error,
    getFilteredMembers,
    fetchTeamData,
    inviteMember,
    removeMember,
    cancelInvitation,
    updateMemberRole,
    setSearchQuery,
  };
};