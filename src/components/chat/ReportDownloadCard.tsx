// src/components/chat/ReportDownloadCard.tsx
'use client'

import React from 'react'
import { Download } from 'lucide-react'
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
  const handleDownload = async () => {
    try {
      // Fetch the file with credentials (session auth)
      const response = (await apiService.get(report.downloadUrls.word)) as Response

      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      // Get the blob from response
      const blob = await response.blob()

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
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Download Report
      </Button>
    </div>
  )
}
