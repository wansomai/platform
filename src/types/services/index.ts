// Service-related types and interfaces

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface OCROptions {
  language?: string;
  confidence?: number;
  extractTables?: boolean;
  extractImages?: boolean;
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface IntentAnalysis {
  intent: string;
  confidence: number;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  category: 'legal' | 'business' | 'personal' | 'other';
}

export interface FileUploadOptions {
  maxSize: number;
  allowedTypes: string[];
  multiple?: boolean;
  compress?: boolean;
}

export interface FileUploadState {
  files: File[];
  progress: { [key: string]: number };
  errors: { [key: string]: string };
  isUploading: boolean;
}

export interface FileUploadActions {
  addFiles: (files: FileList) => void;
  removeFile: (index: number) => void;
  uploadFiles: () => Promise<void>;
  reset: () => void;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}