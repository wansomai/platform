
import { Metadata } from 'next';
import ContractReviewPage from './ContractReviewPage';

export const metadata: Metadata = {
  title: 'Best AI for Contract Review Platform | Wansom AI',
  description: 'Review and redline your contracts within a collaborative AI workspace',
  alternates: {
    canonical: 'https://www.wansom.ai/ai-contract-review',
  },
  openGraph: {
    title: 'Best AI for Contract Review Platform | Wansom AI',
    description: 'Review and redline your contracts within a collaborative AI workspace',
    type: 'website',
    url:'https://www.wansom.ai/ai-contract-review',
    images: [
      {
        url: '/legal-drafting.png',
        width: 1200,
        height: 630,
        alt: 'Wansom AI Contract Review',
      },
    ],
  },
};

const Page = () => {

  return (
    <div className="bg-gray-50 min-h-screen">
 <ContractReviewPage/>
    </div>
  );
};

export default Page;