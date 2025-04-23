'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllBlogPosts } from '@/lib/data/contentful';
import { adaptBlogPosts } from '@/lib/data/blogAdapter';
import PostCard from '@/components/home/blog-post';
import Pagination from '@/components/home/pagination';
import Navbar from '@/components/layout/Navbar';

const POSTS_PER_PAGE = 9; // 3x3 grid

const BlogsPage = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const blogPosts = await getAllBlogPosts();
        const adaptedPosts = adaptBlogPosts(blogPosts);
        setPosts(adaptedPosts);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter posts by search term
  const filteredPosts = posts.filter(post => {
    return (
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      post.preview?.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  return (
    <div className="bg-gray-50 min-h-screen">
        <Navbar/>
      {/* Header Section */}
      <section className="bg-white py-16 mt-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">Blog & Resources</h1>
            <div className="text-sm text-gray-600 mb-6">
              <Link href="/" className="hover:text-blue-600">Home</Link> / <span>Articles</span>
            </div>
            <p className="text-lg text-gray-600">
            Explore our latest thoughts, research, and insights on ,AI Law, digital ethics, AI governance, and technology transformation.
            </p>
          </div>
        </div>
      </section>
      
      {/* Blog Posts Section */}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {filteredPosts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {paginatedPosts.map((post) => (
                      <PostCard key={post.id} post={post} type="all" />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
                  />
                </>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-md">
                  <h3 className="text-xl font-medium mb-2">No articles found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm 
                      ? `No results for "${searchTerm}"` 
                      : "No articles found"}
                  </p>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
    </div>
  );
};

export default BlogsPage;