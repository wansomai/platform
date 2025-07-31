// types/content.ts
export interface ContentSection {
  id: string
  contentId: string
  type: 'heading' | 'text' | 'list' | 'faq' | 'cta'
  content: string // HTML content
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface ContentItem {
  id: string
  userId: string
  title: string
  slug: string
  metaTitle?: string
  metaDescription?: string
  excerpt?: string
  practiceArea?: string
  location?: {
    city: string
    state?: string
    country: string
  }
  keywords: string[]
  tags: string[]
  status: 'draft' | 'published'
  views: number
  leads: number
  wordCount?: number
  seoScore?: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
  sections: ContentSection[]
}

export type SectionType = 'heading' | 'text' | 'list' | 'faq' | 'cta'

export interface SectionTemplate {
  type: SectionType
  name: string
  icon: string
  defaultContent: string
  description: string
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    type: 'heading',
    name: 'Heading',
    icon: '📝',
    defaultContent: '<h1>New Heading</h1>',
    description: 'Main titles and subtitles'
  },
  {
    type: 'text',
    name: 'Text',
    icon: '📄',
    defaultContent: '<p>Add your content here...</p>',
    description: 'Paragraphs and formatted text'
  },
  {
    type: 'list',
    name: 'List',
    icon: '📋',
    defaultContent: '<h3>List Title</h3><ul><li>Item 1</li><li>Item 2</li></ul>',
    description: 'Bulleted or numbered lists'
  },
  {
    type: 'faq',
    name: 'FAQ',
    icon: '❓',
    defaultContent: '<h3>Questions & Answers</h3><div class="faq-item"><h4>Question?</h4><p>Answer...</p></div>',
    description: 'Questions and answers'
  },
  {
    type: 'cta',
    name: 'Call to Action',
    icon: '🎯',
    defaultContent: '<div class="cta-section"><h3>Ready to Get Started?</h3><p>Contact us today</p><a href="#contact" class="btn btn-primary">Get Started</a></div>',
    description: 'Buttons and contact forms'
  }
]