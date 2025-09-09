import { Metadata, ResolvingMetadata } from 'next';
import { getAllPractiseAreas } from '@/lib/data/contentful';
import { createSlug } from '@/lib/data/blogAdapter';
import PractiseAreaPage from './PratiseArea';
import Link from 'next/link';

type Props = {
  params: Promise<{ slug: string, id: string }>;
}

// Generate metadata for each legal document template page
export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  try {
    const { slug } = await params;
    const allEntries = await getAllPractiseAreas();
    
    // Fix: Remove async from find callback and properly compare slugs
    const entry = allEntries.find((post) => {
      const postSlug = createSlug(post.fields.title);
      return postSlug === slug;
    });

    if (!entry) {
      return {
        title: 'Legal Document Template Not Found',
        description: 'The requested legal document could not be found.',
      };
    }
    
    return {
      title: `${entry.fields.title}`,
      description: entry.fields.metaDescription || 'common legal practice areas like family law, criminal defense, personal injury, and more. Understand what these fields entail and how lawyers help',
      alternates: { canonical: `https://wansom.ai/lawyer-network/${slug}` },
      openGraph: {
        title: entry.fields.title,
        description: entry.fields.metaDescription || 'common legal practice areas.',
        type: 'article',
        url: `https://wansom.ai/lawyer-network/${slug}`, // Fix: Use slug instead of params
        images: [
          {
            url: "/law-office.jpg",
            width: 1200,
            height: 630,
            alt: entry.fields.title,
          },
        ],
        publishedTime: entry.sys.createdAt,
        authors: ['wansom.ai'],
      },
      twitter: {
        card: 'summary_large_image',
        title: entry.fields.title,
        description: entry.fields.metaDescription,
        images: ['/law-office.jpg'],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Legal practise areas | wansom AI',
      description: 'common legal practice areas like family law, criminal defense, personal injury, and more. Understand what these fields entail and how lawyers help',
    };
  }
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    const allEntries = await getAllPractiseAreas();
    
    // Fix: Remove async from find callback and properly compare slugs
    const entry = allEntries.find((post) => {
      const postSlug = createSlug(post.fields.title);
      return postSlug === slug;
    });

   if (!entry) {
    return (
            <div className="container mx-auto px-4 py-16">
        <div className="text-center flex items-center flex-col gap-3 justify-center">
          <h1 className="text-5xl font-semibold text-primary mb-4 font-serif">
            Oops!
          </h1>
          <p className="mb-6">Could not find the resource you are looking for.</p>
          <img src="/404.png" className="mx-aut0 -mt-20"/>
          <Link
            href="/"
            className="flex gap-1 items-center bg-teal-600 text-sm text-white px-6 py-2 rounded-md"
          >
            Return Home <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
</svg>

          </Link>
        </div>
      </div>
    );  
  }
  return <PractiseAreaPage 
  title={entry.fields.title}
      content={entry.fields.content}
      faq={entry.fields.faq}
      description={entry.fields.metaDescription || 'common legal practice areas like family law, criminal defense, personal injury, and more. Understand what these fields entail and how lawyers help'}
      practiceAreas={allEntries}
  />;
}