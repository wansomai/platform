// app/privacy-policy/page.tsx
import { Metadata } from 'next';
import PrivacyPolicyContent from './PrivacyPolicyContent';

export const metadata: Metadata = {
  title: 'Privacy Policy | Wansom AI - Legal Services',
  description: 'Learn how Wansom AI collects, uses, and protects your personal information. Our commitment to your privacy and data security.',
  keywords: 'privacy policy, data protection, wansom AI privacy, legal AI privacy, data security',
  alternates: {
    canonical: 'https://www.wansom.ai/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy | Wansom AI - Legal Services',
    description: 'Learn how Wansom AI collects, uses, and protects your personal information.',
    type: 'website',
    url: 'https://www.wansom.ai/privacy-policy',
    images: [
      {
        url: '/dashboard.jpg',
        width: 1200,
        height: 630,
        alt: 'Wansom AI Privacy Policy',
      }
    ],
    locale: 'en_US',
    siteName: 'wansom',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Wansom AI',
    description: 'Learn how we protect your data and privacy.',
    images: ['/dashboard.jpg'],
  }
};

const PrivacyPolicyPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <PrivacyPolicyContent />
    </div>
  );
};

export default PrivacyPolicyPage;
