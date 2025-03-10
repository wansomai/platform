// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Notifications } from "@/components/ui/Notifications";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WakiliChat",
  description: "A legal case management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Notifications/>
          {children}</AuthProvider>
      </body>
    </html>
  );
}