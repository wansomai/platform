import { createClient } from 'contentful';
import { createClient as createSanityClient } from '@sanity/client';

// Revalidate once per hour (in seconds)
export const revalidate = 3600;

/* Helpers ------------------------------------------------------------- */

const slugify = (str = '') =>
  str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

/** Fetch *all* entries for a content type (handles pagination). */
async function fetchAllEntries(client, { content_type }) {
  const pageSize = 1000; // Contentful hard max
  let skip = 0;
  let items = [];
  while (true) {
    const res = await client.getEntries({ content_type,  select: 'fields.title,sys.createdAt,sys.updatedAt' ,skip, limit: pageSize });
    items = items.concat(res.items);
    if (skip + pageSize >= res.total) break;
    skip += pageSize;
  }
  return items;
}

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
    process.env.NEXT_PUBLIC_BASE_URL ??'https://www.wansom.ai';

  // -------------------------------------------------------------------
  // 2. Init Contentful
  // -------------------------------------------------------------------
  const client = createClient({
    space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID,
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
  });

  // -------------------------------------------------------------------
  // 3. Static routes
  // -------------------------------------------------------------------
  const staticRoutes = [
    '',
    'hire-a-lawyer',
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
  ].map((path) => ({
    url: `${baseUrl}/${path}`,
    lastModified: new Date(),
  }));

  async function fetchLawyerPages(client,{ content_type }) {
  const limit = 1000;                       // CDN hard limit
  let skip = 0;
  const items = [];

  while (true) {
    const res = await client.getEntries({
      content_type,
      select: 'fields.slug,sys.createdAt,sys.updatedAt', // only what we need
      limit,
      skip,
    });

    items.push(...res.items);
    if (res.items.length < limit) break;
    skip += limit;
  }
  return items;
}

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
    console.log(`Sitemap: Fetched ${blogPosts.length} Sanity blog posts`);
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
    console.log(`Sitemap: Fetched ${legalDocs.length} Sanity legal documents`);
  } catch (error) {
    console.error('Error fetching Sanity legal documents for sitemap:', error);
  }

  // Fetch lawyer pages and practice areas from Contentful (still using Contentful)
  const [lawyerPages, practiceAreas] = await Promise.all([
    fetchLawyerPages(client, { content_type: 'lawyerPages' }),
    fetchAllEntries(client, { content_type: 'practiseareas'}),
  ]);

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
    const practiseAreaRoutes = practiceAreas.map((area) => {
    const slug =  slugify(area.fields.title)??area.fields.slug;
    return {
      url: `${baseUrl}/lawyer-network/${slug}`,
      lastModified: new Date(area.sys.updatedAt || area.sys.createdAt),
    };
  });

  const lawyerRoutes = lawyerPages.map((page) => ({
    url: `${baseUrl}/hire-a-lawyer/${page.fields.slug}`,
    lastModified: new Date(page.sys.updatedAt || page.sys.createdAt),
  }));

  // -------------------------------------------------------------------
  // 5. Combine & return
  // -------------------------------------------------------------------
  return [...staticRoutes, ...blogRoutes, ...legalDocRoutes, ...lawyerRoutes, ...practiseAreaRoutes]
}
