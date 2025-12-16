// lib/data/blogAdapter.ts
import { BlogPost as ContentfulBlogPost, DocumentTemplate } from './contentful';
import { WordPressPost } from './wordpress';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';

export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .trim(); // Trim any leading/trailing spaces or hyphens
}

// HTML renderer options for Contentful Rich Text
const htmlRenderOptions = {
  renderMark: {
    [MARKS.BOLD]: (text: string) => `<strong>${text}</strong>`,
    [MARKS.ITALIC]: (text: string) => `<em>${text}</em>`,
    [MARKS.UNDERLINE]: (text: string) => `<u>${text}</u>`,
    [MARKS.CODE]: (text: string) => `<code class="px-1 py-0.5 bg-gray-100 rounded">${text}</code>`,
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node: any, next: any) => `<p class="mb-6">${next(node.content)}</p>`,
    [BLOCKS.HEADING_1]: (node: any, next: any) => `<h1 class="text-4xl font-bold mb-6">${next(node.content)}</h1>`,
    [BLOCKS.HEADING_2]: (node: any, next: any) => `<h2 class="text-3xl font-bold mb-5">${next(node.content)}</h2>`,
    [BLOCKS.HEADING_3]: (node: any, next: any) => `<h3 class="text-2xl font-bold mb-4">${next(node.content)}</h3>`,
    [BLOCKS.HEADING_4]: (node: any, next: any) => `<h4 class="text-xl font-bold mb-4">${next(node.content)}</h4>`,
    [BLOCKS.UL_LIST]: (node: any, next: any) => `<ul class="list-disc pl-6 mb-6">${next(node.content)}</ul>`,
    [BLOCKS.OL_LIST]: (node: any, next: any) => `<ol class="list-decimal pl-6 mb-6">${next(node.content)}</ol>`,
    [BLOCKS.LIST_ITEM]: (node: any, next: any) => `<li class="mb-2">${next(node.content)}</li>`,
    [BLOCKS.QUOTE]: (node: any, next: any) => `<blockquote class="border-l-4 border-teal-600 pl-4 py-2 mb-6 italic">${next(node.content)}</blockquote>`,
    [BLOCKS.HR]: () => `<hr class="my-8 border-t border-gray-200" />`,
    [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
      const { url, title, description } = node.data.target.fields.file;
      return `
        <div class="my-6 text-center">
          <img
            src="https:${url}"
            alt="${title || 'Blog image'}"
            class="mx-auto rounded-lg max-w-full h-auto"
          />
          ${description ? `<p class="text-center text-sm text-gray-500 mt-2">${description}</p>` : ''}
        </div>
      `;
    },
    [INLINES.HYPERLINK]: (node: any, next: any) => {
      const href = node.data.uri;
      return `<a href="${href}" target="${href.startsWith('http') ? '_blank' : '_self'}" rel="noopener noreferrer" class="text-teal-600 hover:underline">${next(node.content)}</a>`;
    },
  },
};

// Clean WordPress HTML content
function cleanWordPressHtml(html: string): string {
  return html
    .replace(/\[&hellip;\]/g, '...')
    .replace(/&#8230;/g, '...')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"');
}

// Extract tags from WordPress post
function extractTags(post: WordPressPost): string[] {
  if (post._embedded?.['wp:term']) {
    // WordPress returns terms as an array of arrays
    // Index 1 typically contains tags (0 is categories)
    const tagTerms = post._embedded['wp:term'][1] || [];
    return tagTerms.map((tag: any) => tag.name);
  }
  return ['guides', 'legal documents', 'articles', 'news'];
}

// Extract featured image from WordPress post
function extractFeaturedImage(post: any): string | undefined {
  // Check if featured_image_url was already fetched (from API route)
  if (post.featured_image_url) {
    return post.featured_image_url;
  }
  // Fallback to embedded media
  if (post._embedded?.['wp:featuredmedia']?.[0]) {
    return post._embedded['wp:featuredmedia'][0].source_url;
  }
  return undefined;
}

// Strip HTML tags for preview text
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

// Adapter for WordPress posts
export function adaptWordPressBlogPost(post: WordPressPost) {
  const contentHtml = cleanWordPressHtml(post.content.rendered);
  const excerpt = stripHtmlTags(cleanWordPressHtml(post.excerpt.rendered));
  const tags = extractTags(post);
  const image = extractFeaturedImage(post);

  return {
    id: post.id.toString(),
    title: post.title.rendered || 'Untitled',
    preview: excerpt || '',
    content: post.content.rendered, // Keep original HTML content
    contentHtml, // Cleaned HTML version for dangerouslySetInnerHTML
    image,
    date: new Date(post.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    link: `/blogs/${post.slug}`,
    slug: post.slug,
    tags,
  };
}

// This adapter transforms Contentful blog data to the format expected by your components
export function adaptBlogPost(post: ContentfulBlogPost) {
  // Convert rich text to HTML
  const contentHtml = post.fields.content
    ? documentToHtmlString(post.fields.content, htmlRenderOptions)
    : '';

  // Generate slug from title
  const slug = createSlug(post.fields.title || '');
  const tags = post.fields.tags || ['guides', 'legal documents', 'articles', 'news'];

  return {
    id: post.sys.id,
    title: post.fields.title || 'Untitled',
    preview: post.fields.preview || '',
    content: post.fields.content, // Keep original content
    contentHtml, // Add the HTML version for dangerouslySetInnerHTML
    image: post.fields.image?.fields?.file?.url
      ? `https:${post.fields.image.fields.file.url}`
      : undefined,
    date: new Date(post.sys.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    link: `/blogs/${slug}`,
    slug,
    tags,
  };
}

export function adaptDocumentTemplate(post: DocumentTemplate) {
  // Convert rich text to HTML
  const contentHtml = post.fields.description
    ? documentToHtmlString(post.fields.description, htmlRenderOptions)
    : '';
  const previewHtml = post.fields.preview
    ? documentToHtmlString(post.fields.preview, htmlRenderOptions)
    : '';
  // Generate slug from title
  const slug = createSlug(post.fields.title || '');
  const tags = post.fields.tags || ['guides', 'legal documents', 'articles', 'news'];

  return {
    id: post.sys.id,
    title: post.fields.title || 'Untitled',
    preview: previewHtml || '',
    description: post.fields.description, // Keep original content
    contentHtml, // Add the HTML version for dangerouslySetInnerHTML
    image: post.fields.image?.fields?.file?.url
      ? `https:${post.fields.image.fields.file.url}`
      : undefined,
    template: post.fields.template?.fields?.file ? {
      url: `https:${post.fields.template.fields.file.url}`,
      fileName: post.fields.template.fields.file.fileName || 'template',
      contentType: post.fields.template.fields.file.contentType,
    } : undefined,
    jurisdiction: post.fields.jurisdiction,
    category: post.fields?.category || 'Uncategorized',
    date: new Date(post.sys.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    link: `/legal-documents/${slug}`,
    slug,
    tags,
  };
}

export function adaptBlogPosts(posts: ContentfulBlogPost[]) {
  return posts.map(adaptBlogPost);
}

export function adaptWordPressBlogPosts(posts: WordPressPost[]) {
  return posts.map(adaptWordPressBlogPost);
}

export function adaptDocumentTemplates(posts: DocumentTemplate[]) {
  return posts.map(adaptDocumentTemplate);
}