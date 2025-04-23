'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBlogPostById } from '@/lib/data/contentful';
import { adaptBlogPost } from '@/lib/data/blogAdapter';

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        if (!slug || typeof slug !== 'string') {
          throw new Error('Invalid blog ID');
        }

        setLoading(true);
        const blogPost = await getBlogPostById(slug);
        
        if (!blogPost) {
          throw new Error('Blog post not found');
        }
        
        const adaptedPost = adaptBlogPost(blogPost);
        setBlog(adaptedPost);
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-4">{error || 'Blog post not found'}</h1>
          <Link href="/blogs" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">
            Return to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb - similar to your screenshot */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blogs" className="hover:text-blue-600">Articles</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-500">{blog.title}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <article className="max-w-3xl mx-auto">
          {/* Title and date - similar to your screenshot */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{blog.title}</h1>
          <p className="text-sm text-gray-500 mb-6">{blog.date}</p>
          
          {/* Featured Image */}
          {blog.image && (
            <div className="mb-8">
              <Image
                src={blog.image}
                alt={blog.title}
                width={800}
                height={450}
                className="w-full h-auto object-cover rounded"
              />
            </div>
          )}
          
          {/* Blog Content - Using dangerouslySetInnerHTML for rich text */}
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.contentHtml || '' }}
          />
        </article>
      </div>
    </div>
  );
};

export default BlogDetailPage;