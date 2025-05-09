// app/dashboard/layout.tsx
'use client';

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { 
  Home, 
  Database, 
  MessageSquare, 
  LogOut, 
  ChevronDown, 
  Briefcase,
  Zap,
  PanelLeft,
  PanelRight,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectStore } from "@/store/project.store";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

// Sidebar Link Component - Added onClick prop for mobile navigation
const SidebarLink = ({ href, icon: Icon, label, active, badge, onClick }: SidebarLinkProps) => (
  <Link 
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100",
      active ? "bg-gray-100 text-primary-600 font-medium" : "text-gray-600"
    )}
    onClick={onClick}
  >
    <Icon className={cn("h-5 w-5 min-w-5", active ? "text-primary-600" : "text-gray-500")} />
    <span>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </Link>
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { projects, fetchProjects } = useProjectStore();
  
  // Close mobile menu when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);
  
  // Fetch projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  // Recent projects - limit to 3
  const recentProjects = projects?.slice(0, 3) || [];
  
  // Handle logout
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };
  
  // Handle mobile navigation - close drawer after clicking a link
  const handleMobileNavigation = () => {
    setMobileMenuOpen(false);
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!session?.user?.name) return 'U';
    
    const nameParts = session.user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }
  
  // Sidebar content - extracted to reuse in both desktop and mobile views
  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* User profile */}
      <div className={cn(
        "flex items-center border-b p-4",
        collapsed && !isMobile ? "flex-col" : "space-x-3"
      )}>
        <Avatar className={collapsed && !isMobile ? "h-10 w-10" : "h-9 w-9"}>
          <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
          <AvatarFallback>{getUserInitials()}</AvatarFallback>
        </Avatar>
        {(!collapsed || isMobile) && (
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{session?.user?.name}</p>
            <p className="truncate text-xs text-gray-500">{session?.user?.email}</p>
          </div>
        )}
      </div>
      
      {/* Main navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className={cn("flex flex-col gap-1", collapsed && !isMobile ? "px-2" : "px-3")}>
          {/* Main links */}
          <div className={cn("pb-4", collapsed && !isMobile ? "space-y-3" : "")}>
            <SidebarLink
              href="/dashboard"
              icon={Home}
              label="Dashboard"
              active={pathname === '/dashboard'}
              onClick={isMobile ? handleMobileNavigation : undefined}
            />
            <SidebarLink
              href="/vault"
              icon={Database}
              label="Vault"
              active={pathname === '/vault'}
              onClick={isMobile ? handleMobileNavigation : undefined}
            />
            <SidebarLink
              href="/projects"
              icon={MessageSquare}
              label="Workspaces"
              active={pathname === '/projects'}
              onClick={isMobile ? handleMobileNavigation : undefined}
            />
            <SidebarLink
              href="/workflows"
              icon={Zap}
              label="Associates"
              active={pathname === '/workflows'}
              badge={5}
              onClick={isMobile ? handleMobileNavigation : undefined}
            />
            {/* <SidebarLink
              href="/integrations"
              icon={Clock}
              label="Integrations"
              active={pathname === '/integrations'}
              onClick={isMobile ? handleMobileNavigation : undefined}
            /> */}
          </div>
          
          {/* Recent projects section */}
          {(!collapsed || isMobile) && (
            <>
              <div className="px-3 mb-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recent Workspaces
                </h3>
              </div>
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <SidebarLink
                    key={project.id}
                    href={`/projects/${project.id}`}
                    icon={Briefcase}
                    label={project.title}
                    active={pathname === `/projects/${project.id}`}
                    onClick={isMobile ? handleMobileNavigation : undefined}
                  />
                ))
              ) : (
                <p className="text-xs text-gray-500 px-3">No recent workspaces</p>
              )}
              <div className="mt-2 px-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start" 
                  onClick={() => {
                    router.push('/projects');
                    if (isMobile) handleMobileNavigation();
                  }}
                >
                  <ChevronDown className="mr-2 h-4 w-4" />
                  View All Workspaces
                </Button>
              </div>
            </>
          )}
          {collapsed && !isMobile && (
            <div className="flex flex-col items-center gap-3 my-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push('/projects')}
              >
                <Briefcase className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
          )}
        </nav>
      </ScrollArea>
      
      {/* Footer links */}
      <div className={cn(
        "border-t",
        collapsed && !isMobile ? "p-2" : "p-4"
      )}>
        <nav className="flex flex-col gap-1">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100 text-gray-600",
              collapsed && !isMobile ? "justify-center px-2" : ""
            )}
          >
            <LogOut className="h-5 w-5 text-gray-500" />
            {(!collapsed || isMobile) && <span>Sign out</span>}
          </button>
        </nav>
      </div>
    </div>
  );
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col border-r bg-white transition-all duration-300",
          collapsed ? "w-[70px]" : "w-64"
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center">
              <img 
                src="/logo-lg.png" 
                alt="Logo" 
                className="h-12 w-auto object-contain" 
              />
            </Link>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <PanelRight className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Sidebar content */}
        {sidebarContent()}
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px]">
                  <div className="flex h-16 items-center justify-between border-b px-4">
                    <Link href="/dashboard" className="flex items-center">
                      <img 
                        src="/logo-lg.png" 
                        alt="Logo" 
                        className="h-12 w-auto object-contain" 
                      />
                    </Link>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-5 w-5" />
                      </Button>
                    </SheetClose>
                  </div>
                  {sidebarContent(true)}
                </SheetContent>
              </Sheet>
              
              {/* Logo - visible on mobile */}
              <Link href="/dashboard" className="flex lg:hidden items-center">
                <img 
                  src="/logo-lg.png" 
                  alt="Logo" 
                  className="h-8 w-auto object-contain" 
                />
              </Link>
              
              {/* Page title - visible on desktop */}
              <h1 className="text-xl font-semibold text-gray-800 hidden lg:block" >
                {pathname === '/dashboard' ? 'Dashboard' : 
                 pathname.includes('/vault') ? 'Document Vault' :
                 pathname.includes('/assistant') ? 'AI Assistant' :
                 pathname.includes('/workflows') ? 'Asociates' :
                 pathname.includes('/projects') ? 'Workspaces' : 'Legal AI'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Assistant button */}
              <Button 
                variant="outline" 
                onClick={() => router.push('/assistant')}
                className="hidden sm:flex"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Quick AI Assistant
              </Button>
              
              {/* Mobile assistant icon */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push('/assistant')}
                className="sm:hidden"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              
              {/* User dropdown */}
              <div className="relative group">
                <Button variant="ghost" className="flex items-center space-x-2" size="sm">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">{session?.user?.name?.split(' ')[0]}</span>
                </Button>
                
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block z-50">
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
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}