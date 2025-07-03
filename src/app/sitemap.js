// app/sitemap.js
import { createClient } from 'contentful';

// Function to create a slug from the title
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .trim(); // Trim any leading/trailing spaces or hyphens
}

export default async function sitemap() {
  const baseUrl = 'https://www.wansom.ai';

  // Initialize Contentful client
  const client = createClient({
    space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID || '',
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN || '',
  });

  // Static routes
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/hire-a-lawyer`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/demo`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/legal-documents`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/webinar`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/ai-legal-drafting`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/ai-contract-review`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/ai-due-diligence`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/ai-legal-research`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/ai-case-prediction`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/document-vault`,
      lastModified: new Date(),
    },
  ];

  // Get blog posts from Contentful
  let blogRoutes = [];
  try {
    const response = await client.getEntries({
      content_type: 'blogPost',
      order: '-sys.createdAt',
    });

    // Map blog posts to sitemap format
    blogRoutes = response.items.map(post => {
      // Create slug from title with fallback
      const slug = post.fields?.title ? createSlug(post.fields.title) : post.sys.id;
      
      return {
        url: `${baseUrl}/blogs/${slug}`,
        lastModified: new Date(post.sys.updatedAt || post.sys.createdAt),
      };
    });
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
    // Continue with static routes if Contentful fetch fails
  }

  // Get legal documents from Contentful
  let legalDocumentRoutes = [];
  try {
    const response = await client.getEntries({
      content_type: 'documentTemplates',
      order: '-sys.createdAt',
    });

    // Map legal documents to sitemap format
    legalDocumentRoutes = response.items.map(post => {
      // Create slug from title with fallback
      const slug = post.fields?.title ? createSlug(post.fields.title) : post.sys.id;
      
      return {
        url: `${baseUrl}/legal-documents/${slug}`,
        lastModified: new Date(post.sys.updatedAt || post.sys.createdAt),
      };
    });
  } catch (error) {
    console.error('Error fetching legal documents for sitemap:', error);
    // Continue with static routes if Contentful fetch fails
  }

  // Combine all routes
  const routes = [...staticRoutes, ...blogRoutes, ...legalDocumentRoutes];

  return routes;
}