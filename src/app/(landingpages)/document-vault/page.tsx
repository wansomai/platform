
import { Metadata } from 'next';
import DocumetsVault from './DocumentVaultPage';


export const metadata: Metadata = {
  title: 'AI Electronic Document Management System | Vault | Wansom AI',
  description: 'Capture, store, organize, and retrieve documents in a secure centralized repository',
  alternates: {
    canonical: 'https://www.wansom.ai/document-vault',
  },
  openGraph: {
    title: 'AI Electronic Document Management System | Vault | Wansom AI',
    description: 'Capture, store, organize, and retrieve documents in a secure centralized repository',
    type: 'website',
    images: [
      {
        url: '/legal-research.png',
        width: 1200,
        height: 630,
        alt: 'Wansom AI Document Vault',
      },
    ],
  },
};

const Page = () => {




  return (
    <div className="bg-gray-50 min-h-screen">
 <DocumetsVault/>
    </div>
  );
};

export default Page;