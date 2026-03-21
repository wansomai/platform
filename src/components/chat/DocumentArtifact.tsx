// src/components/chat/DocumentArtifact.tsx
'use client'
import React from 'react'
import { FileText, } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useCanvasStore } from '@/store/canvas.store'
import { useProjectSettingsStore } from '@/store/workspace-settings.store'

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
  const router = useRouter()
  const saveCanvasDocument = useCanvasStore(state => state.saveCanvasDocument)
  const createCanvasDocument = useCanvasStore(state => state.createCanvasDocument)
  const updateSetting = useProjectSettingsStore(state => state.updateSetting)

  const [isOpening, setIsOpening] = React.useState(false)
  // Tracks whether this specific artifact has been saved to a canvas doc already.
  // Prevents creating a duplicate document if the user clicks "Open in Editor" again.
  const hasOpenedRef = React.useRef(false)

  const handleCardClick = async () => {
    if (isOpening) return
    if (onOpenInCanvas) {
      onOpenInCanvas()
      return
    }
    setIsOpening(true)
    try {
      if (!projectId) {
        toast.error('Unable to open in editor')
        return
      }

      if (!hasOpenedRef.current) {
        // First time opening this artifact — create a dedicated canvas document for it.
        // Each artifact gets its own tab so multiple artifacts can coexist independently.
        const plainText = htmlContent.replace(/<[^>]*>/g, '')
        const newDoc = await createCanvasDocument(projectId, title)
        if (!newDoc) {
          throw new Error('Failed to create canvas document')
        }
        await saveCanvasDocument(projectId, null, htmlContent, plainText)
        hasOpenedRef.current = true
      }
      // On subsequent clicks, the document already exists — just navigate.

      await updateSetting(projectId, 'canvasMode', true)
      router.push(`/projects/${projectId}?view=canvas`)
      toast.success('Document opened in editor')
    } catch (error) {
      console.error('Error opening in canvas:', error)
      toast.error('Failed to open document in editor')
    } finally {
      setIsOpening(false)
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
            disabled={isOpening}
            onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
            className="flex-shrink-0"
          >
            <span className="hidden sm:inline">{isOpening ? 'Opening…' : 'Open in Editor'}</span>
          </Button>
        </div>

      </div>
    </div>
  )
}
