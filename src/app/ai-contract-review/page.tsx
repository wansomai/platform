
import { Metadata } from 'next';
import ContractReviewPage from './ContractReviewPage';


export const metadata: Metadata = {
  title: 'AI for Contract Review| wansom AI',
  description: 'Review and redline your contracts within a collaborative AI workspace',
  openGraph: {
    title: ' AI for Contract Review| wansom AI',
    description: 'Review and redline your contracts within a collaborative AI workspace',
    type: 'website',
    images: [
      {
        url: '/legal-drafting.png',
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
 <ContractReviewPage/>
    </div>
  );
};

export default Page;