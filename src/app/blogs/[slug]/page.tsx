import { Metadata, ResolvingMetadata } from 'next';
import { getAllBlogPosts } from '@/lib/data/contentful';
import { adaptBlogPost, createSlug } from '@/lib/data/blogAdapter';
import BlogDetailPageClient from './BlogDetailPage';

type Props = {
  params: Promise<{ slug: string, id: string }>;
}

// Generate metadata for each blog post
export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  try {
    const { slug } = await params;
    const allBlogPosts = await getAllBlogPosts();
    
    // Fix: Remove async from find callback and properly compare slugs
    const blogPost = allBlogPosts.find((post) => {
      const postSlug = createSlug(post.fields.title);
      return postSlug === slug;
    });

    if (!blogPost) {
      return {
        title: 'Blog Post Not Found | wansom AI',
        description: 'The requested blog post could not be found.',
      };
    }

    const adaptedPost = adaptBlogPost(blogPost);
    
    return {
      title: `${adaptedPost.title} | wansom AI Blog`,
      description: adaptedPost.preview || 'Read this article on legal technology and AI law insights from wansom AI.',
      keywords: adaptedPost.tags?.join(', ') || 'legal tech, AI law, legal insights',
      alternates: {
        canonical: `https://www.wansom.ai/blogs/${slug}`,
      },
      openGraph: {
        title: adaptedPost.title,
        description: adaptedPost.preview,
        type: 'article',
        url: `https://www.wansom.ai/blogs/${slug}`, // Fix: Use slug instead of params
        images: [
          {
            url: adaptedPost.image || '/images/features-1.png',
            width: 1200,
            height: 630,
            alt: adaptedPost.title,
          },
        ],
        publishedTime: adaptedPost.date,
        authors: ['wansom AI'],
        tags: adaptedPost.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: adaptedPost.title,
        description: adaptedPost.preview,
        images: [adaptedPost.image || '/images/features-1.png'],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog Post | wansom AI',
      description: 'Legal technology and AI law insights from Wansom AI.',
    };
  }
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  return <BlogDetailPageClient params={resolvedParams} />;
}