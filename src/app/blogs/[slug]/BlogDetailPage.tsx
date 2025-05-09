"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getAllBlogPosts, getBlogPostById, getRelatedBlogPosts } from "@/lib/data/contentful";
import { adaptBlogPost, adaptBlogPosts } from "@/lib/data/blogAdapter";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "react-day-picker";
import { Linkedin } from "lucide-react";

interface PageProps {
  params: {
    slug: string;
    id: string;
  };
}

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
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
          <h1 className="text-2xl font-semibold text-red-600 mb-4">
            {error || "Blog post not found"}
          </h1>
          <p className="mb-6">The requested blog post could not be found.</p>
          <Link
            href="/blogs"
            className="inline-block bg-teal-600 text-white px-6 py-2 rounded-md"
          >
            Return to Blogs
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
    <div className="bg-gray-50 min-h-screen">
      <div className="fixed left-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-4 z-50">
        <a
          href={twitterShareUrl}
          target="_blank"
          className="text-slate-800 hover:text-slate-600 transition-colors"
        >
          <div className="w-8 h-8 border border-yellow-600 rounded-full flex items-center justify-center ">
            <svg
              className="w-6 h-6"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M36.6526 3.8078H43.3995L28.6594 20.6548L46 43.5797H32.4225L21.7881 29.6759L9.61989 43.5797H2.86886L18.6349 25.56L2 3.8078H15.9222L25.5348 16.5165L36.6526 3.8078ZM34.2846 39.5414H38.0232L13.8908 7.63406H9.87892L34.2846 39.5414Z"
                fill="black"
              />
            </svg>
          </div>
        </a>
        <a
          href={linkedinShareUrl}
          target="_blank"
          className="text-slate-800 hover:text-slate-600 transition-colors"
        >
          <div className="w-8 h-8 border rounded-full border-yellow-600 flex items-center justify-center">
            <Linkedin className="w-4 h-4" />
          </div>
        </a>
      </div>
      {/* Header Section */}
      <section className="">
        <Navbar />
        <div className="container mx-auto px-6 md:pl-20 py-10 pt-32">
          <div className="grid  gap-12">
            {/* Left Column - Contact Form */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                {blog.title}
              </h1>
              {/* Breadcrumb */}
              <div className="container mx-auto px-4 py-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Link href="/" className="hover:text-teal-600">
                    Home
                  </Link>
                  <span className="mx-2">/</span>
                  <Link href="/blogs" className="hover:text-teal-600">
                    Articles
                  </Link>
                  <span className="mx-2">/</span>
                  <span className="text-gray-500 truncate max-w-[200px]">
                    {blog.title}
                  </span>
                </div>
                <div className="flex items-center mt-2">
                  <span className="mr-4">{blog.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
        {blog.image && (
            <div className="blcok lg:hidden">
              <div className="">
                <img
                  src={blog.image}
                  alt={blog.title}
                
                  className="rounded-lg w-full h-auto object-cover"
                />
              </div>
            </div>
          )}
          {/* Main content column */}
          <div className="w-full lg:w-7/12">
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

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-xl font-semibold mb-6">Related Articles</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedPosts.map((post) => (
                    <Link key={post.id} href={post.link} className="block group">
                      <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                        <h4 className="font-semibold text-gray-800 mb-2 group-hover:text-teal-600">
                          {post.title}
                        </h4>
                        <p className="text-sm text-gray-500">{post.date}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fixed image column */}
          {blog.image && (
            <div className="hidden lg:block w-5/12">
              <div className="sticky top-32">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  width={1200}
                  height={630}
                  className="rounded-lg w-full h-auto object-cover max-h-[500px]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BlogDetailPageClient;
