// hooks/useFileUpload.ts
import { useState, useRef, useCallback } from 'react';

export interface FileUploadOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  onFileSelect?: (file: File) => void;
  onError?: (error: string) => void;
  onSuccess?: (result: any) => void;
  multiple?: boolean;
}

export interface FileUploadState {
  file: File | null;
  files: File[];
  isDragOver: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

export interface FileUploadActions {
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  removeFile: (index?: number) => void;
  clearFiles: () => void;
  clearError: () => void;
  validateAndSetFile: (file: File) => boolean;
  triggerFileInput: () => void;
  setUploadProgress: (progress: number) => void;
  setUploading: (uploading: boolean) => void;
}

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES = [
  '.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.xls', '.jpg', '.jpeg', '.png'
];

export const useFileUpload = (options: FileUploadOptions = {}): FileUploadState & FileUploadActions => {
  const {
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    onFileSelect,
    onError,
    multiple = false
  } = options;

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<FileUploadState>({
    file: null,
    files: [],
    isDragOver: false,
    isUploading: false,
    uploadProgress: 0,
    error: null
  });

  // Validate file size and type
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit. Please upgrade your plan to upload larger files.`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();
    
    const isAllowedType = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExtension === type;
      }
      return mimeType.includes(type);
    });

    if (!isAllowedType) {
      return `File type not supported. Allowed types: ${allowedTypes.join(', ')}`;
    }

    return null;
  }, [maxFileSize, allowedTypes]);

  // Validate and set file
  const validateAndSetFile = useCallback((file: File): boolean => {
    const error = validateFile(file);
    
    if (error) {
      setState(prev => ({ ...prev, error, file: null }));
      onError?.(error);
      return false;
    }

    setState(prev => ({ 
      ...prev, 
      file: multiple ? prev.file : file,
      files: multiple ? [...prev.files, file] : [file],
      error: null 
    }));
    
    onFileSelect?.(file);
    return true;
  }, [validateFile, onFileSelect, multiple]);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setState(prev => ({ ...prev, file: null, files: [], error: null }));
      return;
    }

    if (multiple) {
      Array.from(files).forEach(file => {
        validateAndSetFile(file);
      });
    } else {
      validateAndSetFile(files[0]);
    }
  }, [validateAndSetFile, multiple]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragOver: true }));
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragOver: false }));
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragOver: false }));

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (multiple) {
        Array.from(files).forEach(file => {
          validateAndSetFile(file);
        });
      } else {
        validateAndSetFile(files[0]);
      }
    }
  }, [validateAndSetFile, multiple]);

  // Remove file
  const removeFile = useCallback((index?: number) => {
    if (multiple && typeof index === 'number') {
      setState(prev => ({
        ...prev,
        files: prev.files.filter((_, i) => i !== index),
        error: null
      }));
    } else {
      setState(prev => ({ 
        ...prev, 
        file: null, 
        files: [], 
        error: null 
      }));
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [multiple]);

  // Clear all files
  const clearFiles = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      file: null, 
      files: [], 
      error: null 
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Trigger file input click
  const triggerFileInput = useCallback(() => {
    if (!state.isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [state.isUploading]);

  // Set upload progress
  const setUploadProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, uploadProgress: progress }));
  }, []);

  // Set uploading state
  const setUploading = useCallback((uploading: boolean) => {
    setState(prev => ({ 
      ...prev, 
      isUploading: uploading,
      uploadProgress: uploading ? prev.uploadProgress : 0
    }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearFiles,
    clearError,
    validateAndSetFile,
    triggerFileInput,
    setUploadProgress,
    setUploading
  };
};

// Utility function for formatting file sizes
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Utility function for getting file icon based on extension
export const getFileTypeIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    pdf: '📄',
    doc: '📄',
    docx: '📄',
    txt: '📝',
    csv: '📊',
    xlsx: '📊',
    xls: '📊',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️'
  };

  return iconMap[extension || ''] || '📎';
};