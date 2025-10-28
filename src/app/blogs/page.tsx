

import { Metadata } from 'next';
import BlogsPageClient from './BlogsPage';

export const metadata: Metadata = {
  title: 'Legal Tech Blog | AI Law Insights & Resources | Wansom AI',
  description: 'Explore expert insights on AI law, digital ethics, legal technology, and AI governance. Stay informed with the latest legal tech trends and developments.',
  keywords: 'legal tech blog, AI law, digital ethics, legal technology, AI governance, law firm technology, legal insights',
  alternates: {
    canonical: 'https://www.wansom.ai/blogs',
  },
  openGraph: {
    title: 'Legal Tech Blog | AI Law Insights & Resources | wansom AI',
    description: 'Expert insights on AI law, digital ethics, and legal technology transformation. Stay informed with wansom\'s latest research and analysis.',
    type: 'website',
    url: 'https://www.wansom.ai/blogs',
    images: [
      {
        url: '/images/features-2.png',
        width: 1200,
        height: 630,
        alt: 'wansom AI Legal Tech Blog',
      }
    ],
    locale: 'en_US',
    siteName: 'Wansom AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal Tech Insights & Resources | wansom AI Blog',
    description: 'Expert insights on AI law, digital ethics, and legal technology.',
    images: ['/images/features-2.png'],
  }
};

export default BlogsPageClient;