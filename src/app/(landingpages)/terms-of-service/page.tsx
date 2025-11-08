// app/terms-of-service/page.tsx
import { Metadata } from 'next';
import TermsOfServiceContent from './TermsOfServiceContent';

export const metadata: Metadata = {
  title: 'Terms of Service | Wansom AI - Legal Services',
  description: 'Read the Terms of Service for Wansom AI. Understand your rights and responsibilities when using our legal AI platform.',
  keywords: 'terms of service, terms and conditions, wansom AI terms, legal AI terms, user agreement',
  alternates: {
    canonical: 'https://www.wansom.ai/terms-of-service',
  },
  openGraph: {
    title: 'Terms of Service | Wansom AI - Legal Services',
    description: 'Read the Terms of Service for Wansom AI legal platform.',
    type: 'website',
    url: 'https://www.wansom.ai/terms-of-service',
    images: [
      {
        url: '/dashboard.jpg',
        width: 1200,
        height: 630,
        alt: 'Wansom AI Terms of Service',
      }
    ],
    locale: 'en_US',
    siteName: 'wansom',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Wansom AI',
    description: 'Read our terms and conditions.',
    images: ['/dashboard.jpg'],
  }
};

const TermsOfServicePage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <TermsOfServiceContent />
    </div>
  );
};

export default TermsOfServicePage;
