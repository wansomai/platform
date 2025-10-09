import { Metadata } from 'next';
import MALawyersPage from './MALawyersPage';

export const metadata: Metadata = {
  title: 'AI Solutions for M&A Lawyers | Wansom AI',
  description: 'Close deals faster with AI-powered due diligence, contract analysis, deal structuring, and post-merger integration tools designed for M&A lawyers.',
  alternates: {
    canonical: 'https://wansom.ai/solutions/ma-lawyers',
  },
  openGraph: {
    title: 'AI Solutions for M&A Lawyers | Wansom AI',
    description: 'Close deals faster with AI-powered due diligence, contract analysis, deal structuring, and post-merger integration tools designed for M&A lawyers.',
    type: 'website',
    images: [
      {
        url: '/images/ma-lawyers.jpg',
        width: 1200,
        height: 630,
        alt: 'Wansom AI for M&A Lawyers',
      },
    ],
  },
};

const Page = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <MALawyersPage />
    </div>
  );
};

export default Page;
