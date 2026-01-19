// Contentful CMS types and interfaces

export interface ContentfulAsset {
  sys: {
    id: string;
    type: string;
    createdAt: string;
    updatedAt: string;
  };
  fields: {
    title?: string;
    file: {
      url: string;
      contentType: string;
      fileName: string;
      size: number;
    };
  };
}

export interface BlogPostFields {
  title: string;
  slug?: string;
  content: any; // Rich text content
  excerpt?: string;
  featuredImage?: ContentfulAsset;
  author?: string;
  publishedDate?: string;
  tags?: string[];
  metaDescription?: string;
  readingTime?: number;
}

export interface DocumentTemplateFields {
  title: string;
  slug?: string;
  description: string;
  category: string;
  templateFile?: ContentfulAsset;
  instructions?: any; // Rich text
  requiredFields?: string[];
  jurisdiction?: string[];
  practiceArea?: string[];
  complexity: 'simple' | 'intermediate' | 'advanced';
  estimatedTime?: number;
  price?: number;
  metaDescription?: string;
}

// Generic Contentful entry structure
export interface ContentfulEntry<T = any> {
  sys: {
    id: string;
    type: string;
    contentType: {
      sys: {
        id: string;
      };
    };
    createdAt: string;
    updatedAt: string;
    revision: number;
  };
  fields: T;
}

export type BlogPost = ContentfulEntry<BlogPostFields>;
export type DocumentTemplate = ContentfulEntry<DocumentTemplateFields>;