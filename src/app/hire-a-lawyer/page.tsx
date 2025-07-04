import { Metadata } from 'next';
import HireALawyerPage from './HireALawyerPage';


export const metadata: Metadata = {
  title: 'Ask an expert lawyer near your | Get Legal Advice Online',
  description: 'Ask expereince lawyers near you online for legal advice, legal document review, and consultation. Get quick answers to your legal questions from real attorneys specialized in your issue.',
  keywords: 'free legal service,lawyer near me, attorney consultation,lawfirms near me, legal help, find lawyer, legal services, legal consultation, legal questions',
  openGraph: {
    title: 'Ask an expert lawyer near your | Get Legal Advice Online',
    description: 'Ask expereince lawyers near you online for legal advice, legal document review, and consultation. Get quick answers to your legal questions from real attorneys specialized in your issue.',
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
    title: 'Ask an expert lawyer near your | Get Legal Advice Online',
    description: 'Ask expereince lawyers near you online for legal advice, legal document review, and consultation. Get quick answers to your legal questions from real attorneys specialized in your issue.',
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