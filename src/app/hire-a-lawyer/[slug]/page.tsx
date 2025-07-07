// app/hire-a-lawyer/[slug]/page.tsx
import { Metadata, ResolvingMetadata } from 'next';
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import HireALawyerPage from './HireALawyerPage'
import { getLandingPage, getAllSlugs, getAllLawyerPages } from '@/lib/data/contentful'


type Props = {
  params: Promise<{ slug: string, id: string }>;
}


// ❶  Generate all pages at build‑time
export async function generateStaticParams() {
  const slugs = await getAllSlugs()          // -> ['divorce-lawyer-kenya', ...]
  return slugs.map(slug => ({ slug }))
}

// ❷  Dynamic metadata for each page
export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata>{
  try {
   const { slug } = await params;
  const allEntries = await getAllLawyerPages()
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
    alternates: { canonical: `https://wansom.ai/hire-a-lawyer/${slug}` },
    openGraph: {
      title: `${entry.fields.title}`,
      description: entry.fields.metaDescription || 'Find the best lawyers in your area.',
      images: "/images/hero.png",
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
  const preview = (await draftMode()).isEnabled
  const entry = await getLandingPage(slug)
  // if (!entry) return notFound()

  return (
    <HireALawyerPage
      location={entry.location}
      practiceArea={entry.practiceArea}
      faq={entry.faq}
    />
  )
}
