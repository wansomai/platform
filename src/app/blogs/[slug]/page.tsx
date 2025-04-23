'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBlogPostById, getRelatedBlogPosts } from '@/lib/data/contentful';
import { adaptBlogPost, adaptBlogPosts } from '@/lib/data/blogAdapter';

// Social sharing icons
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
  </svg>
);

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
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
        
        // Fetch related posts based on tags
        const relatedBlogPosts = await getRelatedBlogPosts(
          slug as string, 
          adaptedPost.tags || [],
          3
        );
        
        setRelatedPosts(adaptBlogPosts(relatedBlogPosts));
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">{error || 'Blog post not found'}</h1>
          <p className="mb-6">The requested blog post could not be found.</p>
          <Link href="/blogs" className="inline-block bg-teal-600 text-white px-6 py-2 rounded-md">
            Return to Blogs
          </Link>
        </div>
      </div>
    );
  }

  // Generate social share URLs
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(blog.title)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4 text-sm text-gray-600">
        <div className="flex items-center">
          <Link href="/" className="hover:text-teal-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blogs" className="hover:text-teal-600">Articles</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-500 truncate max-w-[200px]">{blog.title}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Blog header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{blog.title}</h1>
            
            <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
              <div className="flex items-center">
                <span className="mr-4">{blog.date}</span>
              </div>
              
              {/* Social sharing */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">Share:</span>
                <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" aria-label="Share on Facebook">
                  <FacebookIcon />
                </a>
                <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600" aria-label="Share on Twitter">
                  <TwitterIcon />
                </a>
                <a href={linkedinShareUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900" aria-label="Share on LinkedIn">
                  <LinkedInIcon />
                </a>
              </div>
            </div>
          </div>
          
          {/* Featured Image */}
          {blog.image && (
            <div className="mb-8">
              <Image
                src={blog.image}
                alt={blog.title}
                width={1200}
                height={630}
                className="rounded-lg w-full h-auto object-cover max-h-[500px]"
              />
            </div>
          )}
          
          {/* Blog Content - Using dangerouslySetInnerHTML for rich text */}
          <div 
            className="blog-content mb-12"
            dangerouslySetInnerHTML={{ __html: blog.contentHtml || '' }}
          />
          
          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mb-12">
              <h3 className="text-lg font-semibold mb-2">Related Topics</h3>
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag: string) => (
                  <Link 
                    key={tag} 
                    href={`/blogs?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-teal-100 hover:text-teal-700"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-xl font-semibold mb-6">Related Articles</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((post) => (
                  <Link key={post.id} href={post.link} className="block group">
                    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      <h4 className="font-semibold text-gray-800 mb-2 group-hover:text-teal-600">{post.title}</h4>
                      <p className="text-sm text-gray-500">{post.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;