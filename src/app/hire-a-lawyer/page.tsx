import { Metadata } from 'next';
import HireALawyerPage from './HireALawyerPage';


export const metadata: Metadata = {
  title: 'Hire a Lawyer | Get Legal Advice Online | Wansom Ai',
  description: 'Connect with experienced lawyers online for legal advice, document review, and consultation. Get quick answers to your legal questions from real attorneys specialized in your issue.',
  keywords: 'hire lawyer, legal advice online, attorney consultation, legal help, find lawyer, legal services, legal consultation, legal questions, document review',
  openGraph: {
    title: 'Hire a Lawyer | Get Legal Advice Online | wansom AI',
    description: 'Connect with experienced lawyers online for legal advice, document review, and consultation. Get quick answers to your legal questions from real attorneys specialized in your issue.',
    type: 'website',
    url: 'https://wansom.ai/hire-a-lawyer',
    images: [
      {
        url: '/hero.png', // You'll need to add this image
        width: 1200,
        height: 630,
        alt: 'Hire a Lawyer Online - wansom AI Legal Services',
      },
    ],
    locale: 'en_US',
    siteName: 'Wansom AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hire a Lawyer | Get Legal Advice Online | Wansom AI',
    description: 'Connect with experienced lawyers online for legal advice, document review, and consultation.',
    images: ['/hero.png'],
  },
};

 const Page = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <HireALawyerPage />
    </div>
  );
}

export default Page;