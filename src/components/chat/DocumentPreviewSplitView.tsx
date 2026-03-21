// src/components/chat/DocumentPreviewSplitView.tsx
"use client"

import React, { useMemo } from 'react'
import { SplitView } from '@/components/layout/SplitView'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { DocumentViewer } from '@/components/contract/DocumentViewer'
import { useUIStore } from '@/store/ui.store'

// Maps bare file extensions (as stored in chat attachment metadata) to full MIME types
// that DocumentViewer's type-detection checks can match against.
function normalizeMimeType(fileType: string | undefined | null): string {
  if (!fileType) return ''
  const ext = fileType.toLowerCase().replace(/^\./, '')
  const map: Record<string, string> = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc:  'application/msword',
    pdf:  'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls:  'application/vnd.ms-excel',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    png:  'image/png',
    gif:  'image/gif',
    webp: 'image/webp',
  }
  return map[ext] ?? fileType
}

export const DocumentPreviewSplitView: React.FC = () => {
  const { selectedPreviewDocument, clearPreviewDocument } = useUIStore()

  // Transform workspace document to Contract format for DocumentViewer
  const contractDocument = useMemo(() => {
    if (!selectedPreviewDocument) return null

    // Derive a filename that includes the extension so DocumentViewer's
    // extension-based fallback checks work even when mimeType is absent.
    const ext = selectedPreviewDocument.fileType
      ? `.${selectedPreviewDocument.fileType.toLowerCase().replace(/^\./, '').split('/').pop()}`
      : ''
    const fileUrlName = selectedPreviewDocument.fileUrl
      ? decodeURIComponent(selectedPreviewDocument.fileUrl.split('/').pop()?.split('?')[0] ?? '')
      : ''
    const fileName = fileUrlName || `${selectedPreviewDocument.title}${ext}`

    return {
      id: selectedPreviewDocument.id,
      title: selectedPreviewDocument.title,
      fileName,
      status: 'ready' as const,
      uploadedAt: selectedPreviewDocument.createdAt || new Date().toISOString(),
      fileSize: selectedPreviewDocument.fileSize
        ? `${Math.round(selectedPreviewDocument.fileSize / 1024)} KB`
        : 'Unknown size',
      type: selectedPreviewDocument.fileType || 'unknown',
      fileUrl: selectedPreviewDocument.fileUrl,
      mimeType: normalizeMimeType(selectedPreviewDocument.fileType),
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
