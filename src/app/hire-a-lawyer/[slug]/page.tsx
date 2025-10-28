// app/hire-a-lawyer/[slug]/page.tsx
import { Metadata, ResolvingMetadata } from 'next';
import HireALawyerPage from './HireALawyerPage'
import { getAllSlugs, getAllPractiseAreas,fetchAllEntries } from '@/lib/data/contentful'
import Link from 'next/link';


type Props = {
  params: Promise<{ slug: string, id: string }>;
}


// ❶  Generate all pages at build‑time
export async function generateStaticParams() {
  const slugs = await getAllSlugs()  
  return slugs.map(slug => ({ slug }))
}

// ❷  Dynamic metadata for each page
export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata>{
  try {
   const { slug } = await params;
  const allEntries = await fetchAllEntries('lawyerPages' )
   const entry = allEntries.find((post) => {
      return post.fields.slug === slug;
    });
    if (!entry) {
      return {
        title: 'No lawyers match your search criteria',
        description: 'No lawyers match your search criteria.Search again or try a different location.',
      };
      
    }
    
  return {
    title: `${entry.fields.title}`,
    description: entry.fields.metaDescription || 'Find the best lawyers in your area.',
    alternates: {
      canonical: `https://www.wansom.ai/hire-a-lawyer/${slug}`
    },

    openGraph: {
      title: `${entry.fields.title}`,
      description: entry.fields.metaDescription || 'Find the best lawyers in your area.',
      images: "/images/hero.png",
      url: `https://www.wansom.ai/hire-a-lawyer/${slug}`,
      siteName: 'Wansom AI',
      locale: 'en-US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${entry.fields.title}`,
      description: entry.fields.metaDescription || 'Find the best lawyers in your area.',
      images: ['/images/hero.png'],
    },
  }
} catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Something went wrong',
      description: 'An error occurred while fetching lawyers.',
    };
  }
}

// ❸  Page component
export default async function Page({ params }: Props) {
   const { slug } = await params;
    const allEntries = await fetchAllEntries('lawyerPages' )
    const allAreas = await getAllPractiseAreas();
        
   const entry = allEntries.find((post) => {
      return post.fields.slug === slug;
    });
  // if (!entry) return notFound()
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
  return (
    <HireALawyerPage
      location={entry.fields.location}
      practiceArea={entry.fields.practiceArea}
      faq={entry.fields.faq}
      areas={allAreas}
    />
  )
}
