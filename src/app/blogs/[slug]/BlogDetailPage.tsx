"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getAllBlogPosts, getBlogPostById, getRelatedBlogPosts } from "@/lib/data/contentful";
import { adaptBlogPost, adaptBlogPosts, createSlug } from "@/lib/data/blogAdapter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
interface PageProps {
  params: {
    slug: string;
    id: string;
  };
}

const BlogDetailPageClient = ({ params }: PageProps) => {
  const { slug, id } = params;
  const [blog, setBlog] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        if (!slug || typeof slug !== 'string') {
          throw new Error('Invalid blog slug');
        }

        setLoading(true);

        // Get all blog posts and find the one with matching slug
        const allBlogPosts = await getAllBlogPosts();

        // Find the blog post with matching slug
        const blogPost = allBlogPosts.find(post => {
          const postSlug = createSlug(post.fields.title);
          return postSlug === slug;
        });

        if (!blogPost) {
          throw new Error('Blog post not found');
        }

        const adaptedPost = adaptBlogPost(blogPost);
        setBlog(adaptedPost);

        // Get first 6 blog posts
        const allAdapted = adaptBlogPosts(allBlogPosts);
        const firstSix = allAdapted.slice(0, 6);
        setRelatedPosts(firstSix);
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
        <div className="text-center flex items-center flex-col gap-3 justify-center">
          <h1 className="text-5xl font-semibold text-primary mb-4 font-serif">
            Oops!
          </h1>
          <p className="mb-6">The requested article could not be found.</p>
          <img src="/404.png" className="mx-aut0 -mt-20"/>
          <Link
            href="/blogs"
            className="flex gap-1 items-center bg-teal-600 text-sm text-white px-6 py-2 rounded-md"
          >
            View More Articles <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
</svg>

          </Link>
        </div>
      </div>
    );
  }

  // Generate social share URLs
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    pageUrl
  )}&text=${encodeURIComponent(blog.title)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    pageUrl
  )}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    pageUrl
  )}`;

  return (
    <div className="bg-white min-h-screen">
      <Navbar darkmode/>

      <div className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Main content */}
          <div className="w-full lg:w-8/12">
            {/* Breadcrumb - Mobile only */}
            <div className="lg:hidden mb-4 text-sm text-gray-600">
              <Link href="/" className="hover:text-teal-600">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/blogs" className="hover:text-teal-600">Articles</Link>
              <span className="mx-2">/</span>
              <span className="truncate max-w-[200px] inline-block align-bottom">{blog.title}</span>
            </div>

            {/* Featured Image with overlay text */}
            {blog.image && (
              <div className="relative mb-6 rounded-lg overflow-hidden">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-auto object-cover"
                />
                {/* Dark overlay for text visibility - Desktop only */}
                <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                {/* Text content overlay - Desktop only */}
                <div className="hidden lg:block absolute bottom-0 left-0 right-0 p-6 text-white">
                  {/* Breadcrumb */}
                  <div className="mb-3 text-sm">
                    <Link href="/" className="hover:text-gray-300">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href="/blogs" className="hover:text-gray-300">Articles</Link>
                    <span className="mx-2">/</span>
                    <span className="truncate max-w-[300px] inline-block align-bottom">{blog.title}</span>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
                    {blog.title}
                  </h1>

                  {/* Date */}
                  <div className="text-sm text-gray-200">{blog.date}</div>
                </div>
              </div>
            )}

            {/* Title and Date - Mobile only */}
            <div className="lg:hidden mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {blog.title}
              </h1>
              <div className="text-sm text-gray-500">{blog.date}</div>
            </div>
            {/* Blog Content */}
            <div
              className="blog-content mb-12"
              dangerouslySetInnerHTML={{ __html: blog.contentHtml || "" }}
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
          </div>

          {/* Right sidebar - Latest Articles */}
          <div className="w-full lg:w-4/12">
            <div className="lg:sticky lg:top-24">
              {relatedPosts.length > 0 && (
                <div className="space-y-6">
                  {relatedPosts.map((post) => (
                    <Link key={post.id} href={post.link} className="block group">
                      <div className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-200">
                        {post.image && (
                          <div className="relative w-full h-48">
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 group-hover:text-teal-600 line-clamp-2 text-base">
                            {post.title}
                          </h4>
                          <div className="flex items-center justify-between mt-3">
                            <span className="inline-flex items-center px-4 py-2 rounded text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors uppercase">
                              Read More
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BlogDetailPageClient;
