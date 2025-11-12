
// src/hooks/useProjects.ts
'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Project } from '@/types/projects'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/projects')
      setProjects(response.data.data)
      setError('')
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch projects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
  }
}