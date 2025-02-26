import Link from "next/link"
import { DocumentTextIcon } from "@heroicons/react/24/outline"

export function DocumentCard() {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DocumentTextIcon className="h-6 w-6 text-accent-600" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-secondary-500 truncate">Recent Documents</dt>
              <dd>
                <div className="text-lg font-medium text-secondary-900">8</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-secondary-50 px-5 py-3">
        <div className="text-sm">
          <Link href="/documents" className="font-medium text-accent-700 hover:text-accent-900">
            View all
          </Link>
        </div>
      </div>
    </div>
  )
}

