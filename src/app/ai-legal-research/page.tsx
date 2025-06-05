
import { Metadata } from 'next';
import LegalResearchPage from './LegalResearchPage';


export const metadata: Metadata = {
  title: 'AI Legal Research| wansom AI',
  description: 'Review and redline your contracts within a collaborative AI workspace',
  openGraph: {
    title: 'AI Legal Research| wansom AI',
    description: 'Review and redline your contracts within a collaborative AI workspace',
    type: 'website',
    images: [
      {
        url: '/legal-drafting.jpg',
        width: 1200,
        height: 630,
        alt: 'wansom AI Legal Drafting',
      },
    ],
  },
};

const Page = () => {




  return (
    <div className="bg-gray-50 min-h-screen">
 <LegalResearchPage/>
    </div>
  );
};

export default Page;