import { Metadata } from 'next';
import LitigationLawyersPage from './LitigationLawyersPage';

export const metadata: Metadata = {
  title: 'AI Solutions for Litigation Lawyers | Wansom AI',
  description: 'Win more cases with AI-powered legal research, document discovery, brief drafting, and case strategy tools designed specifically for litigation lawyers.',
  alternates: {
    canonical: 'https://www.wansom.ai/solutions/litigation-lawyers',
  },
  openGraph: {
    title: 'AI Solutions for Litigation Lawyers | Wansom AI',
    description: 'Win more cases with AI-powered legal research, document discovery, brief drafting, and case strategy tools designed specifically for litigation lawyers.',
    type: 'website',
    url: 'https://www.wansom.ai/solutions/litigation-lawyers',
    images: [
      {
        url: '/images/litigation-lawyers.jpg',
        width: 1200,
        height: 630,
        alt: 'Wansom AI for Litigation Lawyers',
      },
    ],
  },
};

const Page = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <LitigationLawyersPage />
    </div>
  );
};

export default Page;
