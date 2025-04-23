// lib/contentful.ts
import { createClient } from 'contentful';

// Initialize Contentful client
const client = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID || '',
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN || '',
});

export interface BlogPostFields {
  title: string;
  preview: string;
  content: any;
  image: {
    fields: {
      file: {
        url: string;
      }
    }
  }
}

export interface BlogPost {
  sys: {
    id: string;
    createdAt: string;
    updatedAt: string;
  };
  fields: BlogPostFields;
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const response = await client.getEntries({
    content_type: 'blogPost',
    order: '-sys.createdAt', // Get newest first
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

export default client;