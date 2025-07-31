// components/content/SectionEditor.tsx
'use client'
import React, { useState } from 'react'
import { ContentSection } from '@/types/content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Save } from 'lucide-react'
import dynamic from 'next/dynamic'

const EditorComponent = dynamic(() => import('@/components/business/editor'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
})

interface SectionEditorProps {
  section: ContentSection
  onSave: (section: ContentSection) => void
  onCancel: () => void
}

export default function SectionEditor({ section, onSave, onCancel }: SectionEditorProps) {
  const [content, setContent] = useState(section.content)
  const [isQuickEdit, setIsQuickEdit] = useState(false)

  const handleSave = () => {
    const updatedSection: ContentSection = {
      ...section,
      content,
      updatedAt: new Date().toISOString()
    }
    onSave(updatedSection)
  }

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'heading': return '📝'
      case 'text': return '📄'
      case 'list': return '📋'
      case 'faq': return '❓'
      case 'cta': return '🎯'
      default: return '📄'
    }
  }

  const renderQuickEdit = () => {
    switch (section.type) {
      case 'heading':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Heading
              </label>
              <Input
                value={extractH1(content)}
                onChange={(e) => setContent(`<h1>${e.target.value}</h1>`)}
                placeholder="Enter main heading"
                className="text-lg font-semibold"
              />
            </div>
          </div>
        )
        
      case 'cta':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CTA Title
              </label>
              <Input
                value={extractCTATitle(content)}
                onChange={(e) => updateCTATitle(e.target.value)}
                placeholder="Ready to get started?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CTA Description
              </label>
              <Textarea
                value={extractCTADescription(content)}
                onChange={(e) => updateCTADescription(e.target.value)}
                placeholder="Contact us today for a free consultation"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Button Text
              </label>
              <Input
                value={extractCTAButton(content)}
                onChange={(e) => updateCTAButton(e.target.value)}
                placeholder="Get Started"
              />
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  const extractH1 = (html: string) => {
    const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
    return match ? match[1] : ''
  }

  const extractCTATitle = (html: string) => {
    const match = html.match(/<h3[^>]*>(.*?)<\/h3>/i)
    return match ? match[1] : ''
  }

  const extractCTADescription = (html: string) => {
    const match = html.match(/<p[^>]*>(.*?)<\/p>/i)
    return match ? match[1] : ''
  }

  const extractCTAButton = (html: string) => {
    const match = html.match(/<a[^>]*>(.*?)<\/a>/i)
    return match ? match[1] : ''
  }

  const updateCTATitle = (title: string) => {
    setContent(prev => prev.replace(/<h3[^>]*>.*?<\/h3>/i, `<h3>${title}</h3>`))
  }

  const updateCTADescription = (desc: string) => {
    setContent(prev => prev.replace(/<p[^>]*>.*?<\/p>/i, `<p>${desc}</p>`))
  }

  const updateCTAButton = (buttonText: string) => {
    setContent(prev => prev.replace(/(<a[^>]*>).*?(<\/a>)/i, `$1${buttonText}$2`))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getSectionIcon(section.type)}</span>
            <div>
              <h3 className="text-lg font-semibold capitalize">
                Edit {section.type} Section
              </h3>
              <p className="text-sm text-gray-500">
                Customize your content section
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQuickEdit(!isQuickEdit)}
            >
              {isQuickEdit ? 'Advanced Edit' : 'Quick Edit'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {isQuickEdit && renderQuickEdit() ? (
            renderQuickEdit()
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Content
                </label>
                <EditorComponent
                  defaultValue={content}
                  onChange={setContent}
                  label=""
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Section
          </Button>
        </div>
      </div>
    </div>
  )
}