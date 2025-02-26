// src/store/project.store.ts
import { create } from 'zustand'
import { apiClient } from '@/lib/api'

export interface ProjectDetails {
  id: string
  title: string
  description: string
  status: string
  created_at: string
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
  created_at: string
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
  created_at: string
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
  createProject: (data: {title: string, description?: string}) => Promise<ProjectListItem | null>
  updateProjectDetails: (projectId: string, data: {title: string, description?: string, status?: string}) => Promise<ProjectListItem | null>
  removeProject: (projectId: string) => Promise<boolean>
  
  // Team management
  addTeamMember: (projectId: string, data: {email: string, role: string}) => Promise<TeamMember | null>
  removeTeamMember: (projectId: string, userId: string) => Promise<boolean>
  
  // Document management
  uploadDocument: (projectId: string, file: File, category: string, onProgress?: (progress: number) => void) => Promise<DocumentInfo | null>
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
      const response = await apiClient.get<{ data: ProjectListItem[] }>('/projects');
      set({ projects: response.data, isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch projects', 
        isLoading: false 
      });
      return [];
    }
  },
  
  fetchProjectById: async (projectId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.get<{ data: ProjectDetails }>(`/projects/${projectId}`);
      const project = response.data;
      set({ currentProject: project, isLoading: false });
      return project;
    } catch (error: any) {
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
      const response = await apiClient.post<{ data: ProjectListItem }>('/projects', data);
      const newProject = response.data;
      set((state) => ({ 
        projects: [...state.projects, newProject],
        isLoading: false
      }));
      return newProject;
    } catch (error: any) {
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
      const response = await apiClient.put<{ data: ProjectListItem }>(`/projects/${projectId}`, data);
      const updatedProject = response.data;
      
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
      await apiClient.delete(`/projects/${projectId}`);
      
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId 
          ? null 
          : state.currentProject,
        isLoading: false
      }));
      
      return true;
    } catch (error: any) {
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
      const response = await apiClient.post<{ data: TeamMember }>(`/projects/${projectId}/team`, data);
      const newMember = response.data;
      
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
      await apiClient.delete(`/projects/${projectId}/team/${userId}`);
      
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
      set({ 
        error: error.message || 'Failed to remove team member', 
        isLoading: false 
      });
      return false;
    }
  },
  
  // Document management
  uploadDocument: async (projectId, file, category, onProgress) => {
    try {
      set({ isLoading: true, error: null });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      
      const response = await apiClient.upload<{ data: DocumentInfo }>(
        `/projects/${projectId}/documents`,
        file,
        onProgress,
        { category }
      );
      
      const newDocument = response.data;
      
      set((state) => {
        if (state.currentProject && state.currentProject.id === projectId) {
          return {
            currentProject: {
              ...state.currentProject,
              knowledge_base: {
                ...state.currentProject.knowledge_base,
                documents: [
                  ...state.currentProject.knowledge_base.documents,
                  newDocument
                ],
              },
              documents_count: state.currentProject.documents_count + 1,
            },
            isLoading: false
          };
        }
        return { isLoading: false };
      });
      
      return newDocument;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to upload document', 
        isLoading: false 
      });
      return null;
    }
  },
  
  deleteDocument: async (projectId, documentId) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.delete(`/projects/${projectId}/documents/${documentId}`);
      
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
      const response = await apiClient.post<{ data: EventInfo }>(`/projects/${projectId}/events`, data);
      const newEvent = response.data;
      
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
      const response = await apiClient.put<{ data: EventInfo }>(
        `/projects/${projectId}/events/${eventId}`,
        data
      );
      const updatedEvent = response.data;
      
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
      await apiClient.delete(`/projects/${projectId}/events/${eventId}`);
      
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
      const response = await apiClient.put<{ data: ClientInfo }>(
        `/projects/${projectId}/client`,
        data
      );
      const updatedClientInfo = response.data;
      
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
      set({ 
        error: error.message || 'Failed to update client information', 
        isLoading: false 
      });
      return null;
    }
  }
}))