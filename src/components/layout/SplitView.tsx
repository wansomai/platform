// src/components/layout/SplitView.tsx
"use client"

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

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
  const containerRef = useRef<HTMLDivElement>(null)

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
      className={cn("flex h-full", className)}
    >
      {/* Left Panel */}
      <div 
        className="flex flex-col min-w-0 bg-white"
        style={{ width: `${leftWidth}%` }}
      >
        {left}
      </div>

      {/* Resizable Divider */}
      <div
        className={cn(
          "w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize flex-shrink-0 transition-colors",
          isDragging && "bg-blue-400"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-0.5 h-8 bg-gray-400 rounded-full opacity-50" />
        </div>
      </div>

      {/* Right Panel */}
      <div 
        className="flex flex-col min-w-0 bg-gray-50 border-l"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {right}
      </div>
    </div>
  )
}