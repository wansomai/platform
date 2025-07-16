// store/workspace.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';
import { 
  Project, 
  ProjectSettings, 
  WorkspaceData, 
  ApiResponse,
  Jurisdiction, 
} from '@/types';
import { apiCache } from '@/lib/api/cache';


interface WorkspaceState {
  // === PROJECT MANAGEMENT ===
  projects: Project[];
  currentProject: Project | null;
  projectsLoading: boolean;
  projectsError: string | null;
  
  // === WORKSPACE DATA ===
  workspaceData: Record<string, WorkspaceData>; // projectId -> workspace data
  workspaceLoading: Record<string, boolean>;
  workspaceError: Record<string, string | null>;
  
  // === SETTINGS MANAGEMENT ===
  settings: Record<string, ProjectSettings>; // projectId -> settings
  settingsLoading: Record<string, boolean>;
  settingsError: Record<string, string | null>;
  
  // === INSTRUCTIONS MANAGEMENT ===
  instructions: Record<string, string>; // projectId -> instructions
  instructionsLoading: Record<string, boolean>;
  instructionsError: Record<string, string | null>;
  
  // === CACHE MANAGEMENT ===
  lastFetched: Record<string, number>;
  
  // === PROJECT OPERATIONS ===
  fetchProjects: (forceRefresh?: boolean) => Promise<Project[]>;
  fetchProject: (projectId: string, forceRefresh?: boolean) => Promise<Project | null>;
  createProject: (data: {title: string, description?: string, organizationId: string}) => Promise<Project | null>;
  updateProject: (projectId: string, data: {title?: string, description?: string, status?: string}) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  
  // === WORKSPACE OPERATIONS ===
  loadWorkspace: (projectId: string, options?: {
    includeMessages?: boolean;
    messageLimit?: number;
    includeDocuments?: boolean;
    includeSettings?: boolean;
  }) => Promise<WorkspaceData | null>;
  
  // === SETTINGS OPERATIONS ===
  fetchSettings: (projectId: string, forceRefresh?: boolean) => Promise<ProjectSettings>;
  updateSettings: (projectId: string, settings: Partial<ProjectSettings>) => Promise<boolean>;
  updateSetting: <K extends keyof ProjectSettings>(
    projectId: string, 
    key: K, 
    value: ProjectSettings[K]
  ) => Promise<boolean>;
  setJurisdiction: (projectId: string, jurisdiction: Jurisdiction | null) => Promise<boolean>;
  
  // === INSTRUCTIONS OPERATIONS ===
  fetchInstructions: (projectId: string, forceRefresh?: boolean) => Promise<string>;
  saveInstructions: (projectId: string, instructions: string) => Promise<boolean>;
  
  // === STATE MANAGEMENT ===
  setCurrentProject: (project: Project | null) => void;
  clearWorkspaceData: (projectId?: string) => void;
  invalidateCache: (scope?: 'projects' | 'workspace' | 'settings' | 'instructions' | string) => void;
}

const CACHE_DURATION = 30000; // 30 seconds
const WORKSPACE_CACHE_DURATION = 60000; // 1 minute for workspace data

const DEFAULT_SETTINGS: ProjectSettings = {
  citeSources: true,
  suggestActions: true,
  webSearch: false,
  legalDrafting: false,
  model: 'gpt-4',
  temperature: 0.7,
  jurisdiction: undefined
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  projectsLoading: false,
  projectsError: null,
  
  workspaceData: {},
  workspaceLoading: {},
  workspaceError: {},
  
  settings: {},
  settingsLoading: {},
  settingsError: {},
  
  instructions: {},
  instructionsLoading: {},
  instructionsError: {},
  
  lastFetched: {},

 
  // === PROJECT OPERATIONS ===
  fetchProjects: async (forceRefresh = false) => {
    const cacheKey = 'projects:list';
    const now = Date.now();
    const lastFetch = get().lastFetched[cacheKey];
    
    // Check cache first
    if (!forceRefresh && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      const cached = apiCache.get<Project[]>(cacheKey);
      if (cached && cached.length > 0) {
        set({ projects: cached });
        return cached;
      }
    }
    
    try {
      set({ projectsLoading: true, projectsError: null });
      
      // For dashboard, request fewer projects
      const isDashboard = get().projects.length === 0; // First load likely dashboard
      const params = isDashboard ? '?limit=5' : '';
      
      const response = await apiService.get<ApiResponse<Project[]>>(`/api/projects${params}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch projects');
      }
      
      const projects = response.data || []; // Ensure we always return an array, even if data is null/undefined
      
      // Update cache
      apiCache.set(cacheKey, projects, CACHE_DURATION);
      
      // Update state
      set({ 
        projects,
        projectsLoading: false,
        lastFetched: { ...get().lastFetched, [cacheKey]: now }
      });
      
      return projects;
      
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      set({ 
        projectsError: error.message || 'Failed to fetch projects', 
        projectsLoading: false 
      });
      return []; // Return empty array instead of null on error
    }
  },
  fetchProject: async (projectId: string, forceRefresh = false) => {
    const cacheKey = `project:${projectId}`;
    const now = Date.now();
    const lastFetch = get().lastFetched[cacheKey];
    
    // Check cache first
    if (!forceRefresh && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      const cached = apiCache.get<Project>(cacheKey);
      if (cached) {
        set({ currentProject: cached });
        return cached;
      }
    }
    
    try {
      set({ projectsLoading: true, projectsError: null });
      
      const response = await apiService.get<ApiResponse<Project>>(`/api/projects/${projectId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch project');
      }
      
      const project = response.data;
      
      // Update cache
      apiCache.set(cacheKey, project, CACHE_DURATION);
      
      set({ 
        currentProject: project, 
        projectsLoading: false,
        lastFetched: { ...get().lastFetched, [cacheKey]: now }
      });
      
      return project;
      
    } catch (error: any) {
      console.error('Error fetching project:', error);
      set({ 
        projectsError: error.message || 'Failed to fetch project', 
        projectsLoading: false 
      });
      return null;
    }
  },
  
  createProject: async (data) => {
    try {
      set({ projectsLoading: true, projectsError: null });
      
      const response = await apiService.post<ApiResponse<Project>>('/api/projects', data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create project');
      }
      
      const newProject = response.data;
      
      // Add to projects list and invalidate cache
      set(state => ({
        projects: [newProject, ...state.projects],
        projectsLoading: false
      }));
      
      get().invalidateCache('projects');
      
      return newProject;
      
    } catch (error: any) {
      console.error('Error creating project:', error);
      set({ 
        projectsError: error.message || 'Failed to create project', 
        projectsLoading: false 
      });
      return null;
    }
  },
  
  updateProject: async (projectId, data) => {
    try {
      set({ projectsLoading: true, projectsError: null });
      
      const response = await apiService.put<ApiResponse<Project>>(`/api/projects/${projectId}`, data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update project');
      }
      
      const updatedProject = response.data;
      
      // Update in projects list and current project
      set(state => ({
        projects: state.projects.map(p => p.id === projectId ? updatedProject : p),
        currentProject: state.currentProject?.id === projectId ? updatedProject : state.currentProject,
        projectsLoading: false
      }));
      
      // Invalidate relevant caches
      apiCache.delete(`project:${projectId}`);
      get().invalidateCache('projects');
      
      return updatedProject;
      
    } catch (error: any) {
      console.error('Error updating project:', error);
      set({ 
        projectsError: error.message || 'Failed to update project', 
        projectsLoading: false 
      });
      return null;
    }
  },
  
  deleteProject: async (projectId) => {
    try {
      set({ projectsLoading: true, projectsError: null });
      
      const response = await apiService.delete<ApiResponse<void>>(`/api/projects/${projectId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete project');
      }
      
      // Remove from projects list and clear if current
      set(state => ({
        projects: state.projects.filter(p => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        projectsLoading: false
      }));
      
      // Clear all related data
      get().clearWorkspaceData(projectId);
      
      return true;
      
    } catch (error: any) {
      console.error('Error deleting project:', error);
      set({ 
        projectsError: error.message || 'Failed to delete project', 
        projectsLoading: false 
      });
      return false;
    }
  },

      // === WORKSPACE OPERATIONS ===
      loadWorkspace: async (projectId, options = {}) => {
        const cacheKey = `workspace:${projectId}`;
        const now = Date.now();
        const lastFetch = get().lastFetched[cacheKey];
        
        // Check cache first
        if (lastFetch && (now - lastFetch) < WORKSPACE_CACHE_DURATION) {
          const cached = apiCache.get<WorkspaceData>(cacheKey);
          if (cached) {
            set(state => ({
              workspaceData: { ...state.workspaceData, [projectId]: cached }
            }));
            return cached;
          }
        }
        
        try {
          set(state => ({
            workspaceLoading: { ...state.workspaceLoading, [projectId]: true },
            workspaceError: { ...state.workspaceError, [projectId]: null }
          }));
          
          // Build query params
          const params = new URLSearchParams({
            workspace: 'true',
            include_messages: (options.includeMessages ?? true).toString(),
            message_limit: (options.messageLimit ?? 50).toString(),
            include_documents: (options.includeDocuments ?? true).toString(),
            include_settings: (options.includeSettings ?? true).toString(),
          });
          
          const response = await apiService.get<ApiResponse<WorkspaceData>>(
            `/api/projects/${projectId}?${params.toString()}`
          );
          
          if (!response.success) {
            throw new Error(response.error || 'Failed to load workspace');
          }
          
          const workspaceData = response.data;
          
          // Update cache
          apiCache.set(cacheKey, workspaceData, WORKSPACE_CACHE_DURATION);
          
          // Update state
          set(state => ({
            workspaceData: { ...state.workspaceData, [projectId]: workspaceData },
            currentProject: workspaceData.project,
            workspaceLoading: { ...state.workspaceLoading, [projectId]: false },
            lastFetched: { ...state.lastFetched, [cacheKey]: now }
          }));
          
          // Also cache individual components if they exist
          if (workspaceData.settings) {
            set(state => ({
              settings: { ...state.settings, [projectId]: workspaceData.settings }
            }));
          }
          
          if (workspaceData.instructions) {
            set(state => ({
              instructions: { ...state.instructions, [projectId]: workspaceData.instructions }
            }));
          }
          
          return workspaceData;
          
        } catch (error: any) {
          console.error('Error loading workspace:', error);
          set(state => ({
            workspaceError: { 
              ...state.workspaceError, 
              [projectId]: error.message || 'Failed to load workspace' 
            },
            workspaceLoading: { ...state.workspaceLoading, [projectId]: false }
          }));
          return null;
        }
      },
  
  // === SETTINGS OPERATIONS ===
  fetchSettings: async (projectId, forceRefresh = false) => {
    const cacheKey = `settings:${projectId}`;
    const now = Date.now();
    const lastFetch = get().lastFetched[cacheKey];
    
    // Check cache first
    if (!forceRefresh && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      const cached = apiCache.get<ProjectSettings>(cacheKey);
      if (cached) {
        set(state => ({
          settings: { ...state.settings, [projectId]: cached }
        }));
        return cached;
      }
    }
    
    try {
      set(state => ({
        settingsLoading: { ...state.settingsLoading, [projectId]: true },
        settingsError: { ...state.settingsError, [projectId]: null }
      }));
      
      const response = await apiService.get<ApiResponse<{settings: ProjectSettings}>>(
        `/api/projects/${projectId}/settings`
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch settings');
      }
      
      const settings = { ...DEFAULT_SETTINGS, ...response.data.settings };
      
      // Update cache
      apiCache.set(cacheKey, settings, CACHE_DURATION);
      
      set(state => ({
        settings: { ...state.settings, [projectId]: settings },
        settingsLoading: { ...state.settingsLoading, [projectId]: false },
        lastFetched: { ...state.lastFetched, [cacheKey]: now }
      }));
      
      return settings;
      
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      set(state => ({
        settingsError: { 
          ...state.settingsError, 
          [projectId]: error.message || 'Failed to fetch settings' 
        },
        settingsLoading: { ...state.settingsLoading, [projectId]: false }
      }));
      return DEFAULT_SETTINGS;
    }
  },
  
  updateSettings: async (projectId, newSettings) => {
    const currentSettings = get().settings[projectId] || DEFAULT_SETTINGS;
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    try {
      set(state => ({
        settingsLoading: { ...state.settingsLoading, [projectId]: true },
        settingsError: { ...state.settingsError, [projectId]: null }
      }));
      
      const response = await apiService.put<ApiResponse<{settings: ProjectSettings}>>(
        `/api/projects/${projectId}/settings`,
        { settings: updatedSettings }
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update settings');
      }
      
      // Update cache and state
      const cacheKey = `settings:${projectId}`;
      apiCache.set(cacheKey, updatedSettings, CACHE_DURATION);
      
      set(state => ({
        settings: { ...state.settings, [projectId]: updatedSettings },
        settingsLoading: { ...state.settingsLoading, [projectId]: false }
      }));
      
      return true;
      
    } catch (error: any) {
      console.error('Error updating settings:', error);
      set(state => ({
        settingsError: { 
          ...state.settingsError, 
          [projectId]: error.message || 'Failed to update settings' 
        },
        settingsLoading: { ...state.settingsLoading, [projectId]: false }
      }));
      return false;
    }
  },
  
  updateSetting: async (projectId, key, value) => {
    return get().updateSettings(projectId, { [key]: value });
  },
  
  setJurisdiction: async (projectId, jurisdiction) => {
    const jurisdictionData = jurisdiction ? {
      id: jurisdiction.id,
      name: jurisdiction.name,
      country: jurisdiction.country,
      state: jurisdiction.state,
      legalSystem: jurisdiction.legalSystem,
      citationStyle: jurisdiction.citationStyle
    } : undefined;
    
    return get().updateSettings(projectId, { jurisdiction: jurisdictionData });
  },
  
  // === INSTRUCTIONS OPERATIONS ===
  fetchInstructions: async (projectId, forceRefresh = false) => {
    const cacheKey = `instructions:${projectId}`;
    const now = Date.now();
    const lastFetch = get().lastFetched[cacheKey];
    
    // Check cache first
    if (!forceRefresh && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      const cached = apiCache.get<string>(cacheKey);
      if (cached !== null) {
        set(state => ({
          instructions: { ...state.instructions, [projectId]: cached }
        }));
        return cached;
      }
    }
    
    try {
      set(state => ({
        instructionsLoading: { ...state.instructionsLoading, [projectId]: true },
        instructionsError: { ...state.instructionsError, [projectId]: null }
      }));
      
      const response = await apiService.get<ApiResponse<{instructions: string}>>(
        `/api/projects/${projectId}/instructions`
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch instructions');
      }
      
      const instructions = response.data.instructions || '';
      
      // Update cache
      apiCache.set(cacheKey, instructions, CACHE_DURATION);
      
      set(state => ({
        instructions: { ...state.instructions, [projectId]: instructions },
        instructionsLoading: { ...state.instructionsLoading, [projectId]: false },
        lastFetched: { ...state.lastFetched, [cacheKey]: now }
      }));
      
      return instructions;
      
    } catch (error: any) {
      console.error('Error fetching instructions:', error);
      set(state => ({
        instructionsError: { 
          ...state.instructionsError, 
          [projectId]: error.message || 'Failed to fetch instructions' 
        },
        instructionsLoading: { ...state.instructionsLoading, [projectId]: false }
      }));
      return '';
    }
  },
  
  saveInstructions: async (projectId, instructions) => {
    try {
      set(state => ({
        instructionsLoading: { ...state.instructionsLoading, [projectId]: true },
        instructionsError: { ...state.instructionsError, [projectId]: null }
      }));
      
      const response = await apiService.put<ApiResponse<{instructions: string}>>(
        `/api/projects/${projectId}/instructions`,
        { instructions }
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to save instructions');
      }
      
      // Update cache and state
      const cacheKey = `instructions:${projectId}`;
      apiCache.set(cacheKey, instructions, CACHE_DURATION);
      
      set(state => ({
        instructions: { ...state.instructions, [projectId]: instructions },
        instructionsLoading: { ...state.instructionsLoading, [projectId]: false }
      }));
      
      return true;
      
    } catch (error: any) {
      console.error('Error saving instructions:', error);
      set(state => ({
        instructionsError: { 
          ...state.instructionsError, 
          [projectId]: error.message || 'Failed to save instructions' 
        },
        instructionsLoading: { ...state.instructionsLoading, [projectId]: false }
      }));
      return false;
    }
  },
  
  // === STATE MANAGEMENT ===
  setCurrentProject: (project) => {
    set({ currentProject: project });
  },
  
  clearWorkspaceData: (projectId) => {
    if (projectId) {
      // Clear specific project data
      set(state => {
        const newWorkspaceData = { ...state.workspaceData };
        const newWorkspaceLoading = { ...state.workspaceLoading };
        const newWorkspaceError = { ...state.workspaceError };
        const newSettings = { ...state.settings };
        const newSettingsLoading = { ...state.settingsLoading };
        const newSettingsError = { ...state.settingsError };
        const newInstructions = { ...state.instructions };
        const newInstructionsLoading = { ...state.instructionsLoading };
        const newInstructionsError = { ...state.instructionsError };
        
        delete newWorkspaceData[projectId];
        delete newWorkspaceLoading[projectId];
        delete newWorkspaceError[projectId];
        delete newSettings[projectId];
        delete newSettingsLoading[projectId];
        delete newSettingsError[projectId];
        delete newInstructions[projectId];
        delete newInstructionsLoading[projectId];
        delete newInstructionsError[projectId];
        
        return {
          workspaceData: newWorkspaceData,
          workspaceLoading: newWorkspaceLoading,
          workspaceError: newWorkspaceError,
          settings: newSettings,
          settingsLoading: newSettingsLoading,
          settingsError: newSettingsError,
          instructions: newInstructions,
          instructionsLoading: newInstructionsLoading,
          instructionsError: newInstructionsError,
          currentProject: state.currentProject?.id === projectId ? null : state.currentProject
        };
      });
      
      // Clear related caches
      get().invalidateCache(projectId);
    } else {
      // Clear all workspace data
      set({
        workspaceData: {},
        workspaceLoading: {},
        workspaceError: {},
        settings: {},
        settingsLoading: {},
        settingsError: {},
        instructions: {},
        instructionsLoading: {},
        instructionsError: {},
        currentProject: null
      });
      
      get().invalidateCache();
    }
  },
  
  invalidateCache: (scope) => {
    if (!scope) {
      // Clear all caches
      apiCache.clear();
      set({ lastFetched: {} });
    } else if (scope === 'projects') {
      // Clear project-related caches
      const state = get();
      const newLastFetched = { ...state.lastFetched };
      Object.keys(newLastFetched).forEach(key => {
        if (key.startsWith('projects:') || key.startsWith('project:')) {
          delete newLastFetched[key];
          apiCache.delete(key);
        }
      });
      set({ lastFetched: newLastFetched });
    } else if (scope === 'workspace') {
      // Clear all workspace caches
      const state = get();
      const newLastFetched = { ...state.lastFetched };
      Object.keys(newLastFetched).forEach(key => {
        if (key.startsWith('workspace:')) {
          delete newLastFetched[key];
          apiCache.delete(key);
        }
      });
      set({ lastFetched: newLastFetched });
    } else if (scope === 'settings') {
      // Clear all settings caches
      const state = get();
      const newLastFetched = { ...state.lastFetched };
      Object.keys(newLastFetched).forEach(key => {
        if (key.startsWith('settings:')) {
          delete newLastFetched[key];
          apiCache.delete(key);
        }
      });
      set({ lastFetched: newLastFetched });
    } else if (scope === 'instructions') {
      // Clear all instructions caches
      const state = get();
      const newLastFetched = { ...state.lastFetched };
      Object.keys(newLastFetched).forEach(key => {
        if (key.startsWith('instructions:')) {
          delete newLastFetched[key];
          apiCache.delete(key);
        }
      });
      set({ lastFetched: newLastFetched });
    } else {
      // Clear specific project cache
      const projectId = scope;
      const keysToDelete = [
        `project:${projectId}`,
        `workspace:${projectId}`,
        `settings:${projectId}`,
        `instructions:${projectId}`
      ];
      
      const state = get();
      const newLastFetched = { ...state.lastFetched };
      
      keysToDelete.forEach(key => {
        delete newLastFetched[key];
        apiCache.delete(key);
      });
      
      set({ lastFetched: newLastFetched });
    }
  },
}));

// Export helper functions for use outside the store
export const workspaceUtils = {
  // Get project settings with fallback to defaults
  getProjectSettings: (projectId: string): ProjectSettings => {
    const store = useWorkspaceStore.getState();
    return store.settings[projectId] || DEFAULT_SETTINGS;
  },
  
  // Get project instructions with fallback to empty string
  getProjectInstructions: (projectId: string): string => {
    const store = useWorkspaceStore.getState();
    return store.instructions[projectId] || '';
  },
  
  // Check if workspace data is loaded
  isWorkspaceLoaded: (projectId: string): boolean => {
    const store = useWorkspaceStore.getState();
    return !!store.workspaceData[projectId];
  },
  
  // Check if any data is loading for a project
  isProjectLoading: (projectId: string): boolean => {
    const store = useWorkspaceStore.getState();
    return store.projectsLoading ||
           store.workspaceLoading[projectId] ||
           store.settingsLoading[projectId] ||
           store.instructionsLoading[projectId] ||
           false;
  },
  
  // Get all errors for a project
  getProjectErrors: (projectId: string): string[] => {
    const store = useWorkspaceStore.getState();
    const errors: string[] = [];
    
    if (store.projectsError) errors.push(store.projectsError);
    if (store.workspaceError[projectId]) errors.push(store.workspaceError[projectId]);
    if (store.settingsError[projectId]) errors.push(store.settingsError[projectId]);
    if (store.instructionsError[projectId]) errors.push(store.instructionsError[projectId]);
    
    return errors.filter(Boolean);
  },
  
  // Preload workspace data (useful for prefetching)
  preloadWorkspace: async (projectId: string): Promise<void> => {
    const store = useWorkspaceStore.getState();
    
    // Load in parallel for better performance
    await Promise.allSettled([
      store.loadWorkspace(projectId),
      store.fetchSettings(projectId),
      store.fetchInstructions(projectId),
    ]);
  },
  
  // Clear all data for a project (useful for cleanup)
  clearProjectData: (projectId: string): void => {
    const store = useWorkspaceStore.getState();
    store.clearWorkspaceData(projectId);
  },
};