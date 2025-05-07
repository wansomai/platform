// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Notifications } from "@/components/ui/Notifications";
import AuthProvider from "@/providers/AuthProvider";
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wansom AI",
  description: "Wansom AI, AI assistant, free legal documents, contract reviews,company lawyer.",
  openGraph: {
    title: 'Wansom AI',
    description: 'Your AI assistant for all your legal needs',
    url: 'https://www.wansom.co/',
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

<Script
  id="twitter-pixel"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
      },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
      a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
      twq('config','pp93c');
      twq('event', 'tw-pp93c-pp93e', {
        phone_number: null // phone number in E164 standard
      });
    `
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