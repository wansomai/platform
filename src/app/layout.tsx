// app/layout.tsx
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Notifications } from "@/components/ui/Notifications";
import AuthProvider from "@/providers/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Script from 'next/script';


// Configure Roboto with multiple weights for professional use
const roboto = Roboto({ 
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-roboto'
});

export const metadata: Metadata = {
  title: "Wansom | AI workspace for lawyers",
  description: "Wansom AI is a leading AI workspace for lawyers to automate contract review,legal drafting, streamline regulatory compliance, and optimize decision-making.",
  openGraph: {
    title: 'Wansom AI',
    description: 'Wansom AI is a leading AI workspace for lawyers to automate contract review,legal drafting, streamline regulatory compliance, and optimize decision-making.',
    url: 'https://www.wansom.ai/',
    siteName: 'Wansom AI',
    images: [
      {
        url: '/images/features-2.png',
        width: 1200,
        height: 630,
        alt: 'Wansom AI - Legal AI Platform'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wansom AI',
    description: 'Wansom AI is a leading AI workspace for lawyers to automate contract review,legal drafting, streamline regulatory compliance, and optimize decision-making.',
    images: ['/images/features-2.png'],
  },
  keywords: [
    'legal AI',
    'law firm software',
    'document automation',
    'legal tech',
    "AI Lawyer",
    'AI assistant',
    'AI Contract review'
  ],
  authors: [{ name: 'Wansom AI' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <head>
        <meta name="google-site-verification" content="fkcTStcVW3qayGemjRjx9Jcr5Ryq0bBCG5GLDjMiLuw" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#355e66" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Resource hints for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-J08Q7P3RH2`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-J08Q7P3RH2', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className={`${roboto.className} antialiased`}>
        <AuthProvider>
          <ErrorBoundary>
            <Notifications />
            {children}
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}