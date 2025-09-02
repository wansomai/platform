// src/components/contract/DocumentViewer.tsx
"use client"

import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  AlertTriangle, 
  Shield,
  DollarSign,
  X,
  Eye,
  EyeOff,
  Loader2,
  File,
  Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Get risk level styling
  const getRiskLevel = (score?: number) => {
    if (!score) return { label: 'Unknown', color: 'bg-gray-100 text-gray-600' }
    if (score <= 3) return { label: 'Low', color: 'bg-green-100 text-green-700' }
    if (score <= 6) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' }
    return { label: 'High', color: 'bg-red-100 text-red-700' }
  }

  const riskLevel = getRiskLevel(contract.riskScore)
  const riskCounts = {
    high: 2, // Mock data - would come from actual analysis
    medium: 3,
    low: 4,
  }

  // Send prompt to chat
  const sendPromptToChat = (prompt: string) => {
    document.dispatchEvent(new CustomEvent('action-prompt-send', {
      detail: { promptTemplate: prompt }
    }));
  }

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
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PDF Document</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(contract.fileUrl, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
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
              Preview not available in browser. Download to view the full document.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => window.open(contract.fileUrl, '_blank')}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download & Open
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Try to view using the system default application
                  const link = document.createElement('a');
                  link.href = contract.fileUrl ?? '';
                  link.target = '_blank';
                  link.download = contract.fileName;
                  document.body.appendChild(link);          
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Try to View
              </Button>
            </div>
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
          <Button
            variant="outline"
            onClick={() => window.open(contract.fileUrl, '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            Download File
          </Button>
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
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickActions(!showQuickActions)}
            >
              {showQuickActions ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showQuickActions ? 'Hide' : 'Show'} Actions
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => contract.fileUrl && window.open(contract.fileUrl, '_blank')}
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Risk Overview */}
      {showQuickActions && (
        <div className="border-b p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Risk Summary:</span>
                <Badge variant="outline" className="bg-red-100 text-red-700">
                  {riskCounts.high} High
                </Badge>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                  {riskCounts.medium} Medium
                </Badge>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  {riskCounts.low} Low
                </Badge>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Overall Risk Score: <span className={`font-semibold ${riskLevel.color.includes('red') ? 'text-red-600' : riskLevel.color.includes('yellow') ? 'text-yellow-600' : 'text-green-600'}`}>
                {contract.riskScore}/10
              </span>
            </div>
          </div>
        </div>
      )}

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

        {/* Quick Action Panel - Overlay */}
        {showQuickActions && (
          <div className="absolute bottom-4 right-4 w-80">
            <div className="bg-white rounded-lg shadow-lg border p-4">
              <h3 className="text-lg font-semibold mb-3">Quick Analysis</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => sendPromptToChat("Show me the high risk areas of this document and explain why they are concerning.")}
                  className="justify-start"
                >
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                  High Risk Areas
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => sendPromptToChat("Analyze the payment terms in this document. Are they fair and favorable?")}
                  className="justify-start"
                >
                  <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                  Payment Terms
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => sendPromptToChat("Review the termination and cancellation clauses. What are my options for ending this agreement?")}
                  className="justify-start"
                >
                  <X className="w-4 h-4 mr-2 text-orange-500" />
                  Termination Terms
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => sendPromptToChat("Check this document for compliance with relevant laws and regulations. Are there any compliance gaps?")}
                  className="justify-start"
                >
                  <Shield className="w-4 h-4 mr-2 text-blue-500" />
                  Compliance Check
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentViewer