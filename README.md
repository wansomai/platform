This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

For full functionality, you'll need to set up the following environment variables:

### Google Vision API (for OCR)
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
```

### Google Cloud Storage (for PDF OCR)
```bash
GOOGLE_CLOUD_STORAGE_BUCKET=your-storage-bucket-name
```

**Note:** PDF OCR for scanned documents requires Google Cloud Storage for temporary file processing. The system will automatically fall back to traditional PDF text extraction if GCS is not configured.

### Setup Instructions
1. Create a Google Cloud Project
2. Enable the Vision API and Cloud Storage API
3. Create a service account and download the JSON key file
4. Create a Cloud Storage bucket
5. Set the environment variables above

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

From the team Wansom.
