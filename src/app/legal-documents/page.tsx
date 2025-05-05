
import { Metadata } from 'next';
import LegalDocumentsPageClient from './LegaDocumentsPage';


export const metadata: Metadata = {
  title: 'Legal Templates & Documents | wansom AI',
  description: 'Download agreements, contracts, leases, wills and more legal documents. Access professional legal templates and create custom documents with AI assistance.',
  openGraph: {
    title: 'Legal Templates & Documents | Wansom AI',
    description: 'Download agreements, contracts, leases, wills and more legal documents. Access professional legal templates and create custom documents with AI assistance.',
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

const BlogsPage = () => {




  return (
    <div className="bg-gray-50 min-h-screen">
 <LegalDocumentsPageClient/>
    </div>
  );
};

export default BlogsPage;