// app/layout.tsx
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Notifications } from "@/components/ui/Notifications";
import AuthProvider from "@/providers/AuthProvider";
import Script from 'next/script';

const inter = Roboto({ weight: "300", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wansom AI",
  description: "Wansom AI,Collaborative AI workspace for legal teams.",
  openGraph: {
    title: 'Wansom AI',
    description: 'Collaborative AI workspace for legal teams',
    url: 'https://www.wansom.ai/',
    siteName: 'Wansom AI',
    images: '/images/features-2.png',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
                  <head>
             <meta name="google-site-verification" content="fkcTStcVW3qayGemjRjx9Jcr5Ryq0bBCG5GLDjMiLuw" />
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
      <body className={inter.className}>
        <AuthProvider>
          <Notifications/>
          {children}</AuthProvider>
      </body>
    </html>
  );
}