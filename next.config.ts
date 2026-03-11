import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    // NEXTAUTH_SECRET must be set in environment variables - never hardcode secrets
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
        port: '',
        pathname: '/**',
      },
        {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gk61pmqpaowbmuxc.public.blob.vercel-storage.com',
       port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Turbopack configuration for tesseract.js and WebAssembly support
  turbopack: {
    resolveAlias: {
      'tesseract.js/dist/worker.min.js': 'tesseract.js/dist/worker.min.js',
    },
  },
  // Keep Google AI SDKs as native Node.js requires rather than bundling them
  // through Turbopack. This prevents the "Invalid source map" dev-mode warnings
  // that appear when Turbopack tries to parse malformed source maps inside those
  // packages' dist files.
  serverExternalPackages: [
    '@google/genai',
    '@google/generative-ai',
    '@google-cloud/local-auth',
    'googleapis',
  ],
  // Experimental features
  experimental: {},
  // Redirects
  async redirects() {
    return [
      {
        source: '/ai-case-prediction',
        destination: '/solutions/litigation-lawyers',
        permanent: true, // 301 redirect - SEO friendly
      },
      {
        source: '/ai-legal-research',
        destination: '/ai-assistant',
        permanent: true, // 301 redirect - SEO friendly
      },
    ];
  },
};

export default nextConfig;
