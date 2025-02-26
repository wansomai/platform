import { ReactNode } from "react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col min-h-screen">
        <header className="py-4 px-6 bg-white shadow-sm">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              {/* Replace with your logo */}
              <div className="w-10 h-10 bg-primary-600 rounded-md flex items-center justify-center text-white font-bold">
                WC
              </div>
              <span className="text-xl font-bold">WakiliChat</span>
            </Link>
            <nav className="hidden sm:flex space-x-8">
              <Link 
                href="/features" 
                className="text-gray-600 hover:text-gray-900"
              >
                Features
              </Link>
              <Link 
                href="/pricing" 
                className="text-gray-600 hover:text-gray-900"
              >
                Pricing
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-600 hover:text-gray-900"
              >
                Contact
              </Link>
            </nav>
          </div>
        </header>
        
        <main className="flex-1">
          {children}
        </main>
        
        <footer className="py-6 px-6 bg-white border-t">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-500">
                  &copy; {new Date().getFullYear()} WakiliChat. All rights reserved.
                </p>
              </div>
              <div className="flex space-x-6">
                <Link 
                  href="/terms" 
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Terms
                </Link>
                <Link 
                  href="/privacy" 
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Privacy
                </Link>
                <Link 
                  href="/security" 
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Security
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}