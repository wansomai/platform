import { Metadata, ResolvingMetadata } from 'next';
import { getAllBlogPosts } from '@/lib/data/contentful';
import { adaptBlogPost } from '@/lib/data/blogAdapter';
import BlogDetailPageClient from './BlogDetailPage';


type Props = {
  params: Promise<{ slug: string }>
}


// Generate metadata for each blog post
export async function generateMetadata( { params }: Props,
  parent: ResolvingMetadata): Promise<Metadata> {
  try {
    const allBlogPosts = await getAllBlogPosts();
    const blogPost = allBlogPosts.find(async(post) => {
      const postSlug = createSlug(post.fields.title);
      const { slug } = await params;
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
      openGraph: {
        title: adaptedPost.title,
        description: adaptedPost.preview,
        type: 'article',
        url: `https://wansom.co/blogs/${params}`,
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

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default async function Page({ params }: Props) {
  return <BlogDetailPageClient params={Promise.resolve(params)} />;
}
