"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import {
  FileText,
  ChevronRight,
  Tag,
  MapPin,
  Info,
  ArrowUpRight,
} from "lucide-react";
import { getAllLegalDocuments } from "@/lib/data/sanity";
import { adaptSanityLegalDocuments } from "@/lib/data/blogAdapter";

// Lazy load Footer component
const Footer = dynamic(() => import("@/components/layout/Footer"), {
  ssr: false,
  loading: () => null,
});

interface PageProps {
  blog: any | null;
}

const DocDetailPageClient = ({ blog }: PageProps) => {
  const router = useRouter();
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  // Fetch related documents
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        // Fetch all documents from Sanity
        const allDocs = await getAllLegalDocuments();
        const adapted = adaptSanityLegalDocuments(allDocs);

        // Filter out current document and get up to 6 related
        const related = adapted
          .filter((doc: any) => doc.id !== blog?.id)
          .slice(0, 6);

        setRelatedPosts(related);
      } catch (error) {
        console.error('Error fetching related documents:', error);
      }
    };

    if (blog) {
      fetchRelated();
    }
  }, [blog]);

  const handleDownload = () => {
    if (blog?.template?.url) {
      window.open(blog.template.url, '_blank');
    }
  };

  if (!blog) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar darkmode />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center flex items-center flex-col gap-3 justify-center">
            <h1 className="text-5xl font-semibold text-primary mb-4 font-serif">
              Oops!
            </h1>
            <p className="mb-6">The requested legal document could not be found.</p>
            <img src="/404.png" className="mx-auto -mt-20" alt="404"/>
            <Link
              href="/legal-documents"
              className="flex gap-1 items-center bg-teal-600 text-sm text-white px-6 py-2 rounded-md"
            >
              View More Documents
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar darkmode/>

      {/* Header Section with Breadcrumb */}
      <div className="pt-20 md:pt-24">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Title and Description */}
          <h1 className="text-xl lg:text-3xl font-serif font-bold text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: blog.title }}>
            
          </h1>

          {/* Preview with Show More */}
          {blog.contentHtml && (
            <div className="mb-6">
              <div
                className={`text-gray-600 text-lg leading-relaxed ${
                  isPreviewExpanded ? '' : 'line-clamp-3'
                }`}
                dangerouslySetInnerHTML={{ __html: blog.contentHtml }}
              />
              <button
                onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                className="mt-2 text-secondary hover:text-black font-medium flex items-center gap-1 text-sm"
              >
                {isPreviewExpanded ? (
                  <>
                    Show less
                    <ChevronRight className="w-4 h-4 rotate-[-90deg] transition-transform" />
                  </>
                ) : (
                  <>
                    View more
                    <ChevronRight className="w-4 h-4 rotate-90 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded hover:bg-black transition-colors font-medium"
            >
              Open in editor
              <ArrowUpRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
      

      {/* Main Content Area */}
      <div className="container mx-auto px-4  max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        

          {/* Main Content - Document Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
              {/* Document Template Viewer */}
              {blog.template?.url ? (
                <div className="relative w-full">
                  {/* Document Viewer */}
                  <div
                    className="w-full h-[400px] lg:h-[600px] overflow-hidden relative"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      router.push('/login');
                    }}
                  >
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(blog.template.url)}&embedded=true`}
                      className="w-full h-full border-0 pointer-events-none"
                      title="Document Preview"
                      loading="lazy"
                    />
                    {/* Transparent overlay to prevent direct interaction and redirect to login */}
                    <div
                      className="absolute inset-0 cursor-pointer bg-transparent z-10"
                      onClick={() => router.push('/login')}
                      title="Click to open in editor"
                    />
                  </div>
                </div>
              ):(
                <div
                  className="w-full h-[400px] lg:h-[600px] overflow-hidden relative cursor-pointer"
                  onClick={() => router.push('/login')}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    router.push('/login');
                  }}
                >
                   <img src="/contract-sample.webp" alt={blog.title} className="w-full h-full object-cover pointer-events-none"/>
                  </div>
              )}
            </div>
          </div>
            {/* Left Sidebar - Categories and Info */}
          <div className="lg:col-span-1 space-y-6">

            {/* Categories */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-secondary" />
                  <h3 className="font-semibold text-gray-900">Categories</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-primary text-white rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Jurisdictions */}
            {blog.jurisdiction && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-secondary" />
                  <h3 className="font-semibold text-gray-900">Jurisdictions</h3>
                </div>
                
                <span className="inline-block px-3 py-1 bg-primary text-white rounded-full text-sm">
                  {blog.jurisdiction}
                </span>
              </div>
            )}

            {/* Document Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-secondary" />
                <h3 className="font-semibold text-gray-900">Document info</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Word document.</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Edited On {blog.date}.</p>
                </div>
                {blog.template && (
                  <div>
                    <p className="text-gray-500">
                      Licensed under{' '}
                      <span className="text-secondary hover:underline cursor-pointer">
                        CC BY 4.0 (Attribution)
                      </span>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Documents Section */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              More documents in this category
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={post.link}
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2"  dangerouslySetInnerHTML={{ __html: post.title }}>
                      </h3>
                      <p className="text-sm text-gray-500">Wansom Legal Library</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default DocDetailPageClient;
