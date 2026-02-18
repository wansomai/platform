

import { Metadata } from "next";
import Law360Components from "./components";

export const metadata: Metadata = {
  title: 'Law 360  | Wansom AI',
  description: 'Legal intelligence in your inbox, all year round powered by Wansom AI.',
  keywords: 'law 360, legal ai, ai law, legal news, legal updates, legal insights, legal trends, caselaw summaries, legal intelligence, legal assistant',
  alternates: {
    canonical: 'https://www.wansom.ai/pricing',
  },
  openGraph: {
    title: 'Law 360 - Wansom AI',
    description: 'Legal intelligence in your inbox, all year round powered by Wansom AI.',
    type: 'website',
    images: [
      {
        url: '/images/features-2.jpg',
        width: 1200,
        height: 630,
        alt: 'Wansom AI - Law 360',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Law 360 - Wansom AI',
    description: 'Legal intelligence in your inbox, all year round powered by Wansom AI.',
    images: ['/images/features-2.jpg'],
  },
};

export default function Law360Page() {
    return ( 
        <Law360Components/>
        
     );
}
