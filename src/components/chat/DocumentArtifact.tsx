// src/components/chat/DocumentArtifact.tsx
'use client'
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
  const fetchCanvasDocument = useCanvasStore(state => state.fetchCanvasDocument)
  const canvasDocument = useCanvasStore(state => state.canvasDocument)
  const updateSetting = useProjectSettingsStore(state => state.updateSetting)

  const handleCardClick = async () => {

    if (onOpenInCanvas) {
      onOpenInCanvas()
    } else {
      try {
        // Validate projectId before proceeding
        if (!projectId) {
          toast.error('Unable to open in editor')
          return;
        }

        // Check whether a canvas document already exists for this project.
        // If so, DO NOT overwrite it — the user may have already edited it.
        // We only write the AI-generated HTML when there is no existing canvas.
        const existing = canvasDocument ?? await fetchCanvasDocument(projectId)

        if (!existing) {
          // No canvas document yet — seed it with the AI-generated content
          const plainText = htmlContent.replace(/<[^>]*>/g, '')
          const result = await saveCanvasDocument(projectId, null, htmlContent, plainText)
          if (!result) {
            throw new Error('Failed to save to canvas')
          }
        }
        // If a canvas document already exists, just navigate — preserving user edits.

        // Enable canvas mode so Draft & Review is toggled on
        await updateSetting(projectId, 'canvasMode', true)

        // Navigate to canvas view
        router.push(`/projects/${projectId}?view=canvas`)
        toast.success('Document opened in editor')
      } catch (error) {
        console.error('Error opening in canvas:', error)
        toast.error('Failed to open document in editor')
      }
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
            onClick={handleCardClick}
            className="flex-shrink-0"
          >
             <span className="hidden sm:inline">Open in Editor</span>
  
          </Button>
        </div>

      </div>
    </div>
  )
}
