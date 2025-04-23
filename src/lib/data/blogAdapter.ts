// lib/data/blogAdapter.ts
import { BlogPost } from './contentful';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';

// Simple HTML renderer options for Contentful Rich Text
const htmlRenderOptions = {
  renderMark: {
    [MARKS.BOLD]: (text: string) => `<strong>${text}</strong>`,
    [MARKS.ITALIC]: (text: string) => `<em>${text}</em>`,
    [MARKS.UNDERLINE]: (text: string) => `<u>${text}</u>`,
    [MARKS.CODE]: (text: string) => `<code>${text}</code>`,
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node: any, next: any) => `<p>${next(node.content)}</p>`,
    [BLOCKS.HEADING_1]: (node: any, next: any) => `<h1>${next(node.content)}</h1>`,
    [BLOCKS.HEADING_2]: (node: any, next: any) => `<h2>${next(node.content)}</h2>`,
    [BLOCKS.HEADING_3]: (node: any, next: any) => `<h3>${next(node.content)}</h3>`,
    [BLOCKS.HEADING_4]: (node: any, next: any) => `<h4>${next(node.content)}</h4>`,
    [BLOCKS.UL_LIST]: (node: any, next: any) => `<ul>${next(node.content)}</ul>`,
    [BLOCKS.OL_LIST]: (node: any, next: any) => `<ol>${next(node.content)}</ol>`,
    [BLOCKS.LIST_ITEM]: (node: any, next: any) => `<li>${next(node.content)}</li>`,
    [BLOCKS.QUOTE]: (node: any, next: any) => `<blockquote>${next(node.content)}</blockquote>`,
    [BLOCKS.HR]: () => `<hr />`,
    [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
      const { url, title } = node.data.target.fields.file;
      return `<img src="https:${url}" alt="${title || 'Blog image'}" class="max-w-full h-auto rounded my-4" />`;
    },
    [INLINES.HYPERLINK]: (node: any, next: any) => {
      const href = node.data.uri;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${next(node.content)}</a>`;
    },
  },
};

// This adapter transforms Contentful blog data to the format expected by your components
export function adaptBlogPost(post: BlogPost) {
  // Convert rich text to HTML
  const contentHtml = post.fields.content 
    ? documentToHtmlString(post.fields.content, htmlRenderOptions)
    : '';
  
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
    link: `/blog/${post.sys.id}`,
  };
}

export function adaptBlogPosts(posts: BlogPost[]) {
  return posts.map(adaptBlogPost);
}