// src/components/contract/ContractReviewInterface.tsx
"use client"

import React, { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { 
  FileText, 
  Upload, 
  X, 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Download,
  Eye,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUIStore } from '@/store/ui.store'
import { useChatStore } from '@/store/chat.store'
import { useProjectDocumentsStore } from '@/store/workspace-documents.store'
import { useSession } from 'next-auth/react'
import { DocumentViewer } from './DocumentViewer'
import { UploadDocumentModal } from '../modals/UploadModal'

interface ReviewDocument {
  id: string
  title: string
  fileName: string
  status: 'processing' | 'ready' | 'error'
  riskScore?: number
  uploadedAt: string
  fileSize: string
  type: string
  fileUrl?: string
  mimeType?: string
}

export const DocumentReviewInterface: React.FC = () => {
  const params = useParams()
  const projectId = params.id as string
  
  const [selectedDocument, setSelectedDocument] = useState<ReviewDocument | null>(null)
  const [documents, setDocuments] = useState<ReviewDocument[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  
  const { addToast } = useUIStore()
  const { currentConversation, sendMessage } = useChatStore()
  const { documents: projectDocuments, fetchProjectDocuments } = useProjectDocumentsStore()
  const { data: session } = useSession()

  // Handle documents uploaded through the modal
  const handleDocumentsAdded = async (documents: any[]) => {
    const count = documents.length
    
    // Convert uploaded documents for display
    const newDocuments: ReviewDocument[] = documents.map(doc => ({
      id: doc.id || crypto.randomUUID(),
      title: doc.title || doc.name || doc.filename || 'Untitled Document',
      fileName: doc.filename || doc.name || doc.title || 'Unknown file',
      status: 'ready' as const,
      riskScore: Math.floor(Math.random() * 10) + 1, // TODO: Replace with actual analysis
      uploadedAt: new Date().toISOString(),
      fileSize: doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(2) + ' MB' : (doc.size ? (doc.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'),
      type: doc.fileType || doc.type || 'Document',
      fileUrl: doc.fileUrl || doc.url || doc.path,
      mimeType: doc.fileType || doc.mimeType || doc.contentType || doc.type
    }))
    
    setDocuments(prev => [...newDocuments, ...prev])
    
    // Automatically select the first uploaded document for display
    if (newDocuments.length > 0) {
      const firstDocument = newDocuments[0]
      setSelectedDocument(firstDocument)
      
      // Send automatic document overview to chat
      if (currentConversation && sendMessage) {
        const overviewPrompt = `I've uploaded a document for review. The text content has been extracted and is available for analysis. Please provide an initial overview and analysis of this document, highlighting any key areas of concern, important points, and relevant insights I should be aware of.`
        
        try {
          await sendMessage(
            projectId,
            currentConversation.id,
            overviewPrompt,
            session?.user?.id,
            ''
          )
        } catch (error) {
          console.error('Failed to send automatic overview:', error)
        }
      }
    }
    
    addToast({
      message: `${count} document${count > 1 ? 's' : ''} added for review`,
      type: "success"
    })
    
    // Refresh project documents to keep vault in sync
    fetchProjectDocuments(projectId)
  }

  // Get risk level styling
  const getRiskLevel = (score?: number) => {
    if (!score) return { label: 'Unknown', color: 'bg-gray-100 text-gray-600' }
    if (score <= 3) return { label: 'Low', color: 'bg-green-100 text-green-700' }
    if (score <= 6) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' }
    return { label: 'High', color: 'bg-red-100 text-red-700' }
  }

  // Handle removing the current document and allowing upload of a new one
  const handleRemoveDocument = () => {
    if (selectedDocument) {
      // Remove the selected document from the list
      setDocuments(prev => prev.filter(document => document.id !== selectedDocument.id))
      // Clear the selected document
      setSelectedDocument(null)
      // Show upload modal to upload a new document
      setShowUploadModal(true)
      
      addToast({
        message: "Document removed. Upload a new document to continue.",
        type: "success"
      })
    }
  }

  if (selectedDocument) {
    return (
      <div className="h-full">
        <DocumentViewer 
          contract={selectedDocument}
          onRemoveDocument={handleRemoveDocument}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {documents.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-8 max-w-md">
              Upload your document to get comprehensive with AI-powered review and analysis.
            </p>
            <Button 
              onClick={() => setShowUploadModal(true)}
              size="lg"
              className="bg-[#355e66] hover:bg-[#2a4d54]"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Document
            </Button>
          </div>
        ) : (
          // Documents List
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Documents ({documents.length})
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((document) => {
                const riskLevel = getRiskLevel(document.riskScore)
                
                return (
                  <Card 
                    key={document.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => document.status === 'ready' && setSelectedDocument(document)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-medium truncate">
                            {document.title}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {document.fileName}
                          </p>
                        </div>
                        
                        {document.status === 'processing' && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        )}
                        {document.status === 'ready' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {document.status === 'error' && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Analysis Score */}
                        {document.status === 'ready' && document.riskScore && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Analysis Score:</span>
                            <Badge 
                              variant="outline" 
                              className={riskLevel.color}
                            >
                              {riskLevel.label} ({document.riskScore}/10)
                            </Badge>
                          </div>
                        )}
                        
                        {/* File Info */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(document.uploadedAt).toLocaleDateString()}
                          </div>
                          <span>{document.fileSize}</span>
                        </div>
                        
                        {/* Status */}
                        <div className="pt-2">
                          {document.status === 'processing' && (
                            <div className="text-sm text-blue-600 font-medium">
                              Processing document...
                            </div>
                          )}
                          {document.status === 'ready' && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-600 font-medium">
                                Ready for review
                              </span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedDocument(document)
                                }}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Review
                              </Button>
                            </div>
                          )}
                          {document.status === 'error' && (
                            <div className="text-sm text-red-600 font-medium">
                              Processing failed
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        open={showUploadModal}
        mode="upload-and-attach"
        onOpenChange={setShowUploadModal}
        projectId={projectId}
        onDocumentsAdded={handleDocumentsAdded}
      />
    </div>
  )
}

export default DocumentReviewInterface