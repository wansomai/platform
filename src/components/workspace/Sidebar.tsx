"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HomeIcon,
  FolderIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
} from "@heroicons/react/24/outline"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Projects", href: "/projects", icon: FolderIcon },
  { name: "Documents", href: "/documents", icon: DocumentTextIcon },
  { name: "Team", href: "/team", icon: UserGroupIcon },
  { name: "AI Assistant", href: "/assistant", icon: ChatBubbleLeftRightIcon },
  { name: "Settings", href: "/settings", icon: CogIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-secondary-200">
          <div className="flex items-center flex-shrink-0 px-4">
            <img className="w-auto h-8" src="/logo.svg" alt="Wansom ai" />
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      isActive ? "text-primary-700" : "text-secondary-400 group-hover:text-secondary-500"
                    } mr-3 flex-shrink-0 h-6 w-6`}
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

