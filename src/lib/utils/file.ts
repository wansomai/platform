// lib/utils/file.ts - Centralized file utility functions
import React from "react";
import { FileText, FileSpreadsheet, FileImage, File as FileIcon } from "lucide-react";

/**
 * Format file size in bytes to human-readable format
 * Standardized version used across the application
 */
export function formatFileSize(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}



/**
 * Alternative format function for backward compatibility
 * @deprecated Use formatFileSize instead
 */
export const formatBytes = formatFileSize;

/**
 * Get file icon component based on file type/extension
 */
export function getFileIcon(fileType: string, className: string = "h-4 w-4"): React.ReactElement {
  const type = fileType.toLowerCase();
  
  switch (type) {
    case 'pdf':
      return React.createElement(FileText, { className: `${className} text-red-500` });
    case 'xlsx':
    case 'xls':
    case 'csv':
      return React.createElement(FileSpreadsheet, { className: `${className} text-green-600` });
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return React.createElement(FileImage, { className: `${className} text-blue-500` });
    case 'doc':
    case 'docx':
      return React.createElement(FileIcon, { className: `${className} text-blue-600` });
    case 'txt':
    case 'rtf':
      return React.createElement(FileIcon, { className: `${className} text-gray-600` });
    default:
      return React.createElement(FileIcon, { className: `${className} text-gray-500` });
  }
}



/**
 * Get file type color class for styling
 */
export function getFileTypeColor(fileType: string): string {
  const type = fileType.toLowerCase();
  
  switch (type) {
    case 'pdf':
      return 'text-red-500';
    case 'xlsx':
    case 'xls':
    case 'csv':
      return 'text-green-600';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'text-blue-500';
    case 'doc':
    case 'docx':
      return 'text-blue-600';
    case 'txt':
    case 'rtf':
      return 'text-gray-600';
    default:
      return 'text-gray-500';
  }
}

/**
 * Check if file type is an image
 */
export function isImageFile(fileType: string): boolean {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  return imageTypes.includes(fileType.toLowerCase());
}

/**
 * Check if file type is a document
 */
export function isDocumentFile(fileType: string): boolean {
  const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
  return documentTypes.includes(fileType.toLowerCase());
}

/**
 * Check if file type is a spreadsheet
 */
export function isSpreadsheetFile(fileType: string): boolean {
  const spreadsheetTypes = ['xlsx', 'xls', 'csv', 'ods'];
  return spreadsheetTypes.includes(fileType.toLowerCase());
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Validate file size against maximum allowed
 */
export function validateFileSize(fileSize: number, maxSize: number = 5 * 1024 * 1024): {
  isValid: boolean;
  error?: string;
} {
  if (fileSize > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${formatFileSize(maxSize)} limit. Please select a smaller file or upgrade your plan.`
    };
  }
  
  return { isValid: true };
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    
    // Spreadsheets
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Generate a safe filename by removing/replacing invalid characters
 */
export function sanitizeFileName(fileName: string): string {
  // Remove or replace invalid characters
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid chars with underscore
    .replace(/\s+/g, '_')          // Replace spaces with underscore
    .replace(/_+/g, '_')           // Replace multiple underscores with single
    .replace(/^_|_$/g, '')         // Remove leading/trailing underscores
    .substring(0, 255);            // Limit length to 255 characters
}

/**
 * File upload progress formatter
 */
export function formatUploadProgress(progress: number): string {
  return `${Math.round(progress)}%`;
}

/**
 * Constants for file operations
 */
export const FILE_CONSTANTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    'pdf', 'doc', 'docx', 'txt', 'rtf',
    'xls', 'xlsx', 'csv',
    'jpg', 'jpeg', 'png', 'gif', 'webp'
  ],
  MAX_FILENAME_LENGTH: 255,
} as const;

/**
 * Validate file type and size
 */
export function validateFile(
  file: File, 
  allowedTypes?: string[], 
  maxSize?: number
): { isValid: boolean; error?: string } {
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`
    };
  }
  
  if (maxSize && file.size > maxSize) {
    return {
      isValid: false,
      error: `File size ${formatFileSize(file.size)} exceeds limit of ${formatFileSize(maxSize)}`
    };
  }
  
  return { isValid: true };
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png'
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}

/**
 * Document categories for classification
 */
export const DOCUMENT_CATEGORIES = [
  { id: "evidence", label: "Evidence" },
  { id: "pleadings", label: "Pleadings" },
  { id: "correspondence", label: "Correspondence" },
  { id: "contracts", label: "Contracts" },
  { id: "research", label: "Research" },
  { id: "discovery", label: "Discovery" },
  { id: "motions", label: "Motions" },
  { id: "briefs", label: "Briefs" },
  { id: "expert", label: "Expert Reports" },
  { id: "exhibits", label: "Exhibits" },
  { id: "other", label: "Other" },
] as const;