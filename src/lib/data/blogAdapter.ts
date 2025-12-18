// lib/data/blogAdapter.ts
import { SanityPost, SanityLegalDocument } from './sanity';

export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .trim(); // Trim any leading/trailing spaces or hyphens
}

// ============================================
// SANITY ADAPTERS
// ============================================

// Convert Sanity Portable Text to HTML
function portableTextToHtml(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return '';

  return blocks
    .map((block) => {
      // Handle basic blocks
      if (block._type === 'block') {
        const children = block.children || [];
        const text = children
          .map((child: any) => {
            let content = child.text || '';

            // Apply marks (bold, italic, etc.)
            if (child.marks && child.marks.length > 0) {
              child.marks.forEach((mark: string) => {
                if (mark === 'strong') content = `<strong>${content}</strong>`;
                if (mark === 'em') content = `<em>${content}</em>`;
                if (mark === 'underline') content = `<u>${content}</u>`;
                if (mark === 'code') content = `<code class="px-1 py-0.5 bg-gray-100 rounded">${content}</code>`;
              });
            }

            return content;
          })
          .join('');

        // Apply block styles
        switch (block.style) {
          case 'h1':
            return `<h1 class="text-4xl font-bold mb-6">${text}</h1>`;
          case 'h2':
            return `<h2 class="text-3xl font-bold mb-5">${text}</h2>`;
          case 'h3':
            return `<h3 class="text-2xl font-bold mb-4">${text}</h3>`;
          case 'h4':
            return `<h4 class="text-xl font-bold mb-4">${text}</h4>`;
          case 'blockquote':
            return `<blockquote class="border-l-4 border-teal-600 pl-4 py-2 mb-6 italic">${text}</blockquote>`;
          default:
            return `<p class="mb-6">${text}</p>`;
        }
      }

      // Handle lists
      if (block._type === 'list') {
        const listItems = block.children || [];
        const items = listItems.map((item: any) => {
          const text = item.children?.map((child: any) => child.text || '').join('') || '';
          return `<li class="mb-2">${text}</li>`;
        }).join('');

        return block.listItem === 'bullet'
          ? `<ul class="list-disc pl-6 mb-6">${items}</ul>`
          : `<ol class="list-decimal pl-6 mb-6">${items}</ol>`;
      }

      // Handle images
      if (block._type === 'image') {
        const imageUrl = block.asset?.url || '';
        const alt = block.alt || 'Image';
        return `
          <div class="my-6 text-center">
            <img
              src="${imageUrl}"
              alt="${alt}"
              class="mx-auto rounded-lg max-w-full h-auto"
            />
          </div>
        `;
      }

      return '';
    })
    .join('');
}

// Extract preview text from Portable Text
function extractPortableTextPreview(blocks: any[], maxLength: number = 200): string {
  if (!blocks || !Array.isArray(blocks)) return '';

  let preview = '';
  for (const block of blocks) {
    if (block._type === 'block' && block.children) {
      const text = block.children
        .map((child: any) => child.text || '')
        .join(' ');
      preview += text + ' ';

      if (preview.length >= maxLength) break;
    }
  }

  return preview.trim().substring(0, maxLength) + (preview.length > maxLength ? '...' : '');
}

// Adapter for Sanity blog posts
export function adaptSanityBlogPost(post: SanityPost) {
  const contentHtml = portableTextToHtml(post.body);
  const excerpt = post.excerpt || extractPortableTextPreview(post.body);
  const image = post.mainImage?.asset?.url;
  const tags = post.categories?.map(cat => cat.title) || ['guides', 'legal documents', 'articles', 'news'];

  return {
    id: post._id,
    title: post.title || 'Untitled',
    preview: excerpt || '',
    content: post.body, // Keep original Portable Text
    contentHtml, // Converted HTML version
    image,
    date: new Date(post.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    link: `/blogs/${post.slug}`,
    slug: post.slug,
    tags,
    author: post.author?.name,
  };
}

// Adapter for Sanity legal documents
export function adaptSanityLegalDocument(doc: SanityLegalDocument) {
  const contentHtml = portableTextToHtml(doc.description);
  const previewHtml = doc.descriptionPreview || extractPortableTextPreview(doc.description, 150);
  const image = doc.image?.asset?.url;
  const previewImage = doc.preview?.asset?.url;

  return {
    id: doc._id,
    title: doc.title || 'Untitled',
    preview: previewHtml || '',
    description: doc.description, // Keep original Portable Text
    contentHtml, // Converted HTML version
    image,
    previewImage,
    template: doc.template?.asset ? {
      url: doc.template.asset.url,
      fileName: doc.template.asset.originalFilename || 'template',
      contentType: 'application/pdf',
      size: doc.template.asset.size,
    } : undefined,
    jurisdiction: doc.jurisdiction,
    category: doc.category || 'Uncategorized',
    date: new Date(doc._createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    link: `/legal-documents/${doc.slug}`,
    slug: doc.slug,
    tags: doc.tags || ['guides', 'legal documents', 'articles', 'news'],
  };
}

// Batch adapters
export function adaptSanityBlogPosts(posts: SanityPost[]) {
  return posts.map(adaptSanityBlogPost);
}

export function adaptSanityLegalDocuments(docs: SanityLegalDocument[]) {
  return docs.map(adaptSanityLegalDocument);
}