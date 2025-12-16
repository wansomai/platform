# Contentful to WordPress Document Migration Script

This directory contains the migration script for transferring legal document templates from Contentful CMS to WordPress.

## Migration Script

**File:** `migrate-documents.ts`

This script migrates legal document templates from Contentful to your WordPress custom post type.

### Features
- ✅ Migrates document templates to WordPress `/wp-json/wp/v2/documents`
- ✅ Handles featured images (downloads from Contentful, uploads to WordPress)
- ✅ Handles document template files (PDF, DOCX, etc.)
- ✅ Converts Contentful rich text to WordPress HTML
- ✅ Manages tags (creates new tags if needed)
- ✅ Preserves custom fields (jurisdiction)
- ✅ Rate limiting to avoid API throttling
- ✅ Detailed migration results saved to JSON file

### Prerequisites

#### 1. WordPress Setup

Your WordPress site must have:
- Custom post type `documents` configured with REST API enabled
- ACF (Advanced Custom Fields) plugin installed
- Application Password created for your WordPress user

**Custom Post Type Registration** (add to `functions.php`):
```php
function register_document_post_type() {
    register_post_type('documents', [
        'labels' => [
            'name' => 'Documents',
            'singular_name' => 'Document',
        ],
        'public' => true,
        'has_archive' => true,
        'show_in_rest' => true, // Required for REST API!
        'supports' => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
        'rewrite' => ['slug' => 'documents'],
    ]);
}
add_action('init', 'register_document_post_type');
```

**ACF Field Group Setup:**

Create an ACF field group for the `documents` post type with these fields:

1. **Jurisdiction** (Text field)
   - Field name: `jurisdiction`
   - Field type: Text
   - Show in REST API: **Yes** ✅

2. **Template** (File field)
   - Field name: `template`
   - Field type: File
   - Return format: ID
   - Show in REST API: **Yes** ✅

#### 2. Environment Variables

Create or update `.env.local` with:

```env
# Contentful
NEXT_PUBLIC_CONTENTFUL_SPACE_ID=your_space_id
NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN=your_access_token

# WordPress
NEXT_PUBLIC_WORDPRESS_API_URL=https://portal.wansom.shop/wp-json/wp/v2
WORDPRESS_USERNAME=your_username
WORDPRESS_APP_PASSWORD=your_app_password
```

**To create a WordPress Application Password:**
1. Go to WordPress Admin → Users → Profile
2. Scroll to "Application Passwords"
3. Enter a name (e.g., "Contentful Migration")
4. Click "Add New Application Password"
5. Copy the generated password (spaces are optional)

### Usage

Run the migration script:

```bash
npm run migrate:documents
```

or directly:

```bash
npx tsx scripts/migrate-documents.ts
```

### What Gets Migrated?

For each document template, the script migrates:

| Contentful Field | WordPress Field | Notes |
|-----------------|-----------------|-------|
| Title | Post Title | - |
| Description (rich text) | Post Content | Converted to HTML |
| Preview (rich text) | Post Excerpt | Converted to HTML |
| Image | Featured Image | Downloaded & uploaded to WordPress |
| Template File | ACF Field (`template`) | Downloaded & uploaded to WordPress media |
| Jurisdiction | ACF Field (`jurisdiction`) | Custom field |
| Created Date | Post Date | - |

### Output

The script will:

1. **Console Output**: Display real-time progress with emoji indicators
   - 📄 Document being migrated
   - 📸 Image being downloaded/uploaded
   - 📤 File being uploaded
   - 🏷️ Tags being processed
   - ✅ Success indicators
   - ❌ Error messages

2. **JSON File**: Save detailed results to `document-migration-results-{timestamp}.json`

3. **Summary**: Print a complete summary showing:
   - Total documents processed
   - Successful migrations with URLs
   - Failed migrations with error details

### Example Output

```
🚀 Starting Document Templates Migration

📋 Contentful → WordPress Documents
============================================================

📍 WordPress URL: https://portal.wansom.shop/wp-json/wp/v2
👤 Username: admin
📦 Endpoint: https://portal.wansom.shop/wp-json/wp/v2/documents
============================================================

📥 Fetching document templates from Contentful...
✅ Found 150 document templates in Contentful

[1/150]

📄 Migrating Document: "Athletic Scholarship Agreement Template"
  📸 Downloading image from: https://images.ctfassets.net/...
  📤 Uploading to WordPress: athletic-scholarship.jpg
  ✅ Image uploaded successfully (ID: 328)
  📄 Downloading file from: https://assets.ctfassets.net/...
  📤 Uploading to WordPress: athletic-scholarship.docx
  ✅ File uploaded successfully (ID: 329)
  🏷️  Processing 3 tags...
  🏷️  Found existing tag: Legal Templates (ID: 12)
  🏷️  Created new tag: Sports Law (ID: 45)
  🏷️  Found existing tag: Contracts (ID: 8)
  📤 Creating document in WordPress...
  ✅ Successfully created document!
     WordPress ID: 327
     Slug: athletic-scholarship-agreement-template
     URL: https://portal.wansom.shop/documents/athletic-scholarship-agreement-template/

...

============================================================
📊 Migration Summary
============================================================

✅ Successful: 148
❌ Failed: 2
📝 Total: 150

✅ Successfully Migrated Documents:
   1. Athletic Scholarship Agreement Template
      → https://portal.wansom.shop/documents/athletic-scholarship-agreement-template/
   ...

💾 Detailed results saved to: document-migration-results-1702834567890.json

============================================================
✨ Migration Complete!
```

## Troubleshooting

### Authentication Errors

**Error:** "WordPress API error: 401"

**Solutions:**
- Verify your WordPress Application Password is correct (no extra spaces)
- Confirm your WordPress username is correct
- Ensure Application Passwords are enabled on your WordPress site
- Check that your WordPress user has sufficient permissions

### Custom Post Type Errors

**Error:** "WordPress API error: 404" on `/wp-json/wp/v2/documents`

**Solutions:**
- Confirm the `documents` custom post type is registered
- Verify `'show_in_rest' => true` is set in the post type registration
- Flush WordPress permalinks (Settings → Permalinks → Save)
- Test the endpoint manually: `curl https://your-site.com/wp-json/wp/v2/documents`

### ACF Field Errors

**Error:** Fields not saving or "ACF field not found"

**Solutions:**
- Ensure ACF Pro is installed and activated
- Verify the ACF field group is assigned to the `documents` post type
- Check that "Show in REST API" is enabled for both ACF fields
- Confirm field names match exactly: `jurisdiction` and `template`

### Upload Errors

**Error:** "Upload failed: 413" or "Payload too large"

**Solutions:**
- Increase WordPress upload limits in `php.ini`:
  ```ini
  upload_max_filesize = 64M
  post_max_size = 64M
  ```
- Check WordPress media settings (Settings → Media)
- Verify file permissions on WordPress uploads directory

**Error:** "Failed to download file from Contentful"

**Solutions:**
- Ensure Contentful assets are published
- Check that asset URLs are accessible (not behind authentication)
- Verify your Contentful access token has proper permissions

### Rate Limiting

**Error:** Multiple "429 Too Many Requests" errors

**Solutions:**
- The script includes a 1-second delay between documents
- To increase the delay, edit `migrate-documents.ts`:
  ```typescript
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
  ```
- Consider migrating in smaller batches

## Archived Scripts

The following scripts are kept for reference but are no longer used:

- `migrate-contentful-to-wordpress.ts` - Original blog-only migration (blogs already migrated)
- `migrate-contentful-to-wordpress-unified.ts` - Combined blog + document migration (superseded)

These can be deleted if no longer needed.

## Verifying Migration

After migration, verify the results:

1. **Check WordPress Admin:**
   - Navigate to Documents in WordPress admin
   - Verify document count matches Contentful
   - Check that featured images are displayed
   - Confirm template files are attached

2. **Check REST API:**
   ```bash
   curl https://portal.wansom.shop/wp-json/wp/v2/documents
   ```

3. **Check Frontend:**
   - Visit a few document URLs from the migration summary
   - Verify content displays correctly
   - Test template file downloads

## Support

If you encounter issues:

1. Check the generated JSON file for detailed error messages
2. Verify all environment variables are set correctly
3. Test WordPress API access manually
4. Check WordPress error logs (`wp-content/debug.log`)
5. Ensure all required plugins (ACF) are installed and active
6. Verify custom post type and ACF field configuration

## Post-Migration Cleanup

After successful migration:

1. Review the migration summary and JSON results
2. Verify a sample of documents on WordPress
3. Update your application to fetch from WordPress instead of Contentful
4. (Optional) Archive or delete old migration scripts
5. (Optional) Keep the migration results JSON for reference
