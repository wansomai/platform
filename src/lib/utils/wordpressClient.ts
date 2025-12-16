/**
 * Utility functions for fetching WordPress posts from the API
 * Works in both client and server environments
 */

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://portal.wansom.shop/wp-json/wp/v2";

/**
 * Fetches all WordPress posts with pagination handling
 * @param endpoint - The WordPress API endpoint (default: 'posts')
 * @param includeFeaturedImages - Whether to fetch featured images for each post
 * @returns Array of WordPress posts
 */
export async function fetchAllWordPressPosts(
  endpoint: string = 'posts',
  includeFeaturedImages: boolean = true
): Promise<any[]> {
  try {
    const perPage = 100; // WordPress max per page

    // First request to get total pages
    const initialUrl = `${WORDPRESS_API_URL}/${endpoint}?per_page=${perPage}&page=1`;
    const initialResponse = await fetch(initialUrl);

    if (!initialResponse.ok) {
      throw new Error(`Failed to fetch WordPress ${endpoint}: ${initialResponse.status}`);
    }

    // Get total pages from headers
    const totalPages = parseInt(initialResponse.headers.get('X-WP-TotalPages') || '1', 10);
    const firstPagePosts = await initialResponse.json();

    // If only one page, return early
    if (totalPages === 1) {
      if (includeFeaturedImages) {
        return await fetchFeaturedImagesForPosts(firstPagePosts);
      }
      return firstPagePosts;
    }

    // Fetch remaining pages in parallel
    const pagePromises = [];
    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(
        fetch(`${WORDPRESS_API_URL}/${endpoint}?per_page=${perPage}&page=${page}`)
          .then(res => res.ok ? res.json() : [])
      );
    }

    const additionalPages = await Promise.all(pagePromises);
    let allPosts = [...firstPagePosts];

    additionalPages.forEach(pagePosts => {
      if (Array.isArray(pagePosts)) {
        allPosts = [...allPosts, ...pagePosts];
      }
    });

    // Fetch featured images if needed
    if (includeFeaturedImages) {
      return await fetchFeaturedImagesForPosts(allPosts);
    }

    return allPosts;
  } catch (error) {
    console.error(`Error fetching WordPress ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Fetches featured images for an array of WordPress posts
 * @param posts - Array of WordPress posts
 * @returns Posts with featured_image_url added
 */
async function fetchFeaturedImagesForPosts(posts: any[]): Promise<any[]> {
  return Promise.all(
    posts.map(async (post: any) => {
      if (post.featured_media) {
        try {
          const mediaResponse = await fetch(
            `${WORDPRESS_API_URL}/media/${post.featured_media}`
          );
          if (mediaResponse.ok) {
            const media = await mediaResponse.json();
            post.featured_image_url = media.source_url;
          }
        } catch (error) {
          console.error(`Error fetching media for post ${post.id}:`, error);
        }
      }
      return post;
    })
  );
}

/**
 * Fetches WordPress posts by specific tag
 * @param tagSlug - The slug of the tag to filter by
 * @param includeFeaturedImages - Whether to fetch featured images
 * @returns Array of posts with the specified tag
 */
export async function fetchWordPressPostsByTag(
  tagSlug: string,
  includeFeaturedImages: boolean = true
): Promise<any[]> {
  try {
    // First, get the tag ID by slug
    const tagResponse = await fetch(`${WORDPRESS_API_URL}/tags?slug=${tagSlug}`);

    if (!tagResponse.ok) {
      throw new Error(`Failed to fetch tag: ${tagResponse.status}`);
    }

    const tags = await tagResponse.json();

    if (tags.length === 0) {
      return [];
    }

    const tagId = tags[0].id;
    const perPage = 100;

    // First request to get total pages
    const initialUrl = `${WORDPRESS_API_URL}/posts?tags=${tagId}&per_page=${perPage}&page=1`;
    const initialResponse = await fetch(initialUrl);

    if (!initialResponse.ok) {
      throw new Error(`Failed to fetch posts by tag: ${initialResponse.status}`);
    }

    const totalPages = parseInt(initialResponse.headers.get('X-WP-TotalPages') || '1', 10);
    const firstPagePosts = await initialResponse.json();

    if (totalPages === 1) {
      if (includeFeaturedImages) {
        return await fetchFeaturedImagesForPosts(firstPagePosts);
      }
      return firstPagePosts;
    }

    // Fetch remaining pages
    const pagePromises = [];
    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(
        fetch(`${WORDPRESS_API_URL}/posts?tags=${tagId}&per_page=${perPage}&page=${page}`)
          .then(res => res.ok ? res.json() : [])
      );
    }

    const additionalPages = await Promise.all(pagePromises);
    let allPosts = [...firstPagePosts];

    additionalPages.forEach(pagePosts => {
      if (Array.isArray(pagePosts)) {
        allPosts = [...allPosts, ...pagePosts];
      }
    });

    if (includeFeaturedImages) {
      return await fetchFeaturedImagesForPosts(allPosts);
    }

    return allPosts;
  } catch (error) {
    console.error(`Error fetching posts by tag ${tagSlug}:`, error);
    return [];
  }
}
