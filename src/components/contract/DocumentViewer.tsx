// src/components/contract/DocumentViewer.tsx
"use client"

import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  FileText, 
  Loader2,
  File,
  Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface Contract {
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

interface DocumentViewerProps {
  contract: Contract
  onBack: () => void
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ contract, onBack }) => {
  const [isLoading, setIsLoading] = useState(true)


  // Render appropriate viewer based on file type
  const renderDocumentViewer = () => {
    if (!contract.fileUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Document URL not available</p>
            <p className="text-sm text-gray-500">File: {contract.fileName}</p>
          </div>
        </div>
      )
    }

    const mimeType = contract.mimeType?.toLowerCase() || ''
    const fileName = contract.fileName.toLowerCase()

    // For development/debugging - show the URL and file info
    console.log('Document viewer:', { fileUrl: contract.fileUrl, mimeType, fileName, contract })

    // PDF Viewer - try direct embed first, fallback to link
    if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <iframe
              src={contract.fileUrl}
              className="w-full h-full border-0"
              title={`PDF Viewer: ${contract.title}`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                console.error('PDF iframe failed to load');
                setIsLoading(false);
              }}
            />
          </div>
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-600">PDF Document</span>
            </div>
          </div>
        </div>
      )
    }

    // Image Viewer
    if (mimeType.includes('image') || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <div className="relative max-w-full max-h-full">
            <Image
              src={contract.fileUrl}
              alt={contract.title}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                console.error('Image failed to load');
                setIsLoading(false);
              }}
            />
          </div>
        </div>
      )
    }

    // For Word and Excel - show a preview option but don't use external viewers for now
    if (mimeType.includes('word') || fileName.match(/\.(doc|docx)$/) || 
        mimeType.includes('sheet') || mimeType.includes('excel') || fileName.match(/\.(xls|xlsx)$/)) {
      
      const isWord = mimeType.includes('word') || fileName.match(/\.(doc|docx)$/)
      const fileTypeIcon = isWord ? FileText : FileText // Could use different icons
      const fileTypeName = isWord ? 'Word Document' : 'Excel Spreadsheet'
      
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            {fileTypeIcon === FileText ? <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" /> : <FileText className="w-16 h-16 text-green-500 mx-auto mb-4" />}
            <h3 className="text-lg font-semibold mb-2">{fileTypeName}</h3>
            <p className="text-gray-600 mb-4">{contract.fileName}</p>
            <p className="text-sm text-gray-500 mb-6">
              Preview not available in browser.
            </p>
          </div>
        </div>
      )
    }

    // Generic file viewer for other types
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Document File</h3>
          <p className="text-gray-600 mb-2">{contract.fileName}</p>
          <p className="text-sm text-gray-500 mb-4">File Type: {contract.type}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{contract.title}</h1>
              <p className="text-sm text-gray-600">{contract.fileName}</p>
            </div>
          </div>
          
        </div>
      </div>


      <div className="flex-1 relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm text-gray-600">Loading document...</span>
            </div>
          </div>
        )}

        {/* Document Viewer */}
        {renderDocumentViewer()}

      </div>
    </div>
  )
}

export default DocumentViewer