
import { Metadata } from 'next';
import ContractReviewPage from './ContractReviewPage';


export const metadata: Metadata = {
  title: 'AI Legal Drafting | wansom AI',
  description: 'Draft Correct Legally formatted Documents and Clauses quickly with AI',
  openGraph: {
    title: 'AI Legal Drafting | wansom AI',
    description: 'Draft Correct Legally formatted Documents and Clauses quickly with AI',
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
 <ContractReviewPage/>
    </div>
  );
};

export default Page;