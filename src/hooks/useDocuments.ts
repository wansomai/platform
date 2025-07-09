// src/hooks/useDocuments.ts
import { useState } from 'react'
import api from '@/lib/api'
import { useDocumentsStore } from '@/store/documents.store'
import { useConversationDocumentsStore } from '@/store/conversation-documents.store'
import { useUIStore } from '@/store/ui.store'

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
    addDocument, 
    removeDocument, 
    setLoading, 
    setError,
    uploadDocument: storeUploadDocument,
    deleteDocument: storeDeleteDocument
  } = useDocumentsStore();
  
  const { 
    attachDocumentsToConversation,
    removeDocumentFromConversation
  } = useConversationDocumentsStore();
  
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
      const response = await api.get(`/projects/${projectId}/documents`);
      setDocuments(response.data.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch documents';
      setError(errorMessage);
      handleError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced upload function
  const uploadDocument = async (file: File, section?: string, folderId?: string) => {
    try {
      setError(null);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);
      
      if (section) formData.append('section', section);
      if (folderId) formData.append('folderId', folderId);
      if (projectId) formData.append('projectId', projectId);

      // Use store upload method with progress tracking
      const document = await storeUploadDocument(formData, (progress) => {
        setUploadProgress(progress);
      });

      handleSuccess(`${file.name} uploaded successfully`);
      return document;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload document';
      handleError(errorMessage);
      throw error;
    } finally {
      setUploadProgress(0);
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
        const success = await attachDocumentsToConversation(convId, [document.id]);
        
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
      const success = await attachDocumentsToConversation(convId, documentIds);
      
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
      const success = await removeDocumentFromConversation(convId, documentId);
      
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
      
      const response = await fetch(`/api/documents/${documentId}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
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