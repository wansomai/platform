// src/store/project.store.ts
import { create } from 'zustand'
import { apiService } from '@/lib/api'
import { Project } from '@/types/projects'

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  error?: boolean;
}

interface ProjectState {  
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null;  
  
  // Basic state setters
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Project) => void
  updateProject: (project: Project) => void
  deleteProject: (projectId: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  
  // API operations
  fetchProjects: () => Promise<Project[]>
  fetchProjectById: (projectId: string) => Promise<Project | null>
  createProject: (data: {title: string, description?: string, organizationId: string}) => Promise<Project | null>
  updateProjectDetails: (projectId: string, data: {title: string, description?: string, status?: string}) => Promise<Project | null>
  removeProject: (projectId: string) => Promise<boolean>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  
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
 fetchProjects: async (forceRefresh = false) => {
    const state = get();
    
    // OPTIMIZATION 1: Simple cache check
    const now = Date.now();
    const hasRecentData = state.lastFetched && (now - state.lastFetched) < 30000; // 30 seconds
    
    if (hasRecentData && !forceRefresh && state.projects.length > 0) {
      return state.projects;
    }
    
    try {
      set({ isLoading: true, error: null });
      
      // For dashboard, request fewer projects
      const isDashboard = state.projects.length === 0; // First load likely dashboard
      const params = isDashboard ? '?limit=5' : '';
      
      const response = await apiService.get<ApiResponse<Project[]>>(`/api/projects${params}`);
      const projects = response.data;
      
      set({ 
        projects, 
        isLoading: false,
        lastFetched: now
      });
      
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
      const response = await apiService.get<ApiResponse<Project>>(`/api/projects/${projectId}`);
      // Get the project data from the response
      const projectData = response.data || null;
      
      // Ensure the knowledge base structure exists
      if (projectData && !projectData.knowledgeBase) {
        projectData.knowledgeBase = {
          documents: [],
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
      const response = await apiService.post<ApiResponse<Project>>('/api/projects', data);
      
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
      const response = await apiService.put<ApiResponse<Project>>(`/api/projects/${projectId}`, data);
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
  }
  
}))