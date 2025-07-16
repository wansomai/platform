export interface Document {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdBy: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  contentExtracted: boolean;
  
  // Optional fields for different contexts
  folderId?: string | null;
  addedAt?: string;       
  addedBy?: string;        
  category?: string;     
  tags?: string[];    
  processingStatus?: 'pending' | 'processing' | 'complete' | 'error';
  extractionProgress?: number;
  lastAccessed?: string;
}

export interface DocumentFilters {
  search?: string;
  type?: string;
  sort?: 'recent' | 'oldest' | 'name' | 'size';
  page?: number;
  limit?: number;
  folder?: string | null;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}