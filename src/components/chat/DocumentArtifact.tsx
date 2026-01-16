// src/components/chat/DocumentArtifact.tsx
'use client'

import React, { useState } from 'react'
import { FileText, Download, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useDocumentsStore } from '@/store/documents.store'
import { useCanvasStore } from '@/store/canvas.store'

interface DocumentArtifactProps {
  title: string
  format: 'PDF' | 'DOCX' | 'MD'
  htmlContent: string
  documentId?: string
  projectId: string
  conversationId: string
  onOpenInCanvas?: () => void
}

export function DocumentArtifact({
  title,
  format,
  htmlContent,
  projectId,
  onOpenInCanvas
}: DocumentArtifactProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const router = useRouter()
  const saveCanvasDocument = useCanvasStore(state => state.saveCanvasDocument)

  const handleCardClick = async () => {

    if (onOpenInCanvas) {
      onOpenInCanvas()
    } else {
      try {
        // Validate projectId before proceeding
        if (!projectId) {
          toast.error('Unable to open in editor - project not found')
          return;
        }

        // Save document to canvas before navigating using store method
        const plainText = htmlContent.replace(/<[^>]*>/g, '') // Simple HTML strip for plain text
        const result = await saveCanvasDocument(projectId, null, htmlContent, plainText)

        if (!result) {
          throw new Error('Failed to save to canvas')
        }

        // Navigate to canvas view
        router.push(`/projects/${projectId}?view=canvas`)
        toast.success('Document opened in editor')
      } catch (error) {
        console.error('Error opening in canvas:', error)
        toast.error('Failed to open document in editor')
      }
    }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation() // Don't trigger card click
    e.preventDefault() // Prevent any default behavior

    try {
      setIsDownloading(true)

      // Call store method to generate and download document
      await useDocumentsStore.getState().downloadGeneratedDocument(htmlContent, format, title)

      toast.success(`${format} downloaded successfully!`)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download document')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div
      className="mt-4 border rounded-lg bg-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md group"
      onClick={handleCardClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5 flex-shrink-0">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-[#4a7279] transition-colors">
                {title}
              </h4>
              <p className="text-sm text-[#4a7279] mt-0.5">
                Document · {format}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-shrink-0"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Downloading...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Download</span>
              </>
            )}
          </Button>
        </div>


        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
             open in editor
          </p>
        </div>
      </div>
    </div>
  )
}
