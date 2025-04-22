// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Notifications } from "@/components/ui/Notifications";
import AuthProvider from "@/providers/AuthProvider";
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wansom",
  description: "Automate your legal processes with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
                  <head>
             <meta name="google-site-verification" content="g1yOFnL9E89beutPCUKKscciPwMZMDXPiyhz8Fqh0Y0" />
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