// src/components/chat/ReportDownloadCard.tsx
'use client'

import React, { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'

interface ReportMetadata {
  reportId: string
  reportTitle: string
  documentName: string
  reviewFocus: string
  briefSummary: string
  downloadUrls: {
    word: string
  }
}

interface ReportDownloadCardProps {
  report: ReportMetadata
  projectId: string
}

export const ReportDownloadCard: React.FC<ReportDownloadCardProps> = ({ report }) => {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Download the file as a blob
      const blob = await apiService.downloadFile(report.downloadUrls.word)

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Review_Report_${new Date().toISOString().split('T')[0]}.doc`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Report downloaded successfully!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download report')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={isDownloading}
        className="gap-2"
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download Report
          </>
        )}
      </Button>
    </div>
  )
}
