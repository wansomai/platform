"use client"

import { useState } from "react"
import { ChatInterface } from "../chat/ChatInterface"
import { ChatSidebar } from "../chat/ChatSidebar"

export function ChatWorkspace() {
  return (
    <div className="flex h-full">
      {/* Left sidebar with conversations */}
      <div className="w-80 border-r border-secondary-200 hidden md:block">
        <ChatSidebar />
      </div>
      
      {/* Main chat area */}
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  )
}