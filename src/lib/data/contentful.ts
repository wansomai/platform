// lib/contentful.ts
import { createClient } from 'contentful';

// Initialize Contentful client
const client = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID || '',
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN || '',
});

export interface BlogPostFields {
  title: string;
  preview?: string;
  content: any; // Rich text content
  image?: {
    fields: {
      file: {
        url: string;
        details?: {
          size?: number;
          image?: {
            width: number;
            height: number;
          };
        };
        fileName?: string;
        contentType?: string;
      },
      title?: string;
      description?: string;
    }
  };
  tags?: string[]; // Optional tags field
}

export interface BlogPost {
  sys: {
    id: string;
    createdAt: string;
    updatedAt: string;
    contentType: {
      sys: {
        id: string;
      };
    };
  };
  fields: BlogPostFields;
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const response = await client.getEntries({
    content_type: 'blogPost',
    order: ['-sys.createdAt'], // Get newest first
  });
  
  return response.items as unknown as BlogPost[];
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const response = await client.getEntry(id);
    return response as unknown as BlogPost;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

// Get blog posts by tag
export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  const response = await client.getEntries({
    content_type: 'blogPost',
    'fields.tags': tag,
    order: ['-sys.createdAt'], // Get newest first
  });
  
  return response.items as unknown as BlogPost[];
}

// Get related blog posts (excluding the current one)
export async function getRelatedBlogPosts(
  currentPostId: string, 
  tags: string[] = [], 
  limit: number = 3
): Promise<BlogPost[]> {
  try {
    const queryParams = {
      content_type: 'blogPost',
      'sys.id[ne]': currentPostId,
      order: '-sys.createdAt',
      limit,
      ...(tags.length && { 'fields.tags[in]': tags.join(',') })
    };

    const response = await client.getEntries(queryParams);
    
    if (!response.items) {
      console.warn('No related posts found');
      return [];
    }

    return response.items as unknown as BlogPost[];
  } catch (error) {
    console.error('Error fetching related blog posts:', error);
    return [];
  }
}

export default client;