import { PlusIcon } from "@heroicons/react/24/outline"

export function DocumentsSidebar({ projectId }: { projectId: string }) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <h3 className="text-lg font-medium text-secondary-900">Case Documents</h3>
          <button className="text-primary-600 hover:text-primary-700">
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 p-4">
          {/* Document categories and list */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-secondary-900 mb-2">Evidence</h4>
              {/* Document list */}
            </div>
            <div>
              <h4 className="text-sm font-medium text-secondary-900 mb-2">Motions</h4>
              {/* Document list */}
            </div>
            <div>
              <h4 className="text-sm font-medium text-secondary-900 mb-2">Correspondence</h4>
              {/* Document list */}
            </div>
          </div>
        </div>
      </div>
    )
  }
