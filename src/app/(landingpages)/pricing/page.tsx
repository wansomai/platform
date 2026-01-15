
import { Metadata } from 'next';
import Navbar from "@/components/layout/Navbar";
import PricingSection from "@/components/home/pricing";
import Footer from "@/components/layout/Footer";
import { DraftPlus } from '../ai-legal-drafting/DocDraftingPage';

export const metadata: Metadata = {
  title: 'Pricing - Wansom AI | Legal AI Assistant Plans',
  description: 'Legal AI Assistant pricing for Wansom AI. Choose from our flexible plans designed for legal professionals.',
  keywords: 'pricing, legal ai, ai law, legal ai companies, legal software pricing',
  alternates: {
    canonical: 'https://www.wansom.ai/pricing',
  },
  openGraph: {
    title: 'Pricing - Wansom AI | Legal AI Assistant Plans',
    description: 'Legal AI Assistant pricing for Wansom AI. Choose from our flexible plans designed for legal professionals.',
    type: 'website',
    images: [
      {
        url: '/images/features-2.png',
        width: 1200,
        height: 630,
        alt: 'Wansom AI Pricing Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing - Wansom AI',
    description: 'Legal AI Assistant pricing for Wansom AI',
    images: ['/images/features-2.png'],
  },
};

const PricingPage = () => {
    return (
        <div>
            <Navbar/>
     <DraftPlus title=''/>
            <PricingSection/>
            <Footer/>
        </div>
    );
};

export default PricingPage;