/**
 * Contentful to WordPress Document Templates Migration Script
 *
 * This script migrates legal document templates from Contentful CMS to WordPress
 *
 * Prerequisites:
 * 1. WordPress Application Password set up
 * 2. WordPress custom post type 'documents' configured
 * 3. ACF plugin installed with jurisdiction and template fields
 * 4. Contentful credentials configured in .env.local
 *
 * Usage:
 * npm run migrate:documents
 * or
 * npx tsx scripts/migrate-documents.ts
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
const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://portal.wansom.shop/wp-json/wp/v2';
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
      return `<img src="https:${url}" alt="${title || 'Image'}" />${description ? `<p><em>${description}</em></p>` : ''}`;
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
 * Upload a file to WordPress media library (for document templates)
 */
async function uploadFileToWordPress(fileUrl: string, filename: string, contentType: string): Promise<number | null> {
  try {
    console.log(`  📄 Downloading file from: ${fileUrl}`);

    // Download file from Contentful
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

    console.log(`  📤 Uploading to WordPress: ${filename}`);

    // Upload to WordPress
    const uploadResponse = await fetch(`${WORDPRESS_API_URL}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': contentType || 'application/octet-stream',
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`  ❌ Upload failed: ${uploadResponse.status} - ${errorText}`);
      return null;
    }

    const media = await uploadResponse.json();
    console.log(`  ✅ File uploaded successfully (ID: ${media.id})`);
    return media.id;
  } catch (error) {
    console.error(`  ❌ Error uploading file:`, error);
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
 * Migrate a single document template from Contentful to WordPress
 */
async function migrateDocument(doc: any): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    contentfulId: doc.sys.id,
    contentfulTitle: doc.fields.title || 'Untitled',
  };

  try {
    console.log(`\n📄 Migrating Document: "${result.contentfulTitle}"`);

    // Convert Contentful rich text to HTML
    const content = doc.fields.description
      ? documentToHtmlString(doc.fields.description, wpHtmlRenderOptions)
      : '';

    // Get excerpt/preview
    const excerpt = doc.fields.preview
      ? documentToHtmlString(doc.fields.preview, wpHtmlRenderOptions)
      : (doc.fields.description
        ? documentToPlainTextString(doc.fields.description).substring(0, 300)
        : '');

    // Upload featured image if exists
    let featuredMediaId: number | null = null;
    if (doc.fields.image?.fields?.file?.url) {
      const imageUrl = `https:${doc.fields.image.fields.file.url}`;
      featuredMediaId = await uploadImageToWordPress(imageUrl, result.contentfulTitle);
    }

    // Upload template file if exists
    let templateFileId: number | null = null;
    if (doc.fields.template?.fields?.file) {
      const fileUrl = `https:${doc.fields.template.fields.file.url}`;
      const fileName = doc.fields.template.fields.file.fileName;
      const contentType = doc.fields.template.fields.file.contentType;
      templateFileId = await uploadFileToWordPress(fileUrl, fileName, contentType);
    }

    // Note: documentTemplates in Contentful don't have tags field
    // Tags can be added manually in WordPress if needed
    const tagIds: number[] = [];

    // Create WordPress document post
    console.log(`  📤 Creating document in WordPress...`);
    const wpDocData: any = {
      title: result.contentfulTitle,
      content: content,
      excerpt: excerpt,
      status: 'publish',
      date: doc.sys.createdAt,
      tags: tagIds,
      // ACF fields for custom post type
      acf: {
        jurisdiction: doc.fields.jurisdiction || 'Global',
      },
    };

    if (featuredMediaId) {
      wpDocData.featured_media = featuredMediaId;
    }

    if (templateFileId) {
      wpDocData.acf.template = templateFileId;
    }

    const createResponse = await fetch(`${WORDPRESS_API_URL}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wpDocData),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`WordPress API error: ${createResponse.status} - ${errorText}`);
    }

    const wpDoc = await createResponse.json();
    result.success = true;
    result.wordpressId = wpDoc.id;
    result.wordpressSlug = wpDoc.slug;
    result.wordpressUrl = wpDoc.link;

    console.log(`  ✅ Successfully created document!`);
    console.log(`     WordPress ID: ${wpDoc.id}`);
    console.log(`     Slug: ${wpDoc.slug}`);
    console.log(`     URL: ${wpDoc.link}`);

  } catch (error: any) {
    result.success = false;
    result.error = error.message;
    console.error(`  ❌ Migration failed:`, error.message);
  }

  return result;
}

/**
 * Fetch all document templates from Contentful
 */
async function getAllDocumentsFromContentful() {
  let allItems: any[] = [];
  let skip = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const response = await contentfulClient.getEntries({
      content_type: 'documentTemplates',
      order: ['-sys.createdAt'],
      limit: limit,
      skip: skip,
      select: [
        'sys.id',
        'sys.createdAt',
        'sys.updatedAt',
        'fields.title',
        'fields.preview',
        'fields.description',
        'fields.category',
        'fields.image',
        'fields.template',
        'fields.jurisdiction',
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
async function migrateDocuments() {
  console.log('\n🚀 Starting Document Templates Migration\n');
  console.log('📋 Contentful → WordPress Documents');
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

  console.log(`\n📍 WordPress URL: ${WORDPRESS_API_URL}`);
  console.log(`👤 Username: ${WORDPRESS_USERNAME}`);
  console.log(`📦 Endpoint: ${WORDPRESS_API_URL}/documents`);
  console.log('='.repeat(60));

  try {
    // Fetch all documents from Contentful
    console.log('\n📥 Fetching document templates from Contentful...');
    const documents = await getAllDocumentsFromContentful();
    console.log(`✅ Found ${documents.length} document templates in Contentful\n`);

    if (documents.length === 0) {
      console.log('No documents to migrate. Exiting.');
      return;
    }

    // Migrate each document
    const results: MigrationResult[] = [];
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      console.log(`\n[${ i + 1}/${documents.length}]`);
      const result = await migrateDocument(doc);
      results.push(result);

      // Add a small delay to avoid rate limiting
      if (i < documents.length - 1) {
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
      console.log('\n✅ Successfully Migrated Documents:');
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
    const resultsPath = path.join(__dirname, `document-migration-results-${Date.now()}.json`);
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
migrateDocuments();
