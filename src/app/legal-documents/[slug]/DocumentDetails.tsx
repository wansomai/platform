"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllLegalDocuments } from "@/lib/data/sanity";
import { adaptSanityLegalDocuments } from "@/lib/data/blogAdapter";
import GuestCanvasChatSplitView from "@/components/guest/GuestCanvasChatSplitView";

interface PageProps {
  blog: any | null;
  initialJurisdictionId: string;
}

// Strip HTML tags to get plain text for AI prompts
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const DocDetailPageClient = ({ blog, initialJurisdictionId }: PageProps) => {
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);

  // Fetch related documents for SEO section below the fold
  useEffect(() => {
    if (!blog) return;
    const fetchRelated = async () => {
      try {
        const allDocs = await getAllLegalDocuments();
        const adapted = adaptSanityLegalDocuments(allDocs);
        setRelatedPosts(adapted.filter((doc: any) => doc.id !== blog.id).slice(0, 6));
      } catch {
        // ignore
      }
    };
    fetchRelated();
  }, [blog]);

  if (!blog) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-5xl font-semibold text-primary font-serif">Oops!</h1>
        <p className="text-gray-600">The requested legal document could not be found.</p>
        <img src="/404.png" className="max-w-xs" alt="404" />
        <Link
          href="/legal-documents"
          className="flex gap-1 items-center bg-teal-600 text-sm text-white px-6 py-2 rounded-md"
        >
          View More Documents
        </Link>
      </div>
    );
  }

  const plainTitle = stripHtml(blog.title);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Full-height canvas + chat split view */}
      <main className="flex-1 overflow-hidden">
        <GuestCanvasChatSplitView
          documentType="nda"
          initialJurisdictionId={initialJurisdictionId}
          documentTitle={plainTitle}
          documentDescription={blog.contentHtml || undefined}
        />
      </main>

      {/* SEO: related documents hidden below the fold (rendered but not visible in the viewport) */}
      {relatedPosts.length > 0 && (
        <aside className="hidden" aria-hidden="true">
          <h2>More documents in this category</h2>
          <ul>
            {relatedPosts.map((post) => (
              <li key={post.id}>
                <Link href={post.link}>
                  <span dangerouslySetInnerHTML={{ __html: post.title }} />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
};

export default DocDetailPageClient;
