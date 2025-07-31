// stores/content.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ContentItem {
  id: string
  userId: string
  title: string
  slug: string
  metaDescription?: string
  excerpt?: string
  content: any // JSON blocks
  htmlContent?: string
  wordCount?: number
  contentType: string // "foundation_page", "blog_post", "faq"
  practiceArea?: string
  location?: {
    city: string
    state?: string
    country: string
  }
  tags: string[]
  keywords: string[]
  status: 'draft' | 'published' | 'archived'
  views: number
  leads: number
  clicks: number
  impressions: number
  seoScore?: number
  generationPrompt?: string
  aiModel?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ContentFilters {
  contentType?: string
  practiceArea?: string
  status?: string
  search?: string
}

export interface ContentPagination {
  currentPage: number
  totalPages: number
  totalCount: number
  hasMore: boolean
}

interface ContentState {
  // Content data
  content: ContentItem[]
  currentContent: ContentItem | null
  loading: boolean
  error: string | null
  
  // Pagination and filtering
  filters: ContentFilters
  pagination: ContentPagination
  
  // UI state
  selectedIds: string[]
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'views' | 'seoScore'
  sortOrder: 'asc' | 'desc'
  
  // Actions
  fetchContent: (page?: number, limit?: number) => Promise<void>
  fetchContentById: (id: string) => Promise<ContentItem | null>
  createContent: (contentData: Partial<ContentItem>) => Promise<ContentItem | null>
  updateContent: (id: string, updates: Partial<ContentItem>) => Promise<ContentItem | null>
  deleteContent: (id: string) => Promise<boolean>
  bulkDelete: (ids: string[]) => Promise<boolean>
  publishContent: (id: string) => Promise<boolean>
  unpublishContent: (id: string) => Promise<boolean>
  
  // Filter and search
  setFilters: (filters: Partial<ContentFilters>) => void
  clearFilters: () => void
  setSearch: (search: string) => void
  setSortBy: (sortBy: string, order?: 'asc' | 'desc') => void
  
  // Selection
  selectContent: (id: string) => void
  selectAllContent: () => void
  clearSelection: () => void
  toggleSelection: (id: string) => void
  
  // UI helpers
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Cache management
  invalidateCache: () => void
  refreshContent: () => Promise<void>
}

const initialFilters: ContentFilters = {
  contentType: undefined,
  practiceArea: undefined,
  status: undefined,
  search: undefined
}

const initialPagination: ContentPagination = {
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  hasMore: false
}

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      // Initial state
      content: [],
      currentContent: null,
      loading: false,
      error: null,
      filters: initialFilters,
      pagination: initialPagination,
      selectedIds: [],
      sortBy: 'createdAt',
      sortOrder: 'desc',

      // Fetch content with pagination and filters
      fetchContent: async (page = 1, limit = 10) => {
        const { filters, sortBy, sortOrder } = get()
        set({ loading: true, error: null })

        try {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy,
            sortOrder,
            ...(filters.contentType && { type: filters.contentType }),
            ...(filters.practiceArea && { practiceArea: filters.practiceArea }),
            ...(filters.status && { status: filters.status }),
            ...(filters.search && { search: filters.search })
          })

          const response = await fetch(`/api/content?${params}`)
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch content')
          }

          const data = await response.json()
          
          set({
            content: data.content,
            pagination: data.pagination,
            loading: false
          })
        } catch (error) {
          console.error('Error fetching content:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch content',
            loading: false
          })
        }
      },

      // Fetch individual content item
      fetchContentById: async (id: string) => {
        set({ loading: true, error: null })

        try {
          const response = await fetch(`/api/content/${id}`)
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Content not found')
          }

          const data = await response.json()
          const contentItem = data.content

          set({
            currentContent: contentItem,
            loading: false
          })

          return contentItem
        } catch (error) {
          console.error('Error fetching content by ID:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch content',
            loading: false
          })
          return null
        }
      },

      // Create new content
      createContent: async (contentData: Partial<ContentItem>) => {
        set({ loading: true, error: null })

        try {
          const response = await fetch('/api/content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(contentData)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create content')
          }

          const data = await response.json()
          const newContent = data.content

          // Add to existing content list
          set((state) => ({
            content: [newContent, ...state.content],
            currentContent: newContent,
            loading: false
          }))

          return newContent
        } catch (error) {
          console.error('Error creating content:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to create content',
            loading: false
          })
          return null
        }
      },

      // Update content
      updateContent: async (id: string, updates: Partial<ContentItem>) => {
        set({ loading: true, error: null })

        try {
          const response = await fetch(`/api/content/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update content')
          }

          const data = await response.json()
          const updatedContent = data.content

          // Update in content list and current content
          set((state) => ({
            content: state.content.map(item => 
              item.id === id ? updatedContent : item
            ),
            currentContent: state.currentContent?.id === id ? updatedContent : state.currentContent,
            loading: false
          }))

          return updatedContent
        } catch (error) {
          console.error('Error updating content:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to update content',
            loading: false
          })
          return null
        }
      },

      // Delete content
      deleteContent: async (id: string) => {
        set({ loading: true, error: null })

        try {
          const response = await fetch(`/api/content/${id}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete content')
          }

          // Remove from content list
          set((state) => ({
            content: state.content.filter(item => item.id !== id),
            currentContent: state.currentContent?.id === id ? null : state.currentContent,
            selectedIds: state.selectedIds.filter(selectedId => selectedId !== id),
            loading: false
          }))

          return true
        } catch (error) {
          console.error('Error deleting content:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to delete content',
            loading: false
          })
          return false
        }
      },

      // Bulk delete
      bulkDelete: async (ids: string[]) => {
        set({ loading: true, error: null })

        try {
          const deletePromises = ids.map(id => 
            fetch(`/api/content/${id}`, { method: 'DELETE' })
          )

          const responses = await Promise.all(deletePromises)
          const failedDeletes = responses.filter(r => !r.ok)

          if (failedDeletes.length > 0) {
            throw new Error(`Failed to delete ${failedDeletes.length} items`)
          }

          // Remove from content list
          set((state) => ({
            content: state.content.filter(item => !ids.includes(item.id)),
            selectedIds: [],
            loading: false
          }))

          return true
        } catch (error) {
          console.error('Error bulk deleting content:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to delete content',
            loading: false
          })
          return false
        }
      },

      // Publish content
      publishContent: async (id: string) => {
        return await get().updateContent(id, { 
          status: 'published', 
          publishedAt: new Date().toISOString() 
        }) !== null
      },

      // Unpublish content
      unpublishContent: async (id: string) => {
        return await get().updateContent(id, { 
          status: 'draft',
          publishedAt: undefined 
        }) !== null
      },

      // Filter and search actions
      setFilters: (newFilters: Partial<ContentFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          pagination: { ...initialPagination }
        }))
        
        // Auto-fetch with new filters
        get().fetchContent(1)
      },

      clearFilters: () => {
        set({ 
          filters: initialFilters,
          pagination: { ...initialPagination }
        })
        
        // Auto-fetch with cleared filters
        get().fetchContent(1)
      },

      setSearch: (search: string) => {
        set((state) => ({
          filters: { ...state.filters, search },
          pagination: { ...initialPagination }
        }))
        
        // Debounce search
        const timeoutId = setTimeout(() => {
          get().fetchContent(1)
        }, 300)

        return () => clearTimeout(timeoutId)
      },

      setSortBy: (sortBy: string, order = 'desc') => {
        set({ 
          sortBy: sortBy as any, 
          sortOrder: order as 'asc' | 'desc',
          pagination: { ...initialPagination }
        })
        
        // Auto-fetch with new sorting
        get().fetchContent(1)
      },

      // Selection actions
      selectContent: (id: string) => {
        set((state) => ({
          selectedIds: [id]
        }))
      },

      selectAllContent: () => {
        set((state) => ({
          selectedIds: state.content.map(item => item.id)
        }))
      },

      clearSelection: () => {
        set({ selectedIds: [] })
      },

      toggleSelection: (id: string) => {
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter(selectedId => selectedId !== id)
            : [...state.selectedIds, id]
        }))
      },

      // UI helpers
      setLoading: (loading: boolean) => set({ loading }),
      
      setError: (error: string | null) => set({ error }),
      
      clearError: () => set({ error: null }),

      // Cache management
      invalidateCache: () => {
        set({
          content: [],
          currentContent: null,
          pagination: initialPagination
        })
      },

      refreshContent: async () => {
        const { pagination } = get()
        await get().fetchContent(pagination.currentPage)
      }
    }),
    {
      name: 'wansom-content-store',
      partialize: (state) => ({
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      }),
      version: 1
    }
  )
)

// Selector hooks for better performance
export const useContentList = () => {
  const content = useContentStore(state => state.content)
  const loading = useContentStore(state => state.loading)
  const error = useContentStore(state => state.error)
  const pagination = useContentStore(state => state.pagination)
  
  return { content, loading, error, pagination }
}

export const useContentFilters = () => {
  const filters = useContentStore(state => state.filters)
  const setFilters = useContentStore(state => state.setFilters)
  const clearFilters = useContentStore(state => state.clearFilters)
  const setSearch = useContentStore(state => state.setSearch)
  
  return { filters, setFilters, clearFilters, setSearch }
}

export const useContentSelection = () => {
  const selectedIds = useContentStore(state => state.selectedIds)
  const selectContent = useContentStore(state => state.selectContent)
  const selectAllContent = useContentStore(state => state.selectAllContent)
  const clearSelection = useContentStore(state => state.clearSelection)
  const toggleSelection = useContentStore(state => state.toggleSelection)
  
  return { 
    selectedIds, 
    selectContent, 
    selectAllContent, 
    clearSelection, 
    toggleSelection,
    hasSelection: selectedIds.length > 0,
    isAllSelected: false // Will be computed based on current page content
  }
}

export const useCurrentContent = () => {
  const currentContent = useContentStore(state => state.currentContent)
  const loading = useContentStore(state => state.loading)
  const error = useContentStore(state => state.error)
  const fetchContentById = useContentStore(state => state.fetchContentById)
  const updateContent = useContentStore(state => state.updateContent)
  const deleteContent = useContentStore(state => state.deleteContent)
  
  return { 
    currentContent, 
    loading, 
    error, 
    fetchContentById, 
    updateContent, 
    deleteContent 
  }
}