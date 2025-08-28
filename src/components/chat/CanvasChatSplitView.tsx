// src/components/chat/CanvasChatSplitView.tsx
"use client"

import React from 'react'
import { SplitView } from '@/components/layout/SplitView'
import { ChatInterface } from '@/components/chat/ChatInterface'
import LegalCanvas from '@/components/chat/CanvasInterface'

export const CanvasChatSplitView: React.FC = () => {
  return (
    <SplitView
      left={<LegalCanvas />}
      right={<ChatInterface />}
      defaultLeftWidth={65} // Canvas takes 65% by default
      minLeftWidth={40}     // Canvas minimum 40%
      maxLeftWidth={80}     // Canvas maximum 80%
      className="h-full"
    />
  )
}