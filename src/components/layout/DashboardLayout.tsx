'use client';

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Sparkle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";


export default function DashboardLayoutComponent({ children }: { children: ReactNode }) {

  const router = useRouter();
  const { user, logout } = useAuth();
  

  
  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };
  
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-4">
           
              
              <Link href="/dashboard" className="flex items-center">
                <img
                  src="/logo-sm.png"
                  alt="Logo"
                 
                  className="h-8 w-auto object-contain"
                /> 
               
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {/* <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="rounded-full border border-gray-300 bg-gray-50 py-1.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div> */}
              
              <Link href="/assistant" className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                <span className="text-green-600">Assistant</span>
              </Link>
              
              <div className="relative group">
                <Button variant="ghost" className="flex items-center space-x-2 " size="sm">
                  <Avatar className="h-6 w-6 bg-green-100">
                    <AvatarImage src={undefined} alt={user?.name || "User"} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">{user?.name}</span>
                </Button>
                
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}