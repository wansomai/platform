"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline"

const navigation = [
  { name: "Overview", href: "overview", icon: InformationCircleIcon },
  { name: "Documents", href: "documents", icon: DocumentTextIcon },
  { name: "Team", href: "team", icon: UserGroupIcon },
  { name: "Schedule", href: "schedule", icon: CalendarIcon },
  { name: "AI Assistant", href: "assistant", icon: ChatBubbleLeftRightIcon },
]

export function ProjectSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const params = useParams()
  const projectId = params.id

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-secondary-200">
          <div className="flex items-center flex-shrink-0 px-4">
            <img className="w-auto h-8" src="/logo.svg" alt="WakiliChat" />
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const href = `/projects/${projectId}/${item.href}`
              return (
                <Link
                  key={item.name}
                  href={href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-6 w-6 text-secondary-400 group-hover:text-secondary-500"
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}

