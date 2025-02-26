'use client'

import { useState, useEffect } from 'react'
import { 
  ChatBubbleLeftIcon, 
  CheckCircleIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import api from '@/lib/api'

interface Conversation {
  id: string
  title: string
  last_message: string
  created_at: string
  updated_at: string
  status: 'active' | 'completed' | 'archived'
  is_pinned: boolean
  unread_count: number
}

interface ConversationsListProps {
  projectId: string
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
}

export function ConversationsList({
  projectId,
  activeConversationId,
  onSelectConversation
}: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    fetchConversations()
  }, [projectId])

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/projects/${projectId}/conversations`)
      setConversations(response.data.data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePin = async (conversationId: string) => {
    try {
      await api.patch(`/projects/${projectId}/conversations/${conversationId}/pin`)
      fetchConversations()
    } catch (err) {
      console.error('Failed to pin conversation:', err)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'all') return true
    if (filter === 'active') return conv.status === 'active'
    return conv.status === 'completed'
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-sm text-secondary-500">Loading conversations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchConversations}
          className="mt-2 text-sm text-primary-600 hover:text-primary-700"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="px-4 py-2 border-b border-secondary-200">
        <div className="flex space-x-2 text-sm">
          {['all', 'active', 'completed'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-3 py-1 rounded-md ${
                filter === filterOption
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <ChatBubbleLeftIcon className="h-8 w-8 text-secondary-400" />
            <p className="mt-2 text-sm text-secondary-500">No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`group flex items-start p-4 hover:bg-secondary-50 cursor-pointer ${
                  activeConversationId === conversation.id ? 'bg-secondary-50' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-secondary-900 truncate">
                      {conversation.title}
                    </h4>
                    {conversation.unread_count > 0 && (
                      <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-secondary-500 line-clamp-2">
                    {conversation.last_message}
                  </p>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="flex items-center text-xs text-secondary-400">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {format(new Date(conversation.updated_at), 'MMM d, h:mm a')}
                    </span>
                    {conversation.status === 'completed' && (
                      <span className="flex items-center text-xs text-green-600">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Completed
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePin(conversation.id)
                  }}
                  className={`ml-4 ${
                    conversation.is_pinned
                      ? 'text-primary-600'
                      : 'text-secondary-400 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <StarIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}