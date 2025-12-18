import { Metadata, ResolvingMetadata } from 'next';
import { getAllLegalDocuments, getLegalDocumentBySlug } from '@/lib/data/sanity';
import { adaptSanityLegalDocument } from '@/lib/data/blogAdapter';
import DocDetailPageClient from './DocumentDetails';

type Props = {
  params: Promise<{ slug: string, id: string }>;
}

// Generate static params for all document templates
export async function generateStaticParams() {
  try {
    const allDocuments = await getAllLegalDocuments();
    return allDocuments.map((doc) => ({
      slug: doc.slug,
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
    const sanityDoc = await getLegalDocumentBySlug(slug);

    if (!sanityDoc) {
      return {
        title: 'Legal Document Template Not Found',
        description: 'The requested legal document could not be found.',
      };
    }

    const adaptedPost = adaptSanityLegalDocument(sanityDoc);

    return {
      title: `${adaptedPost.title}`,
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

    // Fetch data from Sanity
    const sanityDoc = await getLegalDocumentBySlug(slug);

    if (!sanityDoc) {
      return <DocDetailPageClient blog={null} />;
    }

    const adaptedDoc = adaptSanityLegalDocument(sanityDoc);

    return <DocDetailPageClient blog={adaptedDoc} />;
  } catch (error) {
    console.error('Error loading document:', error);
    return <DocDetailPageClient blog={null} />;
  }
}