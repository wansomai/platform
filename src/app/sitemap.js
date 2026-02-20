import { createClient as createSanityClient } from '@sanity/client';

// Revalidate once per hour (in seconds)
export const revalidate = 3600;

// Initialize Sanity client
const sanityClient = createSanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  useCdn: true,
});

/* Main sitemap generator --------------------------------------------- */
export default async function sitemap() {
  // -------------------------------------------------------------------
  // 1. Resolve base URL dynamically (falls back to prod URL)
  // -------------------------------------------------------------------
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.wansom.ai';

  // -------------------------------------------------------------------
  // 3. Static routes
  // -------------------------------------------------------------------
  const staticRoutes = [
    '',
    'pricing',
    'demo',
    'blogs',
    'legal-documents',
    'contact',
    'careers',
    'webinar',
    'ai-legal-drafting',
    'ai-contract-review',
    'ai-due-diligence',
    'ai-assistant',
    'document-vault',
    'solutions/in-house-counsel',
    'solutions/litigation-lawyers',
    'solutions/ma-lawyers',
    'programs/law-schools',
    'briefly-by-wansom',
  ].map((path) => ({
    url: `${baseUrl}/${path}`,
    lastModified: new Date(),
  }));

  // -------------------------------------------------------------------
  // 4. Dynamic routes (blogs and documents from Sanity)
  // -------------------------------------------------------------------

  // Fetch blog posts from Sanity
  let blogPosts = [];
  try {
    const query = `*[_type == "post"] {
      "slug": slug.current,
      publishedAt,
      _updatedAt
    }`;
    blogPosts = await sanityClient.fetch(query);
  } catch (error) {
    console.error('Error fetching Sanity blog posts for sitemap:', error);
  }

  // Fetch legal documents from Sanity
  let legalDocs = [];
  try {
    const query = `*[_type == "legalDocument"] {
      "slug": slug.current,
      _createdAt,
      _updatedAt
    }`;
    legalDocs = await sanityClient.fetch(query);
  } catch (error) {
    console.error('Error fetching Sanity legal documents for sitemap:', error);
  }

  const blogRoutes = blogPosts.map((post) => {
    return {
      url: `${baseUrl}/blogs/${post.slug}`,
      lastModified: new Date(post._updatedAt || post.publishedAt),
    };
  });

  const legalDocRoutes = legalDocs.map((doc) => {
    return {
      url: `${baseUrl}/legal-documents/${doc.slug}`,
      lastModified: new Date(doc._updatedAt || doc._createdAt),
    };
  });

  // -------------------------------------------------------------------
  // 5. Combine & return
  // -------------------------------------------------------------------
  return [...staticRoutes, ...blogRoutes, ...legalDocRoutes]
}
