
import { Metadata } from 'next';
import LegalDocumentsPageClient from './LegaDocumentsPage';


export const metadata: Metadata = {
  title: 'legal document templates | wansom AI',
  description: 'Download agreements, contracts, leases, wills and more legal documents. Access professional legal templates and create custom documents with AI assistance.',
  openGraph: {
    title: 'legal document templates | Wansom AI',
    description: 'Download legal document templates, agreements, contracts, leases, wills and more legal documents. Draft with AI assistance.',
    type: 'website',
    images: [
      {
        url: '/dashboard.jpg',
        width: 1200,
        height: 630,
        alt: 'wansom AI Legal Documents',
      },
    ],
  },
};

const Page = () => {




  return (
    <div className="bg-gray-50 min-h-screen">
 <LegalDocumentsPageClient/>
    </div>
  );
};

export default Page;