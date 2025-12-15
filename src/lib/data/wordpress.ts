// lib/data/wordpress.ts

// WordPress REST API base URL
const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://portal.wansom.ai/wp-json/wp/v2";

// Timeout helper for fetch requests (30 seconds)
const FETCH_TIMEOUT = 30000;

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), FETCH_TIMEOUT)
    )
  ]);
}

export interface WordPressPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  meta: any[];
  categories: number[];
  tags: number[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      id: number;
      source_url: string;
      alt_text: string;
      media_details?: {
        width: number;
        height: number;
        sizes?: any;
      };
    }>;
    "wp:term"?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
  };
}

export interface WordPressFeaturedMedia {
  id: number;
  source_url: string;
  alt_text: string;
  media_details?: {
    width: number;
    height: number;
  };
}

// Fetch all blog posts with embedded media and terms
export async function getAllBlogPosts(): Promise<WordPressPost[]> {
  try {
    // Use the Next.js API route with fetch_all=true to get all posts across all pages
    const response = await fetchWithTimeout('/api/wordpress/posts?fetch_all=true', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }

    const posts: WordPressPost[] = await response.json();
    console.log(`Fetched ${posts.length} blog posts from WordPress`);
    return posts;
  } catch (error) {
    console.error("Error fetching WordPress blog posts:", error);
    throw error;
  }
}

// Get a single blog post by ID
export async function getBlogPostById(id: number): Promise<WordPressPost | null> {
  try {
    const url = `${WORDPRESS_API_URL}/posts/${id}?_embed`;

    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch WordPress post: ${response.status}`);
    }

    const post: WordPressPost = await response.json();
    return post;
  } catch (error) {
    console.error(`Error fetching WordPress post with ID ${id}:`, error);
    return null;
  }
}

// Get a blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<WordPressPost | null> {
  try {
    const url = `${WORDPRESS_API_URL}/posts?slug=${slug}&_embed`;

    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch WordPress post: ${response.status}`);
    }

    const posts: WordPressPost[] = await response.json();

    if (posts.length === 0) {
      return null;
    }

    return posts[0];
  } catch (error) {
    console.error(`Error fetching WordPress post with slug ${slug}:`, error);
    return null;
  }
}

// Get blog posts by tag
export async function getBlogPostsByTag(tagSlug: string): Promise<WordPressPost[]> {
  try {
    // First, get the tag ID by slug
    const tagResponse = await fetchWithTimeout(`${WORDPRESS_API_URL}/tags?slug=${tagSlug}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!tagResponse.ok) {
      throw new Error(`Failed to fetch tag: ${tagResponse.status}`);
    }

    const tags = await tagResponse.json();

    if (tags.length === 0) {
      return [];
    }

    const tagId = tags[0].id;

    // Fetch all posts with this tag across all pages
    let allPosts: WordPressPost[] = [];
    const perPage = 100;

    // First request to get total pages
    const initialUrl = `${WORDPRESS_API_URL}/posts?tags=${tagId}&_embed&per_page=${perPage}&page=1`;
    const initialResponse = await fetchWithTimeout(initialUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!initialResponse.ok) {
      throw new Error(`Failed to fetch WordPress posts by tag: ${initialResponse.status}`);
    }

    const totalPages = parseInt(initialResponse.headers.get('X-WP-TotalPages') || '1', 10);
    const firstPagePosts = await initialResponse.json();
    allPosts = [...firstPagePosts];

    // Fetch remaining pages if there are any
    if (totalPages > 1) {
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        const url = `${WORDPRESS_API_URL}/posts?tags=${tagId}&_embed&per_page=${perPage}&page=${page}`;
        pagePromises.push(
          fetchWithTimeout(url, {
            headers: {
              'Accept': 'application/json',
            },
          }).then(res => res.ok ? res.json() : [])
        );
      }

      const additionalPages = await Promise.all(pagePromises);
      additionalPages.forEach(pagePosts => {
        if (Array.isArray(pagePosts)) {
          allPosts = [...allPosts, ...pagePosts];
        }
      });
    }

    return allPosts;
  } catch (error) {
    console.error(`Error fetching WordPress posts by tag ${tagSlug}:`, error);
    return [];
  }
}

// Get related blog posts (excluding the current one)
export async function getRelatedBlogPosts(
  currentSlug: string,
  tags: number[] = [],
  limit: number = 3
): Promise<WordPressPost[]> {
  try {
    // Get all posts
    const allPosts = await getAllBlogPosts();

    // Filter out the current post
    const otherPosts = allPosts.filter((post) => post.slug !== currentSlug);

    // If there are tags, prioritize posts with matching tags
    if (tags.length > 0) {
      return otherPosts
        .sort((a, b) => {
          const aTagMatches = a.tags.filter((tag) => tags.includes(tag)).length;
          const bTagMatches = b.tags.filter((tag) => tags.includes(tag)).length;
          return bTagMatches - aTagMatches;
        })
        .slice(0, limit);
    }

    // Otherwise just return the most recent posts
    return otherPosts.slice(0, limit);
  } catch (error) {
    console.error("Error fetching related WordPress posts:", error);
    return [];
  }
}

// Get featured media URL for a post
export async function getFeaturedMediaUrl(mediaId: number): Promise<string | undefined> {
  try {
    const url = `${WORDPRESS_API_URL}/media/${mediaId}`;

    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const media: WordPressFeaturedMedia = await response.json();
    return media.source_url;
  } catch (error) {
    console.error(`Error fetching media ${mediaId}:`, error);
    return undefined;
  }
}

export default {
  getAllBlogPosts,
  getBlogPostById,
  getBlogPostBySlug,
  getBlogPostsByTag,
  getRelatedBlogPosts,
  getFeaturedMediaUrl,
};
