// src/components/dashboard/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import {
  HomeIcon,
  FolderIcon,
  ChatBubbleLeftIcon,
  DocumentIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Assistant', href: '/messages', icon: SparklesIcon },
  { name: 'Documents', href: '/documents', icon: DocumentIcon },
  { name: 'Team', href: '/team', icon: UserGroupIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-secondary-200 bg-white px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <img
            className="h-8 w-auto"
            src="/vercel.svg"
            alt="WakiliChat"
          />
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50'
                        }`}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${
                            isActive
                              ? 'text-primary-700'
                              : 'text-secondary-400 group-hover:text-secondary-500'
                          }`}
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}