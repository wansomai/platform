// components/content/SectionRenderer.tsx
'use client'
import React from 'react'
import { ContentSection } from '@/types/content'

interface SectionRendererProps {
  section: ContentSection
  isEditing?: boolean
  onEdit?: (section: ContentSection) => void
  onDelete?: (sectionId: string) => void
  onMoveUp?: (sectionId: string) => void
  onMoveDown?: (sectionId: string) => void
}

export default function SectionRenderer({
  section,
  isEditing = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown
}: SectionRendererProps) {
  const getSectionClassName = (type: string) => {
    const baseClass = 'content-section'
    const typeClass = `section-${type}`
    const editClass = isEditing ? 'editing-mode' : ''
    
    return `${baseClass} ${typeClass} ${editClass}`.trim()
  }

  const handleEdit = () => {
    if (onEdit) onEdit(section)
  }

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this section?')) {
      onDelete(section.id)
    }
  }

  return (
    <div className={getSectionClassName(section.type)}>
      {isEditing && (
        <div className="section-toolbar">
          <div className="section-type-badge">
            {section.type}
          </div>
          <div className="section-actions">
            <button 
              onClick={() => onMoveUp?.(section.id)}
              className="btn-icon"
              title="Move up"
            >
              ↑
            </button>
            <button 
              onClick={() => onMoveDown?.(section.id)}
              className="btn-icon"
              title="Move down"
            >
              ↓
            </button>
            <button 
              onClick={handleEdit}
              className="btn-icon"
              title="Edit section"
            >
              ✏️
            </button>
            <button 
              onClick={handleDelete}
              className="btn-icon btn-danger"
              title="Delete section"
            >
              🗑️
            </button>
          </div>
        </div>
      )}
      
      <div 
        className="section-content"
        dangerouslySetInnerHTML={{ __html: section.content }}
        onClick={isEditing ? handleEdit : undefined}
      />
      
      {isEditing && (
        <div className="section-overlay">
          <button 
            onClick={handleEdit}
            className="edit-overlay-button"
          >
            Click to edit
          </button>
        </div>
      )}
    </div>
  )
}