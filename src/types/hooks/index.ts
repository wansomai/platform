// Custom hook types and interfaces

export interface UseDocumentsOptions {
  folderId?: string;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface UseDocumentsReturn {
  documents: any[];
  folders: any[];
  isLoading: boolean;
  error: string | null;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  uploadDocument: (file: File, folderId?: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

export interface UseProjectsOptions {
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  status?: 'active' | 'archived' | 'all';
}

export interface UseProjectsReturn {
  projects: any[];
  currentProject: any | null;
  isLoading: boolean;
  error: string | null;
  createProject: (data: any) => Promise<void>;
  updateProject: (projectId: string, data: any) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setCurrentProject: (project: any) => void;
}

export interface UseAuthReturn {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface UseFileUploadReturn {
  files: File[];
  uploadState: {
    isUploading: boolean;
    progress: { [key: string]: number };
    errors: { [key: string]: string };
  };
  actions: {
    addFiles: (files: FileList) => void;
    removeFile: (index: number) => void;
    uploadFiles: () => Promise<void>;
    reset: () => void;
  };
}

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  totalItems?: number;
}

export interface UsePaginationReturn {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
}