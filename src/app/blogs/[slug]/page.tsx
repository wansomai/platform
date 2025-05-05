import { Metadata } from 'next';
import { getAllBlogPosts } from '@/lib/data/contentful';
import { adaptBlogPost } from '@/lib/data/blogAdapter';
import BlogDetailPageClient from './BlogDetailPage';

// Generate metadata for each blog post
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const allBlogPosts = await getAllBlogPosts();
    const blogPost = allBlogPosts.find(post => {
      const postSlug = createSlug(post.fields.title);
      return postSlug === params.slug;
    });

    if (!blogPost) {
      return {
        title: 'Blog Post Not Found | WakiliChat',
        description: 'The requested blog post could not be found.',
      };
    }

    const adaptedPost = adaptBlogPost(blogPost);
    
    return {
      title: `${adaptedPost.title} | WakiliChat Blog`,
      description: adaptedPost.preview || 'Read this article on legal technology and AI law insights from WakiliChat.',
      keywords: adaptedPost.tags?.join(', ') || 'legal tech, AI law, legal insights',
      openGraph: {
        title: adaptedPost.title,
        description: adaptedPost.preview,
        type: 'article',
        url: `https://wakilichat.com/blogs/${params.slug}`,
        images: [
          {
            url: adaptedPost.image || '/og-blog-default.jpg',
            width: 1200,
            height: 630,
            alt: adaptedPost.title,
          },
        ],
        publishedTime: adaptedPost.date,
        authors: ['WakiliChat'],
        tags: adaptedPost.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: adaptedPost.title,
        description: adaptedPost.preview,
        images: [adaptedPost.image || '/og-blog-default.jpg'],
      },
    };
  } catch (error) {
    return {
      title: 'Blog Post | WakiliChat',
      description: 'Legal technology and AI law insights from WakiliChat.',
    };
  }
}

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default BlogDetailPageClient;
