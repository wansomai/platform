// app/contact/page.tsx
import { Metadata } from 'next';
import WebinarPageClient from './WebinarPage';

export const metadata: Metadata = {
  title: 'AI lawyer podcast| Wansom AI',
  description: 'ai in law podcast where we talk everything ai,law,data privcay,governance and policy',
  keywords: 'AI lawyer, attorney-client privilege, legal ethics, AI webinar, data privacy in law',
  openGraph: {
    title: 'AI lawyer podcast| Wansom AI',
    description: 'ai in law podcast where we talk everything ai,law,data privcay,governance and policy',
    type: 'website',
    url: 'https://wansom.ai/webinar',
    images: [
      {
        url: '/wansom-webinar.jpg',
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
    title: 'ai in law podcast where we talk everything ai,law,data privcay,governance and policy',
    images: ['/wansom-webinar.jpg'],
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

