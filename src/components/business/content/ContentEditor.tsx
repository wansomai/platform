// components/content/ContentEditor.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ContentItem, ContentSection, SECTION_TEMPLATES } from '@/types/content'
import SectionRenderer from './SectionRenderer'
import SectionEditor from './SectionEditor'
import ContentSettings from './ContentSettings'
import { Button } from '@/components/ui/button'
import { Save, Eye, Globe, Plus, ArrowLeft } from 'lucide-react'

interface ContentEditorProps {
  contentId?: string // If editing existing content
  initialContent?: Partial<ContentItem>
}

export default function ContentEditor({ contentId, initialContent }: ContentEditorProps) {
  const router = useRouter()
  const [content, setContent] = useState<ContentItem | null>(null)
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null)
  const [isLoading, setIsLoading] = useState(!!contentId)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)

  // Load existing content or initialize new content
  useEffect(() => {
    if (contentId) {
      loadContent(contentId)
    } else {
      // Initialize new content
      const newContent: ContentItem = {
        id: '',
        userId: '',
        title: initialContent?.title || 'Untitled Content',
        slug: '',
        metaTitle: initialContent?.metaTitle,
        metaDescription: initialContent?.metaDescription,
        excerpt: initialContent?.excerpt,
        practiceArea: initialContent?.practiceArea,
        location: initialContent?.location,
        keywords: initialContent?.keywords || [],
        tags: initialContent?.tags || [],
        status: 'draft',
        views: 0,
        leads: 0,
        wordCount: 0,
        seoScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: initialContent?.sections || [
          {
            id: 'temp-1',
            contentId: '',
            type: 'heading',
            content: '<h1>New Content</h1>',
            orderIndex: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
      setContent(newContent)
      setIsLoading(false)
    }
  }, [contentId, initialContent])

  const loadContent = async (id: string) => {
    try {
      const response = await fetch(`/api/content/${id}`)
      if (!response.ok) throw new Error('Failed to load content')
      
      const data = await response.json()
      setContent(data.content)
    } catch (error) {
      console.error('Error loading content:', error)
      // Handle error - maybe redirect to content list
    } finally {
      setIsLoading(false)
    }
  }

  const saveContent = async () => {
    if (!content || isSaving) return

    setIsSaving(true)
    try {
      const url = contentId ? `/api/content/${contentId}` : '/api/content'
      const method = contentId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      })

      if (!response.ok) throw new Error('Failed to save content')
      
      const data = await response.json()
      setContent(data.content)
      setLastSaved(new Date())
      
      // If this was a new content, redirect to edit mode
      if (!contentId && data.content.id) {
        router.push(`/dashboard/content/${data.content.id}/edit`)
      }
    } catch (error) {
      console.error('Error saving content:', error)
      // Show error message
    } finally {
      setIsSaving(false)
    }
  }

  const updateContentField = (field: keyof ContentItem, value: any) => {
    if (!content) return
    
    setContent({
      ...content,
      [field]: value,
      updatedAt: new Date().toISOString()
    })
  }

  const addSection = (type: ContentSection['type'], afterIndex?: number) => {
    if (!content) return

    const template = SECTION_TEMPLATES.find(t => t.type === type)
    if (!template) return

    const newSection: ContentSection = {
      id: `temp-${Date.now()}`,
      contentId: content.id,
      type,
      content: template.defaultContent,
      orderIndex: afterIndex !== undefined ? afterIndex + 1 : content.sections.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Insert section at the right position
    const newSections = [...content.sections]
    if (afterIndex !== undefined) {
      newSections.splice(afterIndex + 1, 0, newSection)
      // Update order indices
      newSections.forEach((section, index) => {
        section.orderIndex = index
      })
    } else {
      newSections.push(newSection)
    }

    setContent({
      ...content,
      sections: newSections,
      updatedAt: new Date().toISOString()
    })

    setShowAddSection(false)
    setEditingSection(newSection)
  }

  const updateSection = (updatedSection: ContentSection) => {
    if (!content) return

    const newSections = content.sections.map(section =>
      section.id === updatedSection.id ? updatedSection : section
    )

    setContent({
      ...content,
      sections: newSections,
      updatedAt: new Date().toISOString()
    })

    setEditingSection(null)
  }

  const deleteSection = (sectionId: string) => {
    if (!content) return

    const newSections = content.sections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({ ...section, orderIndex: index }))

    setContent({
      ...content,
      sections: newSections,
      updatedAt: new Date().toISOString()
    })
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!content) return

    const sections = [...content.sections]
    const currentIndex = sections.findIndex(s => s.id === sectionId)
    
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= sections.length) return

    // Swap sections
    [sections[currentIndex], sections[newIndex]] = [sections[newIndex], sections[currentIndex]]
    
    // Update order indices
    sections.forEach((section, index) => {
      section.orderIndex = index
    })

    setContent({
      ...content,
      sections,
      updatedAt: new Date().toISOString()
    })
  }

  const publishContent = async () => {
    if (!content) return

    const publishedContent = {
      ...content,
      status: 'published' as const,
      publishedAt: new Date().toISOString()
    }

    setContent(publishedContent)
    await saveContent()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading content...</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load content</p>
          <Button onClick={() => router.push('/dashboard/content')}>
            Back to Content
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Navigation */}
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/content')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Content
              </Button>

              {/* Content Settings */}
              <ContentSettings
                content={content}
                onChange={updateContentField}
              />

              {/* Save Actions */}
              <div className="space-y-3">
                <Button 
                  onClick={saveContent} 
                  disabled={isSaving}
                  className="w-full flex items-center gap-2"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>

                <Button 
                  onClick={() => router.push(`/dashboard/content/${content.id}/preview`)}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>

                {content.status !== 'published' && (
                  <Button 
                    onClick={publishContent}
                    className="w-full flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    Publish
                  </Button>
                )}

                {lastSaved && (
                  <p className="text-xs text-gray-500 text-center">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </p>
                )}
              </div>

              {/* Add Section */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Add Section</h3>
                {SECTION_TEMPLATES.map(template => (
                  <button
                    key={template.type}
                    onClick={() => addSection(template.type)}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{template.icon}</span>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-gray-500">{template.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 min-h-screen">
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Content Editor</h1>
                
                {/* Content Sections */}
                <div className="space-y-4">
                  {content.sections
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((section, index) => (
                      <div key={section.id} className="relative">
                        <SectionRenderer
                          section={section}
                          isEditing={true}
                          onEdit={setEditingSection}
                          onDelete={deleteSection}
                          onMoveUp={() => moveSection(section.id, 'up')}
                          onMoveDown={() => moveSection(section.id, 'down')}
                        />
                        
                        {/* Add section between */}
                        <button
                          onClick={() => setShowAddSection(true)}
                          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-primary-hover transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                  {content.sections.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500 mb-4">No content sections yet</p>
                      <Button onClick={() => setShowAddSection(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Section
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Editor Modal */}
      {editingSection && (
        <SectionEditor
          section={editingSection}
          onSave={updateSection}
          onCancel={() => setEditingSection(null)}
        />
      )}
    </div>
  )
}