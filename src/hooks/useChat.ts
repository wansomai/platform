// src/hooks/useChat.ts
import { useState } from 'react'
import api from '@/lib/api'
import { useChatStore } from '@/store/chat.store'
import { apiEndpoints } from '@/lib/endpoints'

export function useChat(projectId: string) {
  const { 
    currentConversation,
    addMessage, 
    setLoading, 
    setError,
    isLoading 
  } = useChatStore()
  const [conversationId, setConversationId] = useState<string | null>(null)

  const fetchChatHistory = async (conversationId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const endpoint = apiEndpoints.conversations.messages(projectId, conversationId)
      const response = await api.get(endpoint)
      
      setConversationId(conversationId)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch chat history')
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async (title: string = 'New conversation') => {
    try {
      setLoading(true)
      setError(null)
      
      const endpoint = apiEndpoints.conversations.create(projectId)
      const response = await api.post(endpoint, { title })
      
      setConversationId(response.data.data.id)
      return response.data.data.id
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create conversation')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (content: string, context?: Record<string, any>) => {
    try {
      setLoading(true)
      setError(null)  
      // Send message to API
      const endpoint = apiEndpoints.conversations.create(projectId)
      console.log(endpoint)
      const response = await api.post(endpoint, {
        message: content,
        context,
        metadata: {}
      })
      
      // Add assistant response
      addMessage(response.data.data)
      return response.data.data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send message')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    messages: currentConversation?.messages ?? [],
    isLoading,
    sendMessage,
    fetchChatHistory,
    createConversation,
    conversationId
  }
}