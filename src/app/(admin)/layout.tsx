import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getAdminUserFromSession } from "@/lib/auth/admin";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Server-side admin check
  const { isAdmin, email } = await getAdminUserFromSession();

  // If not admin, show 404 page (hides existence of admin panel)
  if (!isAdmin) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </Link>
              <Badge variant="destructive" className="hidden sm:inline-flex">
                Admin Access
              </Badge>
              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-4 ml-4">
                <Link
                  href="/admin"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Organizations
                </Link>
                <Link
                  href="/admin/legal-knowledge"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Knowledge Base
                </Link>
              </div>
            </div>

            {/* Right side - User Info */}
            <div className="flex items-center gap-3">
       
              <Link
                href="/dashboard"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
