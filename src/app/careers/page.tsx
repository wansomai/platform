import { Metadata } from 'next';
import CareersPageClient from './CareersPage';

export const metadata: Metadata = {
  title: 'Careers at wansom AI | Join Our Legal Tech Team',
  description: 'Join Wansom AI and help shape the future of legal technology. Explore exciting career opportunities in AI, legal tech, marketing, and software development in Nairobi.',
  keywords: 'legal tech careers, AI jobs, Wansom AI careers, tech jobs Nairobi, legal technology jobs',
  openGraph: {
    title: 'Careers at Wansom AI | Join Our Legal Tech Team',
    description: 'Join Wansom AI and help shape the future of legal technology. Explore exciting career opportunities in Nairobi.',
    type: 'website',
    url: 'https://wansom.co/careers',
    images: [
      {
        url: '/dashboard.jpg',
        width: 1200,
        height: 630,
        alt: 'WakiliChat Careers - Legal Tech Jobs',
      }
    ],
    locale: 'en_US',
    siteName: 'wansom',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join wansom AI - Legal Tech Careers',
    description: 'Shape the future of legal technology. View open positions at wansom AI.',
    images: ['hero.png'],
  }
};

const CareersPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <CareersPageClient />
    </div>
  );
}
export default CareersPage;