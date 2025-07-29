// src/hooks/useWorkspace.ts 
import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { useProjectStore } from '@/store/project.store';

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface WorkspaceData {
  project: any;
  currentConversation: any;
  messages: any[];
  documents: any[];
  meta: any;
}

// Global cache to prevent duplicate requests
const workspaceCache = new Map<string, {
  data: WorkspaceData | null;
  loading: boolean;
  error: string | null;
  promise: Promise<any> | null;
}>();

export function useWorkspace(projectId: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  
  const { setCurrentProject } = useProjectStore();
  
  useEffect(() => {
    if (!projectId) return;
    
    // Check if we already have this data cached
    const cached = workspaceCache.get(projectId);
    if (cached) {
      setIsLoading(cached.loading);
      setError(cached.error);
      setWorkspaceData(cached.data);
      
      if (cached.data?.project) {
        setCurrentProject(cached.data.project);
      }
      
      // If already loading, wait for the existing promise
      if (cached.loading && cached.promise) {
        cached.promise.then(() => {
          const updated = workspaceCache.get(projectId);
          if (updated) {
            setIsLoading(updated.loading);
            setError(updated.error);
            setWorkspaceData(updated.data);
            if (updated.data?.project) {
              setCurrentProject(updated.data.project);
            }
          }
        });
        return;
      }
      
      // If we have data and no error, don't refetch
      if (cached.data && !cached.error) {
        return;
      }
    }
    
    const loadWorkspace = async () => {
      try {
        // Set loading state in cache and local state
        workspaceCache.set(projectId, {
          data: null,
          loading: true,
          error: null,
          promise: null
        });
        setIsLoading(true);
        setError(null);
        
        // Updated API call - removed include_settings parameter
        const promise = apiService.get<ApiResponse<WorkspaceData>>(`/api/projects/${projectId}`, {
          params: {
            workspace: 'true',
            include_messages: 'true',
            message_limit: '50',
            include_documents: 'true',
            // Removed: include_settings: 'true'
          }
        });
        
        // Store the promise in cache
        workspaceCache.set(projectId, {
          data: null,
          loading: true,
          error: null,
          promise
        });
        
        const response = await promise;
        const data = response.data;
        
        // Update cache
        workspaceCache.set(projectId, {
          data,
          loading: false,
          error: null,
          promise: null
        });
        
        setWorkspaceData(data);
        setCurrentProject(data.project);
        
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to load workspace';
        
        // Update cache with error
        workspaceCache.set(projectId, {
          data: null,
          loading: false,
          error: errorMessage,
          promise: null
        });
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWorkspace();
  }, [projectId, setCurrentProject]);
  
  const { currentProject } = useProjectStore();
  
  return {
    // Core workspace data only
    project: currentProject,
    workspaceData,
    messages: workspaceData?.messages || [],
    documents: workspaceData?.documents || [],
    currentConversation: workspaceData?.currentConversation,
    isLoading,
    error,
  };
}