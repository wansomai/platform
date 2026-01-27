
import { Metadata } from 'next';
import LegalResearchPage from './LegalResearchPage';

export const metadata: Metadata = {
  title: 'Best Legal AI Assistant | Wansom AI',
  description: 'Wansom Legal AI assistant helps with legal research and gets instant answers to complex legal questions by searching through millions of cases, statutes, and legal authorities in seconds.',
  alternates: {
    canonical: 'https://www.wansom.ai/ai-assistant',
  },
  openGraph: {
    title: 'Best Legal AI Assistant | Wansom AI',
    description: 'Wansom Legal AI assistant helps with legal research and gets instant answers to complex legal questions by searching through millions of cases, statutes, and legal authorities in seconds.',
    type: 'website',
    url: 'https://www.wansom.ai/ai-assistant',
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
