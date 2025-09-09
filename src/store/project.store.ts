// src/store/project.store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
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
  projectsMap: Map<string, Project>
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  
  // Basic state setters
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Project) => void
  updateProject: (project: Project) => void
  deleteProject: (projectId: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  
  // Optimized getters
  getProjectById: (projectId: string) => Project | undefined
  
  // API operations
  fetchProjects: () => Promise<Project[]>
  fetchProjectById: (projectId: string) => Promise<Project | null>
  createProject: (data: {title: string, description?: string, organizationId: string}) => Promise<Project | null>
  updateProjectDetails: (projectId: string, data: {title: string, description?: string, status?: string}) => Promise<Project | null>
  removeProject: (projectId: string) => Promise<boolean>
}

// Helper function to create Map from projects array
const createProjectsMap = (projects: Project[]): Map<string, Project> => {
  return new Map(projects.map(project => [project.id, project]));
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      projectsMap: new Map(),
      currentProject: null,
      isLoading: false,
      error: null,
      
      // Basic state setters
      setProjects: (projects) => set({ 
        projects, 
        projectsMap: createProjectsMap(projects)
      }),
      setCurrentProject: (project) => set({ currentProject: project }),
      addProject: (project) => set((state) => {
        const newProjects = [...state.projects, project];
        return { 
          projects: newProjects,
          projectsMap: createProjectsMap(newProjects)
        };
      }),
      updateProject: (project) => set((state) => {
        const newProjects = state.projects.map((p) => (p.id === project.id ? project : p));
        return {
          projects: newProjects,
          projectsMap: createProjectsMap(newProjects),
          currentProject: state.currentProject?.id === project.id 
            ? { ...state.currentProject, ...project } 
            : state.currentProject
        };
      }),
      deleteProject: (projectId) => set((state) => {
        const newProjects = state.projects.filter((p) => p.id !== projectId);
        return {
          projects: newProjects,
          projectsMap: createProjectsMap(newProjects),
          currentProject: state.currentProject?.id === projectId ? null : state.currentProject
        };
      }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // Optimized getters using Map for O(1) lookups
      getProjectById: (projectId) => {
        return get().projectsMap.get(projectId);
      },
      
      // API operations
      fetchProjects: async () => {   
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiService.get<ApiResponse<Project[]>>(`/api/projects`);
          const projects = response.data;
          
          set({ 
            projects, 
            projectsMap: createProjectsMap(projects),
            isLoading: false
          });
          
          return projects;
          
        } catch (error: any) {
          const state = get();
          set({ error: error.message || 'Failed to fetch projects', isLoading: false });
          return state.projects; 
        }
      },
      
      fetchProjectById: async (projectId: string) => {
        const state = get();
        
        // Check if we already have this project in our store using O(1) Map lookup
        const cachedProject = state.projectsMap.get(projectId);
        if (cachedProject && !state.isLoading) {
          set({ currentProject: cachedProject });
          return cachedProject;
        }
        
        // If we're already loading this project, don't make another request
        if (state.isLoading) {
          return state.currentProject;
        }
        
        try {
          set({ isLoading: true, error: null });
          const response = await apiService.get<ApiResponse<Project>>(`/api/projects/${projectId}`);
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
          
          set((state) => {
            const newProjects = state.projects.map((p) => 
              p.id === projectId ? updatedProject : p
            );
            return {
              projects: newProjects,
              projectsMap: createProjectsMap(newProjects),
              currentProject: state.currentProject?.id === projectId 
                ? { ...state.currentProject, ...updatedProject }
                : state.currentProject,
              isLoading: false
            };
          });
          
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
          await apiService.delete(`/api/projects/${projectId}`);
          
          set((state) => {
            const newProjects = state.projects.filter((p) => p.id !== projectId);
            return {
              projects: newProjects,
              projectsMap: createProjectsMap(newProjects),
              currentProject: state.currentProject?.id === projectId 
                ? null 
                : state.currentProject,
              isLoading: false
            };
          });
          
          return true;
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to delete project', 
            isLoading: false 
          });
          return false;
        }
      }
    }),
    {
      name: 'project-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recreate Map from persisted projects array
          state.projectsMap = createProjectsMap(state.projects);
        }
      },
      version: 1,
    }
  )
)