
import { Metadata } from 'next';
import { headers } from 'next/headers';
import Navbar from "@/components/layout/Navbar";
import PricingSection from "@/components/home/pricing";
import Footer from "@/components/layout/Footer";
import { DraftPlus } from '../ai-legal-drafting/DocDraftingPage';
import { getSubscriptionPricing, getExplorerPricing } from '@/lib/subscriptionPricing';

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
        url: '/images/features-2.jpg',
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
    images: ['/images/features-2.jpg'],
  },
};

const PricingPage = async () => {
  const headersList = await headers();
  const countryCode = headersList.get('x-vercel-ip-country') ?? 'us';
  const pricing = getSubscriptionPricing(countryCode);
  const explorerPricing = getExplorerPricing(countryCode);

  return (
    <div>
      <Navbar />
      <DraftPlus title='' />
      <PricingSection pricing={pricing} explorerPricing={explorerPricing} />
      <Footer />
    </div>
  );
};

export default PricingPage;
