// app/contact/page.tsx
import { Metadata } from 'next';
import ContactPageClient from './ContactPage';

export const metadata: Metadata = {
  title: 'Contact Us | Wansom AI - Legal Services',
  description: 'Get in touch with Wansom AI. Located at I&M House, Upper Hill, Nairobi. Connect with our legal team for inquiries, support, and consultations.',
  keywords: 'contact wansom AI, legal services contact, lawyer consultation, legal help nairobi, contact form',
  openGraph: {
    title: 'Contact Us | Wansom AI - Legal Services',
    description: 'Get in touch with Wansom AI. Located at I&M House, Upper Hill, Nairobi. Connect with our legal team for inquiries, support, and consultations.',
    type: 'website',
    url: 'https://wansom.co/contact',
    images: [
      {
        url: '/dashboard.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact wansom AI Legal Services',
      }
    ],
    locale: 'en_US',
    siteName: 'wansom',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Wansom AI Legal Services',
    description: 'Get in touch with our legal team for consultations and support.',
    images: ['/dashboard.jpg'],
  }
};

const ContactPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <ContactPageClient />
    </div>
  );
};
export default ContactPage;

