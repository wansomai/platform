// store/folder.store.ts
import { create } from 'zustand';
import { apiService } from '@/lib/api';
import { Folder } from '@/types/documents';

interface FolderState {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  
  // Methods
  fetchFolders: () => Promise<Folder[]>;
  createFolder: (name: string, parentId: string | null) => Promise<Folder | null>;
  updateFolder: (id: string, name: string, parentId: string | null) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<boolean>;
  moveDocumentsToFolder: (folderId: string | null, documentIds: string[]) => Promise<boolean>;
  setFolders: (folders: Folder[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  isLoading: false,
  error: null,
  
  fetchFolders: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiService.get<{ data: Folder[] }>('/api/folders');
      set({ folders: response.data, isLoading: false });
      
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch folders', 
        isLoading: false 
      });
      return [];
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
      await get().fetchFolders();
      
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to create folder', 
        isLoading: false 
      });
      return null;
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
      await get().fetchFolders();
      
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update folder', 
        isLoading: false 
      });
      return null;
    }
  },
  
  deleteFolder: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      await apiService.delete(`/api/folders/${id}`);
      
      // Refresh folders
      await get().fetchFolders();
      
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
  
  moveDocumentsToFolder: async (folderId, documentIds) => {
    try {
      set({ isLoading: true, error: null });
      
      const endpoint = folderId ? `/api/folders/${folderId}/documents` : '/api/folders/root/documents';
      
      await apiService.post(endpoint, {
        documentIds
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
  
  setFolders: (folders) => set({ folders }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));