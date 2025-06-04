// app/contact/page.tsx
import { Metadata } from 'next';
import WebinarPageClient from './WebinarPage';

export const metadata: Metadata = {
  title: 'Safeguarding Attorney-Client Privilege when using AI | Wansom AI - Webinar',
  description: 'join our webinar on safeguarding attorney-client privilege when using AI in legal practice. Learn best practices and strategies to protect sensitive information.',
  keywords: 'AI in legal practice, attorney-client privilege, legal ethics, AI webinar, data privacy in law',
  openGraph: {
    title: 'Safeguarding Attorney-Client Privilege when using AI | Wansom AI - Webinar',
    description: 'Join our webinar on safeguarding attorney-client privilege when using AI in legal practice. Learn best practices and strategies to protect sensitive information.',
    type: 'website',
    url: 'https://wansom.ai/webinar',
    images: [
      {
        url: '/wansom-webinar.png',
        width: 1200,
        height: 630,
        alt: 'Wansom AI Webinar',
      }
    ],
    locale: 'en_US',
    siteName: 'wansom AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Safeguarding Attorney-Client Privilege when using AI | Wansom AI - Webinar',
    description: 'Join our webinar on safeguarding attorney-client privilege when using AI in legal practice. Learn best practices and strategies to protect sensitive information.',
    images: ['/wansom-webinar.png'],
  }
};

const ContactPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <WebinarPageClient />
    </div>
  );
};
export default ContactPage;

