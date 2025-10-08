import { Metadata } from 'next';
import InHouseCounselPage from './InHouseCounselPage';

export const metadata: Metadata = {
  title: 'AI Solutions for In-House Counsels | Wansom AI',
  description: 'Empower your legal department with AI-powered tools for contract management, compliance tracking, legal research, and workflow automation designed for in-house counsel.',
  alternates: {
    canonical: 'https://wansom.ai/solutions/in-house-counsel',
  },
  openGraph: {
    title: 'AI Solutions for In-House Counsels | Wansom AI',
    description: 'Empower your legal department with AI-powered tools for contract management, compliance tracking, legal research, and workflow automation designed for in-house counsel.',
    type: 'website',
    images: [
      {
        url: '/in-house-counsel.png',
        width: 1200,
        height: 630,
        alt: 'Wansom AI for In-House Counsel',
      },
    ],
  },
};

const Page = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <InHouseCounselPage />
    </div>
  );
};

export default Page;
