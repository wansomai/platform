// src/hooks/useDocuments.ts
import { useState } from 'react'
import api, { apiService } from '@/lib/api'
import { useDocumentsStore } from '@/store/documents.store'
import { useProjectDocumentsStore } from '@/store/workspace-documents.store'
import { useUIStore } from '@/store/ui.store'
import { formatFileSize, validateFile } from '@/lib/utils/file'
import { formatRelativeTime } from '@/lib/utils/date'
import { cleanTextContent, formatSearchQuery, containsSearchTerm } from '@/lib/utils/text'
import {ALLOWED_FILE_TYPES, FILE_UPLOAD_CONFIG} from '@/lib/utils/constants'

export interface UseDocumentsOptions {
  projectId?: string;
  conversationId?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function useDocuments(options: UseDocumentsOptions = {}) {
  const { projectId, conversationId, onSuccess, onError } = options;
  
  const { 
    setDocuments, 
    setLoading, 
    setError,
    addDocument,
    uploadDocument: storeUploadDocument,
    deleteDocument: storeDeleteDocument
  } = useDocumentsStore();
  
  const { 
    attachDocumentsToProject,
    removeDocumentFromProject
  } = useProjectDocumentsStore();
  
  const { addToast } = useUIStore();
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper functions
  const handleSuccess = (message: string) => {
    addToast({ message, type: 'success' });
    onSuccess?.(message);
  };

  const handleError = (error: string) => {
    addToast({ message: error, type: 'error' });
    onError?.(error);
  };

  // Legacy fetch function (keeping for backward compatibility)
  const fetchDocuments = async () => {
    if (!projectId) {
      handleError('Project ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(`/projects/${projectId}/documents`);
      const res = response as { data: { data: any[] } };
      setDocuments(res.data.data);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch documents';
      setError(errorMessage);
      handleError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // upload function
const uploadDocument = async (file: File, section?: string, folderId?: string) => {
    const validation = validateFile(file, ALLOWED_FILE_TYPES, FILE_UPLOAD_CONFIG.MAX_SIZE);
    
    if (!validation.isValid) {
      handleError(validation.error || 'Invalid file');
      return null;
    }
    
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append('file', file);
      if (section) formData.append('section', section);
      if (folderId) formData.append('folderId', folderId);
      
      const response = await api.post(`/projects/${projectId}/documents`, formData);
      const document = response.data;
      
      addDocument(document);
      handleSuccess(`${file.name} uploaded successfully`);
      
      return document;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Upload failed';
      handleError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload and attach to conversation
  const uploadAndAttach = async (file: File, targetConversationId?: string, folderId?: string) => {
    const convId = targetConversationId || conversationId;
    if (!convId) {
      handleError('Conversation ID is required');
      return null;
    }

    try {
      // First upload the document
      const document = await uploadDocument(file, undefined, folderId);
      
      if (document) {
        // Then attach it to the conversation
        const success = await attachDocumentsToProject(convId, [document.id]);
        
        if (success) {
          handleSuccess(`${file.name} uploaded and added to conversation`);
        } else {
          handleError('Document uploaded but failed to add to conversation');
        }
        
        return document;
      }
    } catch (error) {
      throw error;
    }
  };

  // Enhanced delete function
  const deleteDocument = async (documentId: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      const success = await storeDeleteDocument(documentId);
      
      if (success) {
        handleSuccess('Document deleted successfully');
        // Remove from selection if selected
        setSelectedDocuments(prev => prev.filter(id => id !== documentId));
      } else {
        handleError('Failed to delete document');
      }
      
      return success;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete document';
      handleError(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Document selection management
  const selectDocument = (documentId: string) => {
    setSelectedDocuments(prev => [...prev, documentId]);
  };

  const unselectDocument = (documentId: string) => {
    setSelectedDocuments(prev => prev.filter(id => id !== documentId));
  };

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  // Conversation operations
  const attachToConversation = async (documentIds: string[], targetConversationId?: string) => {
    const convId = targetConversationId || conversationId;
    if (!convId) {
      handleError('Conversation ID is required');
      return false;
    }

    try {
      setIsProcessing(true);
      const success = await attachDocumentsToProject(convId, documentIds);
      
      if (success) {
        const count = documentIds.length;
        handleSuccess(`${count} document${count > 1 ? 's' : ''} added to conversation`);
        clearSelection();
      } else {
        handleError('Failed to add documents to conversation');
      }

      return success;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to add documents';
      handleError(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFromConversation = async (documentId: string, targetConversationId?: string) => {
    const convId = targetConversationId || conversationId;
    if (!convId) {
      handleError('Conversation ID is required');
      return false;
    }

    try {
      setIsProcessing(true);
      const success = await removeDocumentFromProject(convId, documentId);
      
      if (success) {
        handleSuccess('Document removed from conversation');
      } else {
        handleError('Failed to remove document from conversation');
      }

      return success;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to remove document';
      handleError(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk operations
  const attachSelectedToConversation = async (targetConversationId?: string) => {
    if (selectedDocuments.length === 0) {
      handleError('No documents selected');
      return false;
    }

    return await attachToConversation(selectedDocuments, targetConversationId);
  };

  const deleteSelectedDocuments = async () => {
    if (selectedDocuments.length === 0) {
      handleError('No documents selected');
      return false;
    }

    try {
      setIsProcessing(true);
      
      const deletePromises = selectedDocuments.map(id => storeDeleteDocument(id));
      const results = await Promise.allSettled(deletePromises);
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (successful > 0) {
        handleSuccess(`${successful} document${successful > 1 ? 's' : ''} deleted successfully`);
      }
      
      if (failed > 0) {
        handleError(`Failed to delete ${failed} document${failed > 1 ? 's' : ''}`);
      }

      clearSelection();
      return failed === 0;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete documents';
      handleError(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Download document
  const downloadDocument = async (documentId: string, fileName: string) => {
    try {
      setIsProcessing(true);

      const blob = await apiService.downloadFile(`/api/documents/${documentId}/download`);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      handleSuccess(`${fileName} downloaded successfully`);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to download document';
      handleError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

   const filterDocuments = (documents: any[], searchTerm: string, category: string) => {
    let filtered = documents;
    
    if (searchTerm) {
      const query = formatSearchQuery(searchTerm);
      filtered = filtered.filter(doc => 
        containsSearchTerm(doc.title, query) || 
        containsSearchTerm(doc.description || '', query)
      );
    }
    
    if (category && category !== 'all') {
      filtered = filtered.filter(doc => doc.category === category);
    }
    
    return filtered;
  };

  return {
    // Legacy functions (backward compatibility)
    uploadDocument,
    deleteDocument,
    fetchDocuments,
    
    // Enhanced functions
    uploadAndAttach,
    attachToConversation,
    removeFromConversation,
    downloadDocument,
    filterDocuments,
    
    // Selection management
    selectedDocuments,
    selectDocument,
    unselectDocument,
    toggleDocumentSelection,
    clearSelection,
    
    // Bulk operations
    attachSelectedToConversation,
    deleteSelectedDocuments,
    
    // State
    uploadProgress,
    isProcessing
  };
}