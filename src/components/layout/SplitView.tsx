// src/components/layout/SplitView.tsx
"use client"

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { FileText, MessageSquare } from 'lucide-react'

interface SplitViewProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultLeftWidth?: number // percentage (0-100)
  minLeftWidth?: number // percentage
  maxLeftWidth?: number // percentage
  className?: string
}

export const SplitView: React.FC<SplitViewProps> = ({
  left,
  right,
  defaultLeftWidth = 65,
  minLeftWidth = 30,
  maxLeftWidth = 80,
  className
}) => {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const [mobileActiveTab, setMobileActiveTab] = useState<'canvas' | 'chat'>('canvas')
  const [isDesktop, setIsDesktop] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Check if desktop on mount and resize
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkDesktop()
    window.addEventListener('resize', checkDesktop)

    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const containerWidth = containerRect.width
    const mouseX = e.clientX - containerRect.left
    
    const newLeftWidth = (mouseX / containerWidth) * 100
    const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth)
    
    setLeftWidth(clampedWidth)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col h-full", className)}
    >
      {/* Mobile Tab Navigation */}
      <div className="lg:hidden flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          onClick={() => setMobileActiveTab('canvas')}
          className={cn(
            "relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-medium transition-colors",
            mobileActiveTab === 'canvas'
              ? "text-primary border-b-2 border-primary bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Document</span>
        </button>
        <button
          onClick={() => setMobileActiveTab('chat')}
          className={cn(
            "relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-medium transition-colors",
            mobileActiveTab === 'chat'
              ? "text-primary border-b-2 border-primary bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Chat</span>
        </button>
      </div>

      {/* Desktop Split View / Mobile Single View */}
      <div className="flex h-full flex-1 overflow-hidden">
        {/* Left Panel (Canvas) */}
        <div
          className={cn(
            "flex flex-col min-w-0 bg-white",
            "lg:flex", // Always visible on desktop
            mobileActiveTab === 'canvas' ? "flex w-full" : "hidden" // Toggle on mobile, full width
          )}
          style={isDesktop ? { width: `${leftWidth}%` } : undefined}
        >
          {left}
        </div>

        {/* Resizable Divider - Desktop Only */}
        <div
          className={cn(
            "hidden lg:block w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize flex-shrink-0 transition-colors",
            isDragging && "bg-blue-400"
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-0.5 h-8 bg-gray-400 rounded-full opacity-50" />
          </div>
        </div>

        {/* Right Panel (Chat) */}
        <div
          className={cn(
            "flex flex-col min-w-0 bg-gray-50 lg:border-l",
            "lg:flex", // Always visible on desktop
            mobileActiveTab === 'chat' ? "flex w-full" : "hidden" // Toggle on mobile, full width
          )}
          style={isDesktop ? { width: `${100 - leftWidth}%` } : undefined}
        >
          {right}
        </div>
      </div>
    </div>
  )
}