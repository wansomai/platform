
import { Metadata } from 'next';
import LegalResearchPage from './LegalResearchPage';


export const metadata: Metadata = {
  title: 'Best AI Legal Research Platform | Wansom AI',
  description: 'Get instant answers to complex legal questions with AI that searches through millions of cases, statutes, and legal authorities in seconds.',
  alternates: {
    canonical: '/ai-legal-research',
  },
  openGraph: {
    title: 'Best AI Legal Research | Wansom AI',
    description: 'Get instant answers to complex legal questions with AI that searches through millions of cases, statutes, and legal authorities in seconds.',
    type: 'website',
    images: [
      {
        url: '/legal-research.png',
        width: 1200,
        height: 630,
        alt: 'Wansom AI Legal Research',
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