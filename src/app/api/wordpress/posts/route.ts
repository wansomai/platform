import { NextRequest, NextResponse } from 'next/server';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://portal.wansom.ai/wp-json/wp/v2";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fetchAll = searchParams.get('fetch_all') === 'true';
    const perPage = '100'; // WordPress max per page

    let allPosts: any[] = [];

    if (fetchAll) {
      // First request to get total pages
      const initialUrl = `${WORDPRESS_API_URL}/posts?_embed&per_page=${perPage}&page=1&orderby=date&order=desc`;

      const initialResponse = await fetch(initialUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (!initialResponse.ok) {
        return NextResponse.json(
          { error: `WordPress API error: ${initialResponse.status}` },
          { status: initialResponse.status }
        );
      }

      // Get total pages from headers
      const totalPages = parseInt(initialResponse.headers.get('X-WP-TotalPages') || '1', 10);
      const firstPagePosts = await initialResponse.json();
      allPosts = [...firstPagePosts];

      // Fetch remaining pages
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        const url = `${WORDPRESS_API_URL}/posts?_embed&per_page=${perPage}&page=${page}&orderby=date&order=desc`;
        pagePromises.push(
          fetch(url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            next: { revalidate: 300 }, // Cache for 5 minutes
          }).then(res => res.ok ? res.json() : [])
        );
      }

      const additionalPages = await Promise.all(pagePromises);
      additionalPages.forEach(pagePosts => {
        if (Array.isArray(pagePosts)) {
          allPosts = [...allPosts, ...pagePosts];
        }
      });
    } else {
      // Single page fetch (backward compatibility)
      const page = searchParams.get('page') || '1';
      const url = `${WORDPRESS_API_URL}/posts?_embed&per_page=${perPage}&page=${page}&orderby=date&order=desc`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `WordPress API error: ${response.status}` },
          { status: response.status }
        );
      }

      allPosts = await response.json();
    }

    // Fetch featured images for all posts
    const postsWithImages = await Promise.all(
      allPosts.map(async (post: any) => {
        if (post.featured_media && post.featured_media > 0) {
          try {
            const mediaResponse = await fetch(
              `${WORDPRESS_API_URL}/media/${post.featured_media}`,
              {
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                next: { revalidate: 3600 },
              }
            );

            if (mediaResponse.ok) {
              const media = await mediaResponse.json();
              post.featured_image_url = media.source_url;
            }
          } catch (error) {
            console.error(`Error fetching media ${post.featured_media}:`, error);
          }
        }
        return post;
      })
    );

    return NextResponse.json(postsWithImages, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching WordPress posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
