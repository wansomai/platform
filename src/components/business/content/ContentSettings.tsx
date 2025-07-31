// components/content/ContentSettings.tsx
'use client'
import React from 'react'
import { ContentItem } from '@/types/content'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'

interface ContentSettingsProps {
  content: ContentItem
  onChange: (field: keyof ContentItem, value: any) => void
}

export default function ContentSettings({ content, onChange }: ContentSettingsProps) {
  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !content.keywords.includes(keyword.trim())) {
      onChange('keywords', [...content.keywords, keyword.trim()])
    }
  }

  const removeKeyword = (keyword: string) => {
    onChange('keywords', content.keywords.filter(k => k !== keyword))
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !content.tags.includes(tag.trim())) {
      onChange('tags', [...content.tags, tag.trim()])
    }
  }

  const removeTag = (tag: string) => {
    onChange('tags', content.tags.filter(t => t !== tag))
  }

  const handleKeywordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const target = e.target as HTMLInputElement
      addKeyword(target.value)
      target.value = ''
    }
  }

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const target = e.target as HTMLInputElement
      addTag(target.value)
      target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Page Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Title *
            </label>
            <Input
              value={content.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="Enter page title"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Appears in browser tab and search results</span>
              <span className={content.title.length > 60 ? 'text-red-500' : ''}>
                {content.title.length}/60
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <Textarea
              value={content.metaDescription || ''}
              onChange={(e) => onChange('metaDescription', e.target.value)}
              placeholder="Brief description for search engines"
              rows={3}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Appears in search results</span>
              <span className={
                (content.metaDescription?.length || 0) > 160 ? 'text-red-500' : 
                (content.metaDescription?.length || 0) < 150 ? 'text-yellow-500' : 'text-green-500'
              }>
                {content.metaDescription?.length || 0}/160
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <Textarea
              value={content.excerpt || ''}
              onChange={(e) => onChange('excerpt', e.target.value)}
              placeholder="Brief summary for content previews"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Practice Area
            </label>
            <Input
              value={content.practiceArea || ''}
              onChange={(e) => onChange('practiceArea', e.target.value)}
              placeholder="e.g. Personal Injury, Criminal Defense"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <Input
              value={content.location?.city || ''}
              onChange={(e) => onChange('location', { 
                ...content.location,
                city: e.target.value 
              })}
              placeholder="e.g. Lagos, Abuja"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">SEO Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {content.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeKeyword(keyword)}
                  />
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add keyword and press Enter"
              onKeyPress={handleKeywordKeyPress}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {content.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add tag and press Enter"
              onKeyPress={handleTagKeyPress}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">Content Stats</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Status</div>
            <div className={`font-medium capitalize ${
              content.status === 'published' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {content.status}
            </div>
          </div>
          
          <div>
            <div className="text-gray-500">Word Count</div>
            <div className="font-medium">{content.wordCount || 0}</div>
          </div>
          
          <div>
            <div className="text-gray-500">SEO Score</div>
            <div className="font-medium">
              {content.seoScore ? `${Math.round(content.seoScore)}/100` : 'N/A'}
            </div>
          </div>
          
          <div>
            <div className="text-gray-500">Views</div>
            <div className="font-medium">{content.views}</div>
          </div>
        </div>
      </div>
    </div>
  )
}