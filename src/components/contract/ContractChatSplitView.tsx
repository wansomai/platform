// src/components/contract/ContractChatSplitView.tsx
"use client"

import React from 'react'
import { SplitView } from '@/components/layout/SplitView'
import { ChatInterface } from '@/components/chat/ChatInterface'
import ContractReviewInterface from './ContractReviewInterface'

export const ContractChatSplitView: React.FC = () => {
  return (
    <SplitView
      left={<ContractReviewInterface />}
      right={<ChatInterface />}
      defaultLeftWidth={65} // Contract Review takes 65% by default
      minLeftWidth={40}     // Contract Review minimum 40%
      maxLeftWidth={80}     // Contract Review maximum 80%
      className="h-full"
    />
  )
}

export default ContractChatSplitView