import { Metadata } from 'next';
import LawSchoolsPage from './LawSchoolsPage';

export const metadata: Metadata = {
  title: 'AI Solutions for Law Schools | Wansom AI',
  description: 'Prepare tomorrow\'s lawyers with AI-powered legal education tools. Enhance legal research training, document drafting, moot court preparation, and clinical programs for law students.',
  alternates: {
    canonical: 'https://www.wansom.ai/solutions/law-schools',
  },
  openGraph: {
    title: 'AI Solutions for Law Schools | Wansom AI',
    description: 'Prepare tomorrow\'s lawyers with AI-powered legal education tools. Enhance legal research training, document drafting, moot court preparation, and clinical programs for law students.',
    type: 'website',
    images: [
      {
        url: '/images/law-schools.jpg',
        width: 1200,
        height: 630,
        alt: 'Wansom AI for Law Schools',
      },
    ],
  },
};

const Page = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <LawSchoolsPage />
    </div>
  );
};

export default Page;
