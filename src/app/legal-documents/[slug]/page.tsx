import { Metadata, ResolvingMetadata } from 'next';
import { getAllDocumentTemplates } from '@/lib/data/contentful';
import { adaptDocumentTemplate } from '@/lib/data/blogAdapter';
import DocDetailPageClient from './DocumentDetails';


type Props = {
  params: Promise<{ slug: string,id: string }>;
}


// Generate metadata for each blog post
export async function generateMetadata( { params }: Props,
  parent: ResolvingMetadata): Promise<Metadata> {
  try {
    const allBlogPosts = await getAllDocumentTemplates();
    const blogPost = allBlogPosts.find(async(post) => {
      const postSlug = createSlug(post.fields.title);
      const { slug } = await params;
      return postSlug === slug;
    });

    if (!blogPost) {
      return {
        title: 'Legal Document Template Not Found | wansom AI',
        description: 'The requested legal document could not be found.',
      };
    }

    const adaptedPost = adaptDocumentTemplate(blogPost);
    
    return {
      title: `${adaptedPost.title} | wansom AI Blog`,
      description: adaptedPost.preview || 'legal document templates and AI law insights from wansom AI.',
      keywords: adaptedPost.title || 'legal document templates, Draft legal documments, legal insights',
      openGraph: {
        title: adaptedPost.title,
        description: adaptedPost.preview || 'legal document templates and AI law insights from wansom AI.',
        type: 'article',
        url: `https://wansom.ai/legal-documents/${params}`,
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
      title: 'Legal document templates | wansom AI',
      description: 'legal document templates, Draft legal documments, legal insights',
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
  const resolvedParams = await params;
  return <DocDetailPageClient params={resolvedParams} />;
}
