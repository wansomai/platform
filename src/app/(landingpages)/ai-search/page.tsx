
import { Metadata } from 'next';
import AISearchPage from './AISearchPage';


export const metadata: Metadata = {
    title: "Wansom AI Academy | Legal AI Search Platform",
    description: "Wansom AI Academy is the leading marketing and SEO automation platform for lawyers.",
    alternates: {
      canonical: '/ai-search',
    },
    openGraph: {
      title: 'Wansom AI Academy',
      description: 'Wansom AI Academy is the leading marketing and SEO automation platform for lawyers.',
      url: 'https://www.academy.wansom.ai/',
      siteName: 'Wansom AI',
      images: [
        {
          url: '/images/features-2.png',
          width: 1200,
          height: 630,
          alt: 'Wansom AI - Legal SEO AI Platform'
        }
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Wansom AI Academy',
      description: 'Wansom AI Academy is the leading marketing and SEO automation platform for lawyers.',
      images: ['/images/features-2.png'],
    },
    keywords: [
      'AI Academy',
      'law firm AI software',
      'SEO automation',
      'legal tech',
      'AI Lawyer',
      'AI assistant',
      'marketing automation'
    ],
    authors: [{ name: 'Wansom AI' }],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

const Page = () => {




  return (
    <div className="bg-gray-50 min-h-screen">
 <AISearchPage/>
    </div>
  );
};

export default Page;