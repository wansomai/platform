

import { Metadata } from "next";
import Law360Components from "./components";

export const metadata: Metadata = {
  title: 'Briefly | Wansom AI',
  description: 'Legal intelligence in your inbox, all year round powered by Wansom AI.',
  keywords: 'Briefly by Wansom, legal ai, ai law, legal news, legal updates, legal insights, legal trends, caselaw summaries, legal intelligence, legal assistant',
  alternates: {
    canonical: 'https://www.wansom.ai/pricing',
  },
  openGraph: {
    title: 'Briefly | Wansom AI',
    description: 'Legal intelligence in your inbox, all year round powered by Wansom AI.',
    type: 'website',
    images: [
      {
        url: '/images/features-2.jpg',
        width: 1200,
        height: 630,
        alt: 'Wansom AI - Briefly by Wansom',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Briefly by Wansom AI',
    description: 'Legal intelligence in your inbox, all year round powered by Wansom AI.',
    images: ['/images/features-2.jpg'],
  },
};

export default function Law360Page() {
    return ( 
        <Law360Components/>
        
     );
}
