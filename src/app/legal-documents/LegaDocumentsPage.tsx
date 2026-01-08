'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllLegalDocuments } from '@/lib/data/sanity';
import { adaptSanityLegalDocuments } from '@/lib/data/blogAdapter';
import Pagination from '@/components/home/pagination';
import Navbar from '@/components/layout/Navbar';
import { Sparkles, Search, X } from 'lucide-react';
import LegalDocCard from '@/components/home/legal-documents';
import Footer from '@/components/layout/Footer';
import { DraftPlus } from '../(landingpages)/ai-legal-drafting/DocDraftingPage';

const POSTS_PER_PAGE = 9; // 3x3 grid

const LegalDocumentsPageClient = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // Fetch legal documents from Sanity
        const sanityDocs = await getAllLegalDocuments();
        const adaptedDocs = adaptSanityLegalDocuments(sanityDocs);
        setPosts(adaptedDocs);
      } catch (err) {
        console.error('Error fetching legal documents:', err);
        setError('Failed to load legal documents');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter posts by search term
  const filteredPosts = posts.filter(post => {
    return searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (post.preview && post.preview.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (post.tags && post.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())));
  });

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const hasActiveFilters = searchTerm !== '';

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar/>
      <DraftPlus title='Legal Document Templates: Agreements, Contracts, Leases, Wills & More' subtitle="Never start legal drafting from scratch again. Browse our extensive library of professionally crafted legal document templates and customize to suit your specific needs." />
  
      
      {/* Search Section */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search legal documents by title, content, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005c4d] focus:border-transparent outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {loading ? (
                <span>Loading documents...</span>
              ) : (
                <span>
                  Showing {filteredPosts.length} of {posts.length} legal documents
                  {searchTerm && (
                    <span className="ml-1">for "{searchTerm}"</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Documents Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {error && (
            <div className="text-center py-8 text-red-600 bg-red-50 rounded-md">
              <p className="font-medium">{error}</p>
              <p className="mt-2">Please try refreshing the page.</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-800"></div>
            </div>
          ) : (
            <>
              {filteredPosts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {paginatedPosts.map((post) => (
                      <LegalDocCard key={post.id} post={post} type="all" />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination 
                      currentPage={currentPage} 
                      totalPages={totalPages} 
                      onPageChange={setCurrentPage} 
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-md">
                  <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No documents found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm 
                      ? `No results found for "${searchTerm}"` 
                      : "No legal documents available"}
                  </p>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="px-6 py-2 bg-[#005c4d] text-white rounded-md hover:bg-[#004a3d] transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <Footer/>
    </div>
  );
};

export default LegalDocumentsPageClient;