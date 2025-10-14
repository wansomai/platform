
import { Metadata } from 'next';
import LegalDraftingPage from './DocDraftingPage';


export const metadata: Metadata = {
  title: 'Best AI for Legal Drafting Platform | Wansom AI',
  description: 'Draft Correct Legally formatted Documents and Clauses quickly with AI',
  alternates: {
    canonical: 'https://www.wansom.ai/ai-legal-drafting',
  },
  openGraph: {
    title: 'Best AI for Legal Drafting Platform | Wansom AI',
    description: 'Draft Correct Legally formatted Documents and Clauses quickly with AI',
    type: 'website',
    images: [
      {
        url: '/legal-drafting.png',
        width: 1200,
        height: 630,
        alt: 'Wansom AI Legal Drafting',
      },
    ],
  },
};

const Page = () => {




  return (
    <div className="bg-gray-50 min-h-screen">
 <LegalDraftingPage/>
    </div>
  );
};

export default Page;