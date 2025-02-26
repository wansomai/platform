"use client"

import { ReactNode, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Briefcase,
  Calendar,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
  Bell,
  Search,
  User,
  HelpCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/auth.store"
import { cn } from "@/lib/utils"

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAuthenticated, isLoading } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])
  
  // Navigation items
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: Briefcase,
    },
    {
      name: "Documents",
      href: "/documents",
      icon: FileText,
    },
    {
      name: "Team",
      href: "/team",
      icon: Users,
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: Calendar,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]
  
  // Handle logout
  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.fullName) return 'U'
    
    const nameParts = user.fullName.split(' ')
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase()
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
  }
  
  // Show loading or not authenticated state
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 transform bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center text-white font-bold">
                WC
              </div>
              <span className="text-lg font-bold">WakiliChat</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Sidebar content */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Sidebar footer */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.fullName || "User"} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.fullName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>
              {/* Breadcrumb could go here */}
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="rounded-full border border-gray-300 bg-gray-50 py-1.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto p-2">
                    <p className="text-center text-sm text-gray-500 py-4">No new notifications</p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Documentation</DropdownMenuItem>
                  <DropdownMenuItem>Support</DropdownMenuItem>
                  <DropdownMenuItem>Feedback</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2" size="sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.fullName || "User"} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block">{user?.fullName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}