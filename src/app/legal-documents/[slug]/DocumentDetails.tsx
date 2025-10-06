"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getAllDocumentTemplates } from "@/lib/data/contentful";
import {adaptDocumentTemplate, createSlug } from "@/lib/data/blogAdapter";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Send,
  Loader2,
  SlidersHorizontal,
  X,
  Paperclip,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Lazy load Footer component
const Footer = dynamic(() => import("@/components/layout/Footer"), {
  ssr: true,
});

interface PageProps {
  params: {
    slug: string;
    id: string;
  };
}


const DocDetailPageClient = ({ params }: PageProps) => {
  const { slug, id } = params;
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        if (!slug || typeof slug !== 'string') {
          throw new Error('Invalid blog slug');
        }

        setLoading(true);
        
        // Get all blog posts and find the one with matching slug
        const allBlogPosts = await getAllDocumentTemplates();
        
        // Find the blog post with matching slug
        const blogPost = allBlogPosts.find(post => {
          const postSlug = createSlug(post.fields.title);
          return postSlug === slug;
        });
        
        if (!blogPost) {
          throw new Error('Blog post not found');
        }
        
        const adaptedPost = adaptDocumentTemplate(blogPost);
        setBlog(adaptedPost);

        // Pre-fill chat input with document title
        setChatInput(`Help me customize this legal document template`);
      } catch (err) {
        setError('Failed to load legal document');

      } finally {
        setLoading(false);
      }
    };
    fetchBlogPost();
  }, [slug]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [chatInput]);

  // Handle chat input send
  const handleSend = async () => {
    console.log('Send button clicked!', { chatInput, isSubmitting });

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      console.log('Navigating to register page...');
      // Navigate to register page when send is clicked
      router.push('/register');
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
          <p className="mb-6">The requested legal document could not be found.</p>
          <img src="/404.png" className="mx-aut0 -mt-20"/>
          <Link
            href="/legal-documents"
            className="flex gap-1 items-center bg-teal-600 text-sm text-white px-6 py-2 rounded-md"
          >
            View More Documents <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
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
    <div className="bg-gray-50 min-h-screen">
      <Navbar darkmode />
      {/* Header Section */}

      {/* Chat Input Section */}
      <section className="bg-gray-100 pb-12 pt-24 md:pt-32 lg:pt-40">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {blog.title}
            </h1>
            <p className="text-gray-600">
              Draft entire legal documents and forms from scratch with AI or start with professional templates.
            </p>
          </div>

          {/* Chat Input Area */}
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="w-full">
              <div className="bg-white rounded-xl border-2 border-gray-200 focus-within:border-primary-300 transition-colors relative shadow-sm focus-within:shadow-md">

                {/* Left side icons */}
                <div className="absolute flex items-center gap-1 z-10 w-full left-6 bottom-3">
                  {/* Documents Tool */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-md cursor-not-allowed opacity-60"
                    title="Documents (available after registration)"
                    disabled={true}
                  >
                    <Paperclip className="h-6 w-6 text-gray-600" />
                  </Button>

                  {/* Tools Dropdown */}
                  <DropdownMenu
                    open={showToolsDropdown}
                    onOpenChange={setShowToolsDropdown}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-fit px-2 rounded-md hover:bg-gray-100"
                        title="AI Tools (preview - will be configurable after registration)"
                      >
                        <SlidersHorizontal className="h-6 w-6 text-gray-700" />{" "}
                        Tools
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-72 p-4 mb-2"
                      side="top"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm text-gray-700">
                            Available AI Tools
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowToolsDropdown(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label
                              htmlFor="web-search"
                              className="font-medium text-sm"
                            >
                              Deep Research
                            </Label>
                          </div>
                          <Switch
                            id="web-search"
                            checked={false}
                            disabled={true}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label
                              htmlFor="legal-drafting"
                              className="font-medium text-sm"
                            >
                              Legal drafting
                            </Label>
                          </div>
                          <Switch
                            id="legal-drafting"
                            checked={false}
                            disabled={true}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label
                              htmlFor="contract-review"
                              className="font-medium text-sm"
                            >
                              Contract Review
                            </Label>
                          </div>
                          <Switch
                            id="contract-review"
                            checked={false}
                            disabled={true}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label
                              htmlFor="case-preparation"
                              className="font-medium text-sm"
                            >
                              Case Preparation
                            </Label>
                          </div>
                          <Switch
                            id="case-preparation"
                            checked={false}
                            disabled={true}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label
                                htmlFor="cite-sources"
                                className="font-medium text-sm"
                              >
                                Cite sources
                              </Label>
                            </div>
                            <Switch
                              id="cite-sources"
                              checked={false}
                              disabled={true}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label
                                htmlFor="suggest-actions"
                                className="font-medium text-sm"
                              >
                                Suggest actions
                              </Label>
                            </div>
                            <Switch
                              id="suggest-actions"
                              checked={false}
                              disabled={true}
                            />
                          </div>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Settings Button */}
                  <button
                    className="h-8 w-fit px-3 py-2 rounded-lg shadow-lg flex gap-1 items-center border-gray-10 border cursor-not-allowed opacity-60"
                    disabled={true}
                    title="Settings (available after registration)"
                  >
                    <Settings className="h-4 w-4 text-gray-700 text-xs" />
                    Settings
                  </button>
                </div>

                <Textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about this document..."
                  className="border-0 resize-none rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-gray-600 min-h-[120px] max-h-[200px] px-6 py-4 pr-16 text-[13px] md:text-base"
                  disabled={isSubmitting}
                />

                {/* Send button positioned inside textarea */}
                <div className="absolute right-3 bottom-3 z-10">
                  <Button
                    className="bg-[#d47b0f] hover:bg-[#355e66] text-white z-10 shadow-md h-10 w-10 rounded-lg"
                    disabled={isSubmitting}
                    onClick={handleSend}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin text-white h-5 w-5" />
                    ) : (
                      <Send className="text-white h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Helper text */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-700">
                Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-900">Enter</kbd> to send,
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-900 ml-1">Shift+Enter</kbd> for new line
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
        {blog.image ? (
            <div className="block lg:hidden">
              <div className="">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  width={800}
                  height={600}
                  priority
                  className="rounded-lg w-full h-auto object-cover"
                />
              </div>
                <div className="flex justify-center mt-4 gap-2">
                  <Link href={'/login'} className="bg-primary text-white py-2 px-4 rounded-lg"> Customize Template</Link>
                  <Link href={'/contact'} className="bg-secondary text-white py-2 px-4 rounded-lg"> Ask A Lawyer</Link>
                </div>
            </div>
          ):  <div className="block lg:hidden">
              <div className="">
                <Image
                  src="/contract-sample.webp"
                  alt={blog.title}
                  width={800}
                  height={600}
                  priority
                  className="rounded-lg w-full h-auto object-cover"
                />
                <div className="flex justify-center mt-4 gap-2">
                  <Link href={'/login'} className="bg-primary text-white py-2 px-4 rounded-lg"> Customize Template</Link>
                  <Link href={'/contact'} className="bg-secondary text-white py-2 px-4 rounded-lg"> Ask A Lawyer</Link>
                </div>
              </div>

            </div>}
            
          
          
          {/* Main content column */}
          <div className="w-full lg:w-7/12">
            {/* Breadcrumb */}
              <div className="container mx-auto py-4 text-sm ">
                <div className="flex items-center">
                  <Link href="/" className="hover:text-teal-600">
                    Home
                  </Link>
                  <span className="mx-2">/</span>
                  <Link href="/legal-documents" className="hover:text-teal-600  whitespace-nowrap">
                    Legal Documents
                  </Link>
                  <span className="mx-2">/</span>
                  <span className="truncate text-teal-600">
                    {blog.title}
                  </span>
                </div>
                
              </div>
            {/* Blog Content */}
            <div
              className="blog-content mb-12"
              dangerouslySetInnerHTML={{ __html: blog.contentHtml || "" }}
            />

            {/* Tags */}
            {/* {blog.tags && blog.tags.length > 0 && (
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
            )} */}

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
                        <p className="text-sm text-gray-700">{post.date}</p>
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
                  src="/contract-sample.webp"
                  alt={blog.title}
                  width={1200}
                  height={630}
                  priority
                  sizes="(max-width: 1024px) 100vw, 41.67vw"
                  className="rounded-lg w-full h-auto object-cover max-h-[500px] mb-5"
                />

                  <div className="flex justify-center mt-4 gap-2">
                  <Link href={'/login'} className="bg-primary text-white py-2 px-4 rounded-lg"> Customize Template</Link>
                  <Link href={'/contact'} className="bg-secondary text-white py-2 px-4 rounded-lg"> Ask A Lawyer</Link>
                </div>
              </div>

            </div>
          )}
          {!blog.image && (
            <div className="hidden lg:block w-5/12">
              <div className="sticky top-32">
              <Image
                  src="/contract-sample.webp"
                  alt={blog.title}
                  width={1200}
                  height={630}
                  priority
                  sizes="(max-width: 1024px) 100vw, 41.67vw"
                  className="rounded-lg w-full h-auto object-cover max-h-[500px] mb-5"
                />

                   <div className="flex justify-center mt-4 gap-2">
                  <Link href={'/login'} className="bg-primary text-white py-2 px-4 rounded-lg"> Customize Template</Link>
                  <Link href={'/contact'} className="bg-secondary text-white py-2 px-4 rounded-lg"> Ask A Lawyer</Link>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DocDetailPageClient;
