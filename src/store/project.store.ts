// src/store/project.store.ts
import { create } from 'zustand'
import { apiService } from '@/lib/api'

export interface ProjectDetails {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  knowledge_base: {
    team: TeamMember[]
    client: ClientInfo
    documents: DocumentInfo[]
    events: EventInfo[]
  }
  team_count: number
  messages_count: number
  documents_count: number
  last_activity: string
}

export interface ProjectListItem {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  team_count: number
  messages_count: number
  documents_count: number
  last_activity: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string
}

export interface ClientInfo {
  id?: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}

export interface DocumentInfo {
  id: string
  name: string
  file_url: string
  file_type: string
  file_size: number
  category: string
  uploaded_at: string
  uploaded_by: string
}

export interface EventInfo {
  id: string
  title: string
  date: string
  type: string
  description?: string
  createdAt: string
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  error?: boolean;
}

interface ProjectState {
  projects: ProjectListItem[]
  currentProject: ProjectDetails | null
  isLoading: boolean
  error: string | null
  
  // Basic state setters
  setProjects: (projects: ProjectListItem[]) => void
  setCurrentProject: (project: ProjectDetails | null) => void
  addProject: (project: ProjectListItem) => void
  updateProject: (project: ProjectListItem) => void
  deleteProject: (projectId: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  
  // API operations
  fetchProjects: () => Promise<ProjectListItem[]>
  fetchProjectById: (projectId: string) => Promise<ProjectDetails | null>
  createProject: (data: {title: string, description?: string, organizationId: string}) => Promise<ProjectListItem | null>
  updateProjectDetails: (projectId: string, data: {title: string, description?: string, status?: string}) => Promise<ProjectListItem | null>
  removeProject: (projectId: string) => Promise<boolean>
  
  // Team management
  addTeamMember: (projectId: string, data: {email: string, role: string, userId: string|undefined}) => Promise<TeamMember | null>
  removeTeamMember: (projectId: string, userId: string) => Promise<boolean>
  
  // Document management
  deleteDocument: (projectId: string, documentId: string) => Promise<boolean>
  
  // Event management
  addEvent: (projectId: string, data: {title: string, date: string, type: string, description?: string}) => Promise<EventInfo | null>
  updateEvent: (projectId: string, eventId: string, data: {title?: string, date?: string, type?: string, description?: string}) => Promise<EventInfo | null>
  removeEvent: (projectId: string, eventId: string) => Promise<boolean>
  
  // Client information
  updateClientInfo: (projectId: string, data: ClientInfo) => Promise<ClientInfo | null>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  
  // Basic state setters
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  addProject: (project) => set((state) => ({ 
    projects: [...state.projects, project] 
  })),
  updateProject: (project) => set((state) => ({
    projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    currentProject: state.currentProject?.id === project.id 
      ? { ...state.currentProject, ...project } 
      : state.currentProject
  })),
  deleteProject: (projectId) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== projectId),
    currentProject: state.currentProject?.id === projectId ? null : state.currentProject
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // API operations
  fetchProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.get<ApiResponse<ProjectListItem[]>>('/api/projects');
      const projects = response.data;
      set({ projects, isLoading: false });
      return projects;
      
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      set({ error: error.message || 'Failed to fetch projects', isLoading: false });
      return [];
    }
  },
  
  fetchProjectById: async (projectId: string) => {
    const state = get();
    
    // If we're already loading this project, don't make another request
    if (state.isLoading) {
      return state.currentProject;
    }
    
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.get<ApiResponse<ProjectDetails>>(`/api/projects/${projectId}`);
      
      console.log(response.data,"fetched project details");
      // Get the project data from the response
      const projectData = response.data || null;
      
      // Ensure the knowledge base structure exists
      if (projectData && !projectData.knowledge_base) {
        projectData.knowledge_base = {
          team: [],
          client: {} as ClientInfo,
          documents: [],
          events: []
        };
      }
      
      set({ currentProject: projectData, isLoading: false });
      return projectData;
    } catch (error: any) {
      console.error('Error fetching project:', error);
      set({ 
        error: error.message || 'Failed to fetch project details', 
        isLoading: false 
      });
      return null;
    }
  },
  
  createProject: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.post<ApiResponse<ProjectListItem>>('/api/projects', data);
      
      if (response.status === 201) {
        const project = response.data;
        set({ isLoading: false });
        get().fetchProjects();
        return project;
      }
      return null;
    } catch (error: any) {
      console.error('Error creating project:', error);
      set({ 
        error: error.message || 'Failed to create project', 
        isLoading: false 
      });
      return null;
    }
  },
  
  updateProjectDetails: async (projectId, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.put<ApiResponse<ProjectListItem>>(`/api/projects/${projectId}`, data);
      const updatedProject = response.data || response.data;
      
      set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId ? updatedProject : p
        ),
        currentProject: state.currentProject?.id === projectId 
          ? { ...state.currentProject, ...updatedProject }
          : state.currentProject,
        isLoading: false
      }));
      
      return updatedProject;
    } catch (error: any) {
      console.error('Error updating project:', error);
      set({ 
        error: error.message || 'Failed to update project', 
        isLoading: false 
      });
      return null;
    }
  },
  
  removeProject: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      await apiService.delete(`/api/projects/${projectId}`);
      
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId 
          ? null 
          : state.currentProject,
        isLoading: false
      }));
      
      return true;
    } catch (error: any) {
      console.error('Error deleting project:', error);
      set({ 
        error: error.message || 'Failed to delete project', 
        isLoading: false 
      });
      return false;
    }
  },
  
  // Team management
  addTeamMember: async (projectId, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.post<ApiResponse<TeamMember>>(`/api/projects/${projectId}/team`, data);
      const newMember = response.data || response.data;
      
      set((state) => {
        if (state.currentProject && state.currentProject.id === projectId) {
          return {
            currentProject: {
              ...state.currentProject,
              knowledge_base: {
                ...state.currentProject.knowledge_base,
                team: [...state.currentProject.knowledge_base.team, newMember],
              },
              team_count: state.currentProject.team_count + 1,
            },
            isLoading: false
          };
        }
        return { isLoading: false };
      });
      
      return newMember;
    } catch (error: any) {
      console.error('Error adding team member:', error);
      set({ 
        error: error.message || 'Failed to add team member', 
        isLoading: false 
      });
      return null;
    }
  },
  
  removeTeamMember: async (projectId, userId) => {
    try {
      set({ isLoading: true, error: null });
      await apiService.delete(`/api/projects/${projectId}/team/${userId}`);
      
      set((state) => {
        if (state.currentProject && state.currentProject.id === projectId) {
          return {
            currentProject: {
              ...state.currentProject,
              knowledge_base: {
                ...state.currentProject.knowledge_base,
                team: state.currentProject.knowledge_base.team.filter(
                  (member) => member.id !== userId
                ),
              },
              team_count: state.currentProject.team_count - 1,
            },
            isLoading: false
          };
        }
        return { isLoading: false };
      });
      
      return true;
    } catch (error: any) {
      console.error('Error removing team member:', error);
      set({ 
        error: error.message || 'Failed to remove team member', 
        isLoading: false 
      });
      return false;
    }
  },
  deleteDocument: async (projectId, documentId) => {
    try {
      set({ isLoading: true, error: null });
      await apiService.delete(`/api/projects/${projectId}/documents/${documentId}`);
      
      set((state) => {
        if (state.currentProject && state.currentProject.id === projectId) {
          return {
            currentProject: {
              ...state.currentProject,
              knowledge_base: {
                ...state.currentProject.knowledge_base,
                documents: state.currentProject.knowledge_base.documents.filter(
                  (doc) => doc.id !== documentId
                ),
              },
              documents_count: state.currentProject.documents_count - 1,
            },
            isLoading: false
          };
        }
        return { isLoading: false };
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting document:', error);
      set({ 
        error: error.message || 'Failed to delete document', 
        isLoading: false 
      });
      return false;
    }
  },
  
  // Event management
  addEvent: async (projectId, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.post<ApiResponse<EventInfo>>(`/api/projects/${projectId}/events`, data);
      const newEvent = response.data || response.data;
      
      set((state) => {
        if (state.currentProject && state.currentProject.id === projectId) {
          return {
            currentProject: {
              ...state.currentProject,
              knowledge_base: {
                ...state.currentProject.knowledge_base,
                events: [...state.currentProject.knowledge_base.events, newEvent],
              },
            },
            isLoading: false
          };
        }
        return { isLoading: false };
      });
      
      return newEvent;
    } catch (error: any) {
      console.error('Error adding event:', error);
      set({ 
        error: error.message || 'Failed to add event', 
        isLoading: false 
      });
      return null;
    }
  },
  
  updateEvent: async (projectId, eventId, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.put<ApiResponse<EventInfo>>(
        `/api/projects/${projectId}/events/${eventId}`,
        data
      );
      const updatedEvent = response.data || response.data;
      
      set((state) => {
        if (state.currentProject && state.currentProject.id === projectId) {
          return {
            currentProject: {
              ...state.currentProject,
              knowledge_base: {
                ...state.currentProject.knowledge_base,
                events: state.currentProject.knowledge_base.events.map(
                  (event) => event.id === eventId ? updatedEvent : event
                ),
              },
            },
            isLoading: false
          };
        }
        return { isLoading: false };
      });
      
      return updatedEvent;
    } catch (error: any) {
      console.error('Error updating event:', error);
      set({ 
        error: error.message || 'Failed to update event', 
        isLoading: false 
      });
      return null;
    }
  },
  
  removeEvent: async (projectId, eventId) => {
    try {
      set({ isLoading: true, error: null });
      await apiService.delete(`/api/projects/${projectId}/events/${eventId}`);
      
      set((state) => {
        if (state.currentProject && state.currentProject.id === projectId) {
          return {
            currentProject: {
              ...state.currentProject,
              knowledge_base: {
                ...state.currentProject.knowledge_base,
                events: state.currentProject.knowledge_base.events.filter(
                  (event) => event.id !== eventId
                ),
              },
            },
            isLoading: false
          };
        }
        return { isLoading: false };
      });
      
      return true;
    } catch (error: any) {
      console.error('Error removing event:', error);
      set({ 
        error: error.message || 'Failed to remove event', 
        isLoading: false 
      });
      return false;
    }
  },
  
  // Client information
  updateClientInfo: async (projectId, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.put<ApiResponse<ClientInfo>>(
        `/api/projects/${projectId}/client`,
        data
      );
      const updatedClientInfo = response.data || response.data;
      
      set((state) => {
        if (state.currentProject && state.currentProject.id === projectId) {
          return {
            currentProject: {
              ...state.currentProject,
              knowledge_base: {
                ...state.currentProject.knowledge_base,
                client: updatedClientInfo,
              },
            },
            isLoading: false
          };
        }
        return { isLoading: false };
      });
      
      return updatedClientInfo;
    } catch (error: any) {
      console.error('Error updating client information:', error);
      set({ 
        error: error.message || 'Failed to update client information', 
        isLoading: false 
      });
      return null;
    }
  }
}))