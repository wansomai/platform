// src/components/chat/DocumentPreviewSplitView.tsx
"use client"

import React, { useMemo } from 'react'
import { SplitView } from '@/components/layout/SplitView'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { DocumentViewer } from '@/components/contract/DocumentViewer'
import { useUIStore } from '@/store/ui.store'

export const DocumentPreviewSplitView: React.FC = () => {
  const { selectedPreviewDocument, clearPreviewDocument } = useUIStore()

  // Transform workspace document to Contract format for DocumentViewer
  const contractDocument = useMemo(() => {
    if (!selectedPreviewDocument) return null

    return {
      id: selectedPreviewDocument.id,
      title: selectedPreviewDocument.title,
      fileName: selectedPreviewDocument.title,
      status: 'ready' as const,
      uploadedAt: selectedPreviewDocument.createdAt || new Date().toISOString(),
      fileSize: selectedPreviewDocument.fileSize
        ? `${Math.round(selectedPreviewDocument.fileSize / 1024)} KB`
        : 'Unknown size',
      type: selectedPreviewDocument.fileType || 'unknown',
      fileUrl: selectedPreviewDocument.fileUrl,
      mimeType: selectedPreviewDocument.fileType,
    }
  }, [selectedPreviewDocument])

  // Fallback if no document is selected
  if (!contractDocument) {
    return <ChatInterface />
  }

  return (
    <SplitView
      left={
        <DocumentViewer
          contract={contractDocument}
          onRemoveDocument={clearPreviewDocument}
        />
      }
      right={<ChatInterface />}
      defaultLeftWidth={65} // Document preview takes 65% by default
      minLeftWidth={40}     // Minimum 40%
      maxLeftWidth={80}     // Maximum 80%
      className="h-full"
    />
  )
}
