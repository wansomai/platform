import { useState } from 'react'
import Link from 'next/link'
import { 
  CalendarIcon, 
  ChatBubbleLeftIcon,
  DocumentIcon,
  EllipsisHorizontalIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

interface ProjectCardProps {
  project: {
    id: string
    title: string
    description: string | null
    status: string
    created_at: string
    team_count: number
    messages_count: number
    documents_count: number
    last_activity: string
  }
  onDelete: (id: string) => void
  onUpdate: (id: string) => void
}

export function ProjectCard({ project, onDelete, onUpdate }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-secondary-100 text-secondary-800'
    }
  }

  return (
    <div 
      className="group relative flex flex-col overflow-hidden rounded-lg border border-secondary-200 bg-white transition-all duration-200 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between p-4 sm:p-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <Link 
              href={`/projects/${project.id}`}
              className="text-lg font-semibold text-secondary-900 hover:text-primary-600 truncate"
            >
              {project.title}
            </Link>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-secondary-500 line-clamp-2">
            {project.description || 'No description'}
          </p>
        </div>

        {/* Actions Menu */}
        <Menu as="div" className="relative flex-shrink-0 ml-4">
          <Menu.Button className="-m-2.5 block p-2.5 text-secondary-500 hover:text-secondary-900">
            <span className="sr-only">Open options</span>
            <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => onUpdate(project.id)}
                    className={`${
                      active ? 'bg-secondary-50' : ''
                    } block px-3 py-1 text-sm text-secondary-900 w-full text-left`}
                  >
                    Edit
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => onDelete(project.id)}
                    className={`${
                      active ? 'bg-secondary-50' : ''
                    } block px-3 py-1 text-sm text-red-600 w-full text-left`}
                  >
                    Delete
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Card Stats */}
      <div className="flex flex-wrap gap-4 px-4 sm:px-6 py-3 bg-secondary-50">
        <div className="flex items-center text-sm text-secondary-500">
          <UserGroupIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
          {project.team_count} members
        </div>
        <div className="flex items-center text-sm text-secondary-500">
          <DocumentIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
          {project.documents_count} documents
        </div>
        <div className="flex items-center text-sm text-secondary-500">
          <ChatBubbleLeftIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
          {project.messages_count} messages
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-secondary-200">
        <div className="flex items-center text-sm text-secondary-500">
          <CalendarIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
          Created {new Date(project.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center text-sm text-secondary-500">
          <ClockIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
          Active {project.last_activity}
        </div>
      </div>
    </div>
  )
}

export default ProjectCard