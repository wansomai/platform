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

export interface LawyerPageFields {
  title: string;
  slug?: string;
  description: string;
  practiceAreas: string[];
  location: string;
  experience?: number;
  education?: string[];
  certifications?: string[];
  profileImage?: ContentfulAsset;
  contactInfo?: {
    email: string;
    phone: string;
    website?: string;
  };
  metaDescription?: string;
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

export interface PracticeAreaFields {
  title: string;
  slug?: string;
  description: string;
  overview?: any; // Rich text
  services?: string[];
  typicalCases?: string[];
  relatedAreas?: string[];
  heroImage?: ContentfulAsset;
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
export type LawyerPage = ContentfulEntry<LawyerPageFields>;
export type DocumentTemplate = ContentfulEntry<DocumentTemplateFields>;
export type PracticeArea = ContentfulEntry<PracticeAreaFields>;