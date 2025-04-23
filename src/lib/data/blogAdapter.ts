// lib/data/blogAdapter.ts
import { BlogPost } from './contentful';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';

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

// This adapter transforms Contentful blog data to the format expected by your components
export function adaptBlogPost(post: BlogPost) {
  // Convert rich text to HTML
  const contentHtml = post.fields.content 
    ? documentToHtmlString(post.fields.content, htmlRenderOptions)
    : '';
  
  // Extract potential tags from metadata or use default ones
  const tags = post.fields.tags || ['HR', 'Workplace', 'Legal'];
  
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
    link: `/blogs/${post.sys.id}`,
    tags,
  };
}

export function adaptBlogPosts(posts: BlogPost[]) {
  return posts.map(adaptBlogPost);
}