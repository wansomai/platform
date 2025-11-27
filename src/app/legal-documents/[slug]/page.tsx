import { Metadata, ResolvingMetadata } from 'next';
import { getAllDocumentTemplates } from '@/lib/data/contentful';
import { adaptDocumentTemplate, createSlug } from '@/lib/data/blogAdapter';
import DocDetailPageClient from './DocumentDetails';

type Props = {
  params: Promise<{ slug: string, id: string }>;
}

// Generate static params for all document templates
export async function generateStaticParams() {
  try {
    const allDocuments = await getAllDocumentTemplates();
    return allDocuments.map((doc) => ({
      slug: createSlug(doc.fields.title),
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Generate metadata for each legal document template page
export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  try {
    const { slug } = await params;
    const allBlogPosts = await getAllDocumentTemplates();

    // Fix: Remove async from find callback and properly compare slugs
    const blogPost = allBlogPosts.find((post) => {
      const postSlug = createSlug(post.fields.title);
      return postSlug === slug;
    });

    if (!blogPost) {
      return {
        title: 'Legal Document Template Not Found',
        description: 'The requested legal document could not be found.',
      };
    }

    const adaptedPost = adaptDocumentTemplate(blogPost);

    return {
      title: `${blogPost.fields.title}`,
      description: adaptedPost.preview || 'legal document templates and AI law insights from wansom AI.',
      keywords: adaptedPost.title || 'legal document templates, Draft legal documments, legal insights',
      alternates: {
        canonical: `https://www.wansom.ai/legal-documents/${slug}`,
      },
      openGraph: {
        title: adaptedPost.title,
        description: adaptedPost.preview || 'legal document templates and AI law insights from wansom AI.',
        type: 'article',
        url: `https://www.wansom.ai/legal-documents/${slug}`, 
        images: [
          {
            url: "/contract-sample.webp",
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
        images: ['/contract-sample.webp'],
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

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

export default async function Page({ params }: Props) {
  try {
    const { slug } = await params;

    // Fetch data on the server
    const allBlogPosts = await getAllDocumentTemplates();
    const blogPost = allBlogPosts.find((post) => {
      const postSlug = createSlug(post.fields.title);
      return postSlug === slug;
    });

    if (!blogPost) {
      return <DocDetailPageClient blog={null} />;
    }

    const adaptedPost = adaptDocumentTemplate(blogPost);

    return <DocDetailPageClient blog={adaptedPost} />;
  } catch (error) {
    console.error('Error loading document:', error);
    return <DocDetailPageClient blog={null} />;
  }
}