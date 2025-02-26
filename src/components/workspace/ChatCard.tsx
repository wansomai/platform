import Link from "next/link"
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline"

export function ChatCard() {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-secondary-600" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-secondary-500 truncate">AI Assistant</dt>
              <dd>
                <div className="text-lg font-medium text-secondary-900">Ask for help</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-secondary-50 px-5 py-3">
        <div className="text-sm">
          <Link href="/assistant" className="font-medium text-secondary-700 hover:text-secondary-900">
            Start a conversation
          </Link>
        </div>
      </div>
    </div>
  )
}

