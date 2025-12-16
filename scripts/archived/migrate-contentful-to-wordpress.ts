/**
 * Contentful to WordPress Blog Migration Script
 *
 * This script migrates blog posts from Contentful CMS to WordPress
 *
 * Prerequisites:
 * 1. WordPress Application Password set up
 * 2. Contentful credentials configured in .env.local
 *
 * Usage:
 * npm run migrate:blogs
 * or
 * npx tsx scripts/migrate-contentful-to-wordpress.ts
 */

// Load environment variables from .env.local FIRST
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local file before anything else
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from 'contentful';
import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';

// WordPress Configuration
const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://portal.wansom.ai/wp-json/wp/v2';
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME || '';
const WORDPRESS_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD || '';

// Contentful Configuration
const CONTENTFUL_SPACE_ID = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID || '';
const CONTENTFUL_ACCESS_TOKEN = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN || '';

// Create Basic Auth header for WordPress
const authHeader = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`).toString('base64');

// Create Contentful client
const contentfulClient = createClient({
  space: CONTENTFUL_SPACE_ID,
  accessToken: CONTENTFUL_ACCESS_TOKEN,
});

// HTML renderer options for WordPress content
const wpHtmlRenderOptions = {
  renderMark: {
    [MARKS.BOLD]: (text: string) => `<strong>${text}</strong>`,
    [MARKS.ITALIC]: (text: string) => `<em>${text}</em>`,
    [MARKS.UNDERLINE]: (text: string) => `<u>${text}</u>`,
    [MARKS.CODE]: (text: string) => `<code>${text}</code>`,
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node: any, next: any) => `<p>${next(node.content)}</p>`,
    [BLOCKS.HEADING_1]: (node: any, next: any) => `<h1>${next(node.content)}</h1>`,
    [BLOCKS.HEADING_2]: (node: any, next: any) => `<h2>${next(node.content)}</h2>`,
    [BLOCKS.HEADING_3]: (node: any, next: any) => `<h3>${next(node.content)}</h3>`,
    [BLOCKS.HEADING_4]: (node: any, next: any) => `<h4>${next(node.content)}</h4>`,
    [BLOCKS.UL_LIST]: (node: any, next: any) => `<ul>${next(node.content)}</ul>`,
    [BLOCKS.OL_LIST]: (node: any, next: any) => `<ol>${next(node.content)}</ol>`,
    [BLOCKS.LIST_ITEM]: (node: any, next: any) => `<li>${next(node.content)}</li>`,
    [BLOCKS.QUOTE]: (node: any, next: any) => `<blockquote>${next(node.content)}</blockquote>`,
    [BLOCKS.HR]: () => `<hr />`,
    [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
      const { url, title, description } = node.data.target.fields.file;
      return `<img src="https:${url}" alt="${title || 'Blog image'}" />${description ? `<p><em>${description}</em></p>` : ''}`;
    },
    [INLINES.HYPERLINK]: (node: any, next: any) => {
      const href = node.data.uri;
      return `<a href="${href}" ${href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${next(node.content)}</a>`;
    },
  },
};

interface MigrationResult {
  success: boolean;
  contentfulId: string;
  contentfulTitle: string;
  wordpressId?: number;
  wordpressSlug?: string;
  wordpressUrl?: string;
  error?: string;
}

/**
 * Upload an image to WordPress media library
 */
async function uploadImageToWordPress(imageUrl: string, title: string): Promise<number | null> {
  try {
    console.log(`  📸 Downloading image from: ${imageUrl}`);

    // Download image from Contentful
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const filename = path.basename(new URL(imageUrl).pathname);

    console.log(`  📤 Uploading to WordPress: ${filename}`);

    // Upload to WordPress
    const uploadResponse = await fetch(`${WORDPRESS_API_URL}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`  ❌ Upload failed: ${uploadResponse.status} - ${errorText}`);
      return null;
    }

    const media = await uploadResponse.json();
    console.log(`  ✅ Image uploaded successfully (ID: ${media.id})`);
    return media.id;
  } catch (error) {
    console.error(`  ❌ Error uploading image:`, error);
    return null;
  }
}

/**
 * Get or create a tag in WordPress
 */
async function getOrCreateTag(tagName: string): Promise<number | null> {
  try {
    // Search for existing tag
    const searchResponse = await fetch(
      `${WORDPRESS_API_URL}/tags?search=${encodeURIComponent(tagName)}`,
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
        },
      }
    );

    if (searchResponse.ok) {
      const tags = await searchResponse.json();
      const existingTag = tags.find((tag: any) =>
        tag.name.toLowerCase() === tagName.toLowerCase()
      );

      if (existingTag) {
        console.log(`  🏷️  Found existing tag: ${tagName} (ID: ${existingTag.id})`);
        return existingTag.id;
      }
    }

    // Create new tag
    const createResponse = await fetch(`${WORDPRESS_API_URL}/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: tagName,
        slug: tagName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
      }),
    });

    if (createResponse.ok) {
      const tag = await createResponse.json();
      console.log(`  🏷️  Created new tag: ${tagName} (ID: ${tag.id})`);
      return tag.id;
    }

    return null;
  } catch (error) {
    console.error(`  ❌ Error with tag ${tagName}:`, error);
    return null;
  }
}

/**
 * Migrate a single blog post from Contentful to WordPress
 */
async function migratePost(post: any): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    contentfulId: post.sys.id,
    contentfulTitle: post.fields.title || 'Untitled',
  };

  try {
    console.log(`\n📝 Migrating: "${result.contentfulTitle}"`);

    // Convert Contentful rich text to HTML
    const content = post.fields.content
      ? documentToHtmlString(post.fields.content, wpHtmlRenderOptions)
      : '';

    // Get excerpt/preview
    const excerpt = post.fields.preview || (
      post.fields.content
        ? documentToPlainTextString(post.fields.content).substring(0, 300)
        : ''
    );

    // Upload featured image if exists
    let featuredMediaId: number | null = null;
    if (post.fields.image?.fields?.file?.url) {
      const imageUrl = `https:${post.fields.image.fields.file.url}`;
      featuredMediaId = await uploadImageToWordPress(imageUrl, result.contentfulTitle);
    }

    // Get or create tags
    const tagIds: number[] = [];
    if (post.fields.tags && Array.isArray(post.fields.tags)) {
      console.log(`  🏷️  Processing ${post.fields.tags.length} tags...`);
      for (const tagName of post.fields.tags) {
        const tagId = await getOrCreateTag(tagName);
        if (tagId) {
          tagIds.push(tagId);
        }
      }
    }

    // Create WordPress post
    console.log(`  📤 Creating post in WordPress...`);
    const wpPostData: any = {
      title: result.contentfulTitle,
      content: content,
      excerpt: excerpt,
      status: 'publish',
      date: post.sys.createdAt,
      tags: tagIds,
    };

    if (featuredMediaId) {
      wpPostData.featured_media = featuredMediaId;
    }

    const createResponse = await fetch(`${WORDPRESS_API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wpPostData),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`WordPress API error: ${createResponse.status} - ${errorText}`);
    }

    const wpPost = await createResponse.json();
    result.success = true;
    result.wordpressId = wpPost.id;
    result.wordpressSlug = wpPost.slug;
    result.wordpressUrl = wpPost.link;

    console.log(`  ✅ Successfully created post!`);
    console.log(`     WordPress ID: ${wpPost.id}`);
    console.log(`     Slug: ${wpPost.slug}`);
    console.log(`     URL: ${wpPost.link}`);

  } catch (error: any) {
    result.success = false;
    result.error = error.message;
    console.error(`  ❌ Migration failed:`, error.message);
  }

  return result;
}

/**
 * Fetch all blog posts from Contentful
 */
async function getAllBlogPostsFromContentful() {
  let allItems: any[] = [];
  let skip = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const response = await contentfulClient.getEntries({
      content_type: 'blogPost',
      order: ['-sys.createdAt'],
      limit: limit,
      skip: skip,
      select: [
        'sys.id',
        'sys.createdAt',
        'sys.updatedAt',
        'fields.title',
        'fields.preview',
        'fields.content',
        'fields.image',
      ],
      include: 1,
    });

    allItems = [...allItems, ...response.items];

    hasMore = response.items.length === limit;
    skip += limit;

    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return allItems;
}

/**
 * Main migration function
 */
async function migrateBlogPosts() {
  console.log('\n🚀 Starting Contentful to WordPress Migration\n');
  console.log('='.repeat(60));

  // Validate credentials
  if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
    console.error('\n❌ Error: WordPress credentials not configured!');
    console.error('Please set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD in your .env.local file\n');
    process.exit(1);
  }

  if (!CONTENTFUL_SPACE_ID || !CONTENTFUL_ACCESS_TOKEN) {
    console.error('\n❌ Error: Contentful credentials not configured!');
    console.error('Please set NEXT_PUBLIC_CONTENTFUL_SPACE_ID and NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN in your .env.local file\n');
    process.exit(1);
  }

  console.log(`📍 WordPress URL: ${WORDPRESS_API_URL}`);
  console.log(`👤 Username: ${WORDPRESS_USERNAME}`);
  console.log('='.repeat(60));

  try {
    // Fetch all posts from Contentful
    console.log('\n📥 Fetching posts from Contentful...');
    const contentfulPosts = await getAllBlogPostsFromContentful();
    console.log(`✅ Found ${contentfulPosts.length} posts in Contentful\n`);

    if (contentfulPosts.length === 0) {
      console.log('No posts to migrate. Exiting.');
      return;
    }

    // Migrate each post
    const results: MigrationResult[] = [];
    for (let i = 0; i < contentfulPosts.length; i++) {
      const post = contentfulPosts[i];
      console.log(`\n[${i + 1}/${contentfulPosts.length}]`);
      const result = await migratePost(post);
      results.push(result);

      // Add a small delay to avoid rate limiting
      if (i < contentfulPosts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Print summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📝 Total: ${results.length}`);

    if (successful.length > 0) {
      console.log('\n✅ Successfully Migrated Posts:');
      successful.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.contentfulTitle}`);
        console.log(`      → ${r.wordpressUrl}`);
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed Migrations:');
      failed.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.contentfulTitle}`);
        console.log(`      Error: ${r.error}`);
      });
    }

    // Save results to JSON file
    const resultsPath = path.join(__dirname, 'migration-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsPath}`);

    console.log('\n' + '='.repeat(60));
    console.log('✨ Migration Complete!\n');

  } catch (error: any) {
    console.error('\n❌ Fatal error during migration:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateBlogPosts();
