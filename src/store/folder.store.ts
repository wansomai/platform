// store/folder.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiService } from '@/lib/api';
import { Folder } from '@/types/documents';

interface FolderState {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Methods
  fetchFolders: (forceRefresh?: boolean) => Promise<Folder[]>;
  createFolder: (name: string, parentId: string | null) => Promise<Folder | null>;
  updateFolder: (id: string, name: string, parentId: string | null) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<boolean>;
  moveDocumentsToFolder: (folderId: string | null, documentIds: string[], renames?: { id: string; newTitle: string }[]) => Promise<boolean>;
  setFolders: (folders: Folder[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  invalidateCache: () => void;
}

export const useFolderStore = create<FolderState>()(
  persist(
    (set, get) => ({
      folders: [],
      isLoading: false,
      error: null,
      lastFetched: null,
      
      fetchFolders: async (forceRefresh = false) => {
        const state = get();
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000; // 10 minutes cache for folders
        
        // Check if we have recent folder data and don't need to refresh
        if (state.lastFetched && 
            (now - state.lastFetched) < tenMinutes && 
            state.folders.length > 0 && 
            !forceRefresh) {
          return state.folders;
        }
        
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiService.get<{ data: Folder[] }>('/api/folders');
          
          set({ 
            folders: response.data, 
            isLoading: false,
            lastFetched: now
          });
          
          return response.data;
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch folders', 
            isLoading: false 
          });
          // Return cached folders on error if available
          return state.folders;
        }
      },
      
      createFolder: async (name, parentId) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiService.post<{ data: Folder }>('/api/folders', {
            name,
            parentId
          });

          // Refresh folders to get the updated list with correct hierarchy
          await get().fetchFolders(true); // Force refresh

          set({ isLoading: false });
          return response.data;
        } catch (error: any) {
          // Extract the server's error message (e.g. "A folder named X already exists here")
          const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create folder';
          set({ error: message, isLoading: false });
          throw new Error(message); // rethrow so callers can surface the specific message
        }
      },

      updateFolder: async (id, name, parentId) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiService.put<{ data: Folder }>(`/api/folders/${id}`, {
            name,
            parentId
          });

          // Refresh folders to get the updated list with correct hierarchy
          await get().fetchFolders(true); // Force refresh

          set({ isLoading: false });
          return response.data;
        } catch (error: any) {
          const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update folder';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },
      
      deleteFolder: async (id) => {
        try {
          set({ isLoading: true, error: null });
          
          await apiService.delete(`/api/folders/${id}`);
          
          // Refresh folders
          await get().fetchFolders(true); // Force refresh
          
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to delete folder', 
            isLoading: false 
          });
          return false;
        }
      },
      
      moveDocumentsToFolder: async (folderId, documentIds, renames) => {
        try {
          set({ isLoading: true, error: null });

          const endpoint = folderId ? `/api/folders/${folderId}/documents` : '/api/folders/root/documents';

          await apiService.post(endpoint, {
            documentIds,
            ...(renames && renames.length > 0 ? { renames } : {})
          });
          
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to move documents', 
            isLoading: false 
          });
          return false;
        }
      },
      
      setFolders: (folders) => set({ 
        folders,
        lastFetched: Date.now()
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // Clear cache to force next fetch
      invalidateCache: () => {
        set({ lastFetched: null });
      }
    }),
    {
      name: 'folder-store', // Storage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        folders: state.folders,
        lastFetched: state.lastFetched,
      }),
      version: 2,
      // v2: folders now include createdBy and visibility — clear old cache
      migrate: () => ({ folders: [], lastFetched: null }),
    }
  )
);