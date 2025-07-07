import { createClient } from 'contentful';

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
    'ai-legal-research',
    'ai-case-prediction',
    'document-vault',
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
  // 4. Dynamic routes (blogs, documents, lawyer pages)
  // -------------------------------------------------------------------
 const [blogPosts, legalDocs, lawyerPages] = await Promise.all([
  fetchAllEntries(client, { content_type: 'blogPost' }),
  fetchAllEntries(client, { content_type: 'documentTemplates'}),
  fetchLawyerPages(client, { content_type: 'lawyerPages' }),      // ← the new, size‑safe helper
]);

  const blogRoutes = blogPosts.map((post) => {
    const slug = slugify(post.fields.title)??NEXT_PUBLIC_BASE_URL;
    return {
      url: `${baseUrl}/blogs/${slug}`,
      lastModified: new Date(post.sys.updatedAt || post.sys.createdAt),
    };
  });

  const legalDocRoutes = legalDocs.map((doc) => {
    const slug =  slugify(doc.fields.title)??doc.fields.slug;
    return {
      url: `${baseUrl}/legal-documents/${slug}`,
      lastModified: new Date(doc.sys.updatedAt || doc.sys.createdAt),
    };
  });

  const lawyerRoutes = lawyerPages.map((page) => ({
    url: `${baseUrl}/hire-a-lawyer/${page.fields.slug}`,
    lastModified: new Date(page.sys.updatedAt || page.sys.createdAt),
  }));

  // -------------------------------------------------------------------
  // 5. Combine & return
  // -------------------------------------------------------------------
  return [...staticRoutes, ...blogRoutes, ...legalDocRoutes, ...lawyerRoutes];
}
