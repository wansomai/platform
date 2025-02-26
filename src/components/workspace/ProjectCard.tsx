import Link from "next/link"
import { FolderIcon } from "@heroicons/react/24/outline"

export function ProjectCard() {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <FolderIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-secondary-500 truncate">Active Projects</dt>
              <dd>
                <div className="text-lg font-medium text-secondary-900">12</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-secondary-50 px-5 py-3">
        <div className="text-sm">
          <Link href="/projects" className="font-medium text-primary-700 hover:text-primary-900">
            View all
          </Link>
        </div>
      </div>
    </div>
  )
}

