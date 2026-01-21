// lib/data/sanity.ts
import { client, urlFor } from '../sanity';
import {
  postsQuery,
  postBySlugQuery,
  legalDocumentsQuery,
  legalDocumentBySlugQuery
} from '../queries';

// Timeout helper for fetch requests
const FETCH_TIMEOUT = 30000;

// ============================================
// TYPES
// ============================================

export interface SanityPost {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt?: string;
  mainImage?: {
    asset: {
      _id: string;
      url: string;
    };
    alt?: string;
  };
  body: any[]; // Portable Text
  author?: {
    _id: string;
    name: string;
    slug: string;
    image?: {
      asset: {
        _id: string;
        url: string;
      };
    };
    bio?: any[]; // Portable Text
  };
  categories?: Array<{
    _id: string;
    title: string;
    description?: string;
  }>;
}

export interface SanityLegalDocument {
  _id: string;
  title: string;
  slug: string;
  category: string;
  jurisdiction: string;
  tags?: string[];
  preview?: {
    asset: {
      _id: string;
      url: string;
    };
    alt?: string;
  };
  image?: {
    asset: {
      _id: string;
      url: string;
    };
    alt?: string;
  };
  description: any[]; // Portable Text
  descriptionPreview?: string;
  template?: {
    asset: {
      _id: string;
      url: string;
      originalFilename?: string;
      size?: number;
    };
  };
  _createdAt: string;
}

// ============================================
// BLOG POST FUNCTIONS
// ============================================

// Fetch all blog posts
export async function getAllBlogPosts(): Promise<SanityPost[]> {
  try {
    const posts = await client.fetch(postsQuery);
    return posts;
  } catch (error) {
    console.error('Error fetching Sanity blog posts:', error);
    throw error;
  }
}

// Get a single blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<SanityPost | null> {
  try {
    const post = await client.fetch(postBySlugQuery, { slug });
    return post;
  } catch (error) {
    console.error(`Error fetching Sanity post with slug ${slug}:`, error);
    return null;
  }
}

// Get blog posts by tag
export async function getBlogPostsByTag(tagSlug: string): Promise<SanityPost[]> {
  try {
    const query = `*[_type == "post" && $tagSlug in categories[]->slug.current] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      "excerpt": array::join(string::split((pt::text(body)), "")[0..200], "") + "...",
      mainImage {
        asset->{
          _id,
          url
        },
        alt
      },
      author->{
        _id,
        name,
        "slug": slug.current
      },
      categories[]->{
        _id,
        title,
        description
      }
    }`;

    const posts = await client.fetch(query, { tagSlug });
    return posts;
  } catch (error) {
    console.error(`Error fetching Sanity posts by tag ${tagSlug}:`, error);
    return [];
  }
}

// Get related blog posts (excluding the current one)
export async function getRelatedBlogPosts(
  currentSlug: string,
  categories: string[] = [],
  limit: number = 6
): Promise<SanityPost[]> {
  try {
    const allPosts = await getAllBlogPosts();

    // Filter out the current post
    const otherPosts = allPosts.filter((post) => post.slug !== currentSlug);

    // If there are categories, prioritize posts with matching categories
    if (categories.length > 0) {
      return otherPosts
        .sort((a, b) => {
          const aMatches = a.categories?.filter((cat) =>
            categories.includes(cat._id)
          ).length || 0;
          const bMatches = b.categories?.filter((cat) =>
            categories.includes(cat._id)
          ).length || 0;
          return bMatches - aMatches;
        })
        .slice(0, limit);
    }

    // Otherwise just return the most recent posts
    return otherPosts.slice(0, limit);
  } catch (error) {
    console.error('Error fetching related Sanity posts:', error);
    return [];
  }
}

// ============================================
// LEGAL DOCUMENT FUNCTIONS
// ============================================

// Fetch all legal documents
export async function getAllLegalDocuments(): Promise<SanityLegalDocument[]> {
  try {
    const documents = await client.fetch(legalDocumentsQuery);
    return documents;
  } catch (error) {
    console.error('Error fetching Sanity legal documents:', error);
    throw error;
  }
}

// Get a single legal document by slug
export async function getLegalDocumentBySlug(slug: string): Promise<SanityLegalDocument | null> {
  try {
    const document = await client.fetch(legalDocumentBySlugQuery, { slug });
    return document;
  } catch (error) {
    console.error(`Error fetching Sanity legal document with slug ${slug}:`, error);
    return null;
  }
}

// Get legal documents by category
export async function getLegalDocumentsByCategory(category: string): Promise<SanityLegalDocument[]> {
  try {
    const query = `*[_type == "legalDocument" && category == $category] | order(_createdAt desc) {
      _id,
      title,
      "slug": slug.current,
      category,
      jurisdiction,
      tags,
      preview {
        asset->{
          _id,
          url
        },
        alt
      },
      "descriptionPreview": array::join(string::split((pt::text(description)), "")[0..150], "") + "..."
    }`;

    const documents = await client.fetch(query, { category });
    return documents;
  } catch (error) {
    console.error(`Error fetching Sanity legal documents by category ${category}:`, error);
    return [];
  }
}

export default {
  getAllBlogPosts,
  getBlogPostBySlug,
  getBlogPostsByTag,
  getRelatedBlogPosts,
  getAllLegalDocuments,
  getLegalDocumentBySlug,
  getLegalDocumentsByCategory,
};
