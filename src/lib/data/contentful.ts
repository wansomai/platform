// lib/contentful.ts
import { createClient } from "contentful";
import { createSlug } from "./blogAdapter";

// Initialize Contentful client
const client = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID || "",
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN || "",
});

export interface BlogPostFields {
  title: string;
  preview?: string;
  content: any; // Rich text content
  image?: {
    fields: {
      file: {
        url: string;
        details?: {
          size?: number;
          image?: {
            width: number;
            height: number;
          };
        };
        fileName?: string;
        contentType?: string;
      };
      title?: string;
      description?: string;
    };
  };
  tags?: string[]; // Optional tags field
}
export interface LawyerPageFields {
  title: string;
  preview?: string;
  practiceArea: string;
  location: string;
  slug: string;
  metaDescription?: string; // Optional meta description field
  faq?: any; // Rich text content for FAQ
  keywords?: string[]; // Optional keywords field
  tags?: string[]; // Optional tags field
}
export interface practiseAreaFields {
  title: string;
  content: any;
  slug: string;
  metaDescription?: string; // Optional meta description field
  faq?: any; // Rich text content for FAQ
}
export interface DocumentTemplateFields {
  title: string;
  preview?: any;
  description: any; // Rich text content
  image?: {
    fields: {
      file: {
        url: string;
        details?: {
          size?: number;
          image?: {
            width: number;
            height: number;
          };
        };
        fileName?: string;
        contentType?: string;
      };
      title?: string;
    };
  };
  tags?: string[]; // Optional tags field
}
export interface BlogPost {
  sys: {
    id: string;
    createdAt: string;
    updatedAt: string;
    contentType: {
      sys: {
        id: string;
      };
    };
  };
  fields: BlogPostFields;
}
export interface DocumentTemplate {
  sys: {
    id: string;
    createdAt: string;
    updatedAt: string;
    contentType: {
      sys: {
        id: string;
      };
    };
  };
  fields: DocumentTemplateFields;
}

export interface LawyerPages {
  sys: {
    id: string;
    createdAt: string;
    updatedAt: string;
    contentType: {
      sys: {
        id: string;
      };
    };
  };
  fields: LawyerPageFields;
}
export interface practiseAreaPages {
  sys: {
    id: string;
    createdAt: string;
    updatedAt: string;
    contentType: {
      sys: {
        id: string;
      };
    };
  };
  fields: practiseAreaFields;
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  let allItems: BlogPost[] = [];
  let skip = 0;
  const limit = 1000; // Maximum allowed by Contentful
  let hasMore = true;

  while (hasMore) {
    const response = await client.getEntries({
      content_type: "blogPost",
      order: ["-sys.createdAt"],
      limit: limit,
      skip: skip
    });

    allItems = [...allItems, ...(response.items as unknown as BlogPost[])];
    
    // Check if there are more items to fetch
    hasMore = response.items.length === limit;
    skip += limit;
  }

  return allItems;
}

export async function getAllDocumentTemplates(): Promise<DocumentTemplate[]> {
  let allItems: DocumentTemplate[] = [];
  let skip = 0;
  const limit = 1000; // Maximum allowed by Contentful
  let hasMore = true;

  while (hasMore) {
    const response = await client.getEntries({
      content_type: "documentTemplates",
      order: ["-sys.createdAt"],
      limit: limit,
      skip: skip
    });

    allItems = [...allItems, ...(response.items as unknown as DocumentTemplate[])];
    
    // Check if there are more items to fetch
    hasMore = response.items.length === limit;
    skip += limit;
  }

  return allItems;
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const response = await client.getEntry(id);
    return response as unknown as BlogPost;
  } catch (error) {
    console.error("Error fetching blog post by ID:", error);
    return null;
  }
}

export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  try {
    // Get all blog posts since Contentful doesn't support filtering by slug directly
    const allPosts = await getAllBlogPosts();

    // Find the post with matching slug
    const post = allPosts.find((post) => {
      const postSlug = createSlug(post.fields.title || "");
      return postSlug === slug;
    });

    return post || null;
  } catch (error) {
    console.error("Error fetching blog post by slug:", error);
    return null;
  }
}

// Get blog posts by tag
export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  const response = await client.getEntries({
    content_type: "blogPost",
    "fields.tags": tag,
    order: ["-sys.createdAt"],
  });

  return response.items as unknown as BlogPost[];
}

// Get related blog posts (excluding the current one)
export async function getRelatedBlogPosts(
  currentSlug: string,
  tags: string[] = [],
  limit: number = 3
): Promise<BlogPost[]> {
  // Get all blog posts
  const allPosts = await getAllBlogPosts();

  // Filter out the current post
  const otherPosts = allPosts.filter((post) => {
    const postSlug = createSlug(post.fields.title || "");
    return postSlug !== currentSlug;
  });

  // If there are tags, prioritize posts with matching tags
  if (tags.length > 0) {
    // Sort by matching tag count (posts with more matching tags come first)
    return otherPosts
      .sort((a, b) => {
        const aTagMatches =
          a.fields.tags?.filter((tag) => tags.includes(tag)).length || 0;
        const bTagMatches =
          b.fields.tags?.filter((tag) => tags.includes(tag)).length || 0;
        return bTagMatches - aTagMatches;
      })
      .slice(0, limit);
  }

  // Otherwise just return the most recent posts
  return otherPosts.slice(0, limit);
}

export async function getAllLawyerPages(): Promise<LawyerPages[]> {
  const response = await client.getEntries({
    content_type: "lawyerPages",
    order: ["-sys.createdAt"], // Get newest first
  });

  return response.items as unknown as LawyerPages[];
}
export async function getAllPractiseAreas(): Promise<practiseAreaPages[]> {
  const response = await client.getEntries({
    content_type: "practiseareas",
    order: ["-sys.createdAt"],
  });

  return response.items as unknown as practiseAreaPages[];
}
export async function getAllSlugs() {
  const res = await client.getEntries({
    content_type: "lawyerLandingPage",
    select: ["fields.slug"],
  });
  return res.items.map((i) => i.fields.slug);
}

export async function getLandingPage(slug: string,) {
  const res = await client.getEntries({
    content_type: "lawyerPages",
    "fields.slug": slug,
    include: 2,
    limit: 1
  });
  return res.items[0]?.fields as any;
}

export default client;
