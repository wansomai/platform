// src/hooks/useDocuments.ts
import { useState } from 'react'
import api from '@/lib/api'
import { useDocumentsStore } from '@/store/documents.store'

export function useDocuments(projectId: string) {
  const { 
    setDocuments, 
    addDocument, 
    removeDocument, 
    setLoading, 
    setError 
  } = useDocumentsStore()
  const [uploadProgress, setUploadProgress] = useState(0)

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/projects/${projectId}/documents`)
      setDocuments(response.data.data)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }

  const uploadDocument = async (file: File, section: string) => {
    try {
      setError(null)
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post(
        `/projects/${projectId}/documents/${section}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0
            setUploadProgress(progress)
          }
        }
      )

      addDocument(response.data.data)
      return response.data.data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to upload document')
      throw error
    } finally {
      setUploadProgress(0)
    }
  }

  const deleteDocument = async (documentId: string) => {
    try {
      setError(null)
      await api.delete(`/projects/${projectId}/documents/${documentId}`)
      removeDocument(documentId)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete document')
      throw error
    }
  }

  return {
    uploadDocument,
    deleteDocument,
    fetchDocuments,
    uploadProgress
  }
}