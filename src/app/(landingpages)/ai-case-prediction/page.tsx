
import { Metadata } from 'next';
import CasePreparationPage from './CasePreparationPage';


export const metadata: Metadata = {
  title: 'AI for Case Prediction Platform | Wansom AI',
  description: 'Prepare winning cases with AI that analyzes your arguments, predicts outcomes, and simulates opposing counsel strategies to strengthen your position.',
  alternates: {
    canonical: 'https://www.wansom.ai/ai-case-prediction',
  },
  openGraph: {
    title: 'AI for Case Prediction Platform | Wansom AI',
    description: 'Prepare winning cases with AI that analyzes your arguments, predicts outcomes, and simulates opposing counsel strategies to strengthen your position.',
    type: 'website',
    url:'https://www.wansom.ai/ai-case-prediction',
    images: [
      {
        url: '/legal-research.png',
        width: 1200,
        height: 630,
        alt: 'Wansom AI Case Prediction',
      },
    ],
  },
};

const Page = () => {




  return (
    <div className="bg-gray-50 min-h-screen">
 <CasePreparationPage/>
    </div>
  );
};

export default Page;