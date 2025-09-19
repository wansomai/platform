
import { Metadata } from 'next';
import DueDiligencePage from './DueDiligence';


export const metadata: Metadata = {
  title: 'Best AI For Due Diligence Platform | Wansom AI',
  description: 'Accelerate your due diligence process with AI that automatically analyzes, categorizes, and flags critical issues across thousands of documents in minutes.',
  alternates: {
    canonical: '/ai-due-diligence',
  },
  openGraph: {
    title: 'Best AI For Due Diligence Platform | Wansom AI',
    description: 'Accelerate your due diligence process with AI that automatically analyzes, categorizes, and flags critical issues across thousands of documents in minutes.',
    type: 'website',
    images: [
      {
        url: '/legal-drafting.png',
        width: 1200,
        height: 630,
        alt: 'Wansom AI Due Diligence',
      },
    ],
  },
};

const Page = () => {




  return (
    <div className="bg-gray-50 min-h-screen">
 <DueDiligencePage/>
    </div>
  );
};

export default Page;