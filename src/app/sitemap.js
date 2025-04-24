// app/sitemap.js
import { createClient } from 'contentful';

export default async function sitemap() {
  const baseUrl = 'https://wansom.co';

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
      alternates: {
        languages: {
          es: `${baseUrl}/es`,
          de: `${baseUrl}/de`,
        },
      },
    },
    {
      url: `${baseUrl}/hire-a-lawyer`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/es/hire-a-lawyer`,
          de: `${baseUrl}/de/hire-a-lawyer`,
        },
      },
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/es/pricing`,
          de: `${baseUrl}/de/pricing`,
        },
      },
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/blogs`,
          de: `${baseUrl}/blogs`,
        },
      },
    },
    {
      url: `${baseUrl}/legal-documents`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/legal-documents`,
          de: `${baseUrl}/legal-documents`,
        },
      },
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/contact`,
          de: `${baseUrl}/contact`,
        },
      },
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: new Date(),
      alternates: {
        languages: {
          es: `${baseUrl}/careers`,
          de: `${baseUrl}/careers`,
        },
      },
    },
  ];

  // Get blog posts from Contentful
  let blogRoutes = [];
  try {
    const response = await client.getEntries({
      content_type: 'blogPost',
      order: ['-sys.createdAt'],
    });

    // Map blog posts to sitemap format
    blogRoutes = response.items.map(post => ({
      url: `${baseUrl}/blogs/${post.sys.id}`,
      lastModified: new Date(post.sys.updatedAt || post.sys.createdAt),
  
    }));
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
    // Continue with static routes if Contentful fetch fails
  }

  // Combine all routes
  const routes = [...staticRoutes, ...blogRoutes];

  return routes;
}