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
  FileText, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown, 
  Clock, 
  Briefcase,
  Search,
  Zap,
  PanelLeft,
  PanelRight,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectStore } from "@/store/project.store";

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number;
}

// Sidebar Link Component
const SidebarLink = ({ href, icon: Icon, label, active, badge }: SidebarLinkProps) => (
  <Link 
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100",
      active ? "bg-gray-100 text-primary-600 font-medium" : "text-gray-600"
    )}
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
  const { projects, fetchProjects } = useProjectStore();
  
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
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col border-r bg-white transition-all duration-300",
          collapsed ? "w-[70px]" : "w-64"
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center">
              <img 
                src="/logo-sm.png" 
                alt="Logo" 
                className="h-8 w-auto object-contain" 
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
        
        {/* User profile */}
        <div className={cn(
          "flex items-center border-b p-4",
          collapsed ? "flex-col" : "space-x-3"
        )}>
          <Avatar className={collapsed ? "h-10 w-10" : "h-9 w-9"}>
            <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{session?.user?.name}</p>
              <p className="truncate text-xs text-gray-500">{session?.user?.email}</p>
            </div>
          )}
        </div>
        
        {/* Main navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className={cn("flex flex-col gap-1", collapsed ? "px-2" : "px-3")}>
            {/* Main links */}
            <div className={cn("pb-4", collapsed ? "space-y-3" : "")}>
              <SidebarLink
                href="/dashboard"
                icon={Home}
                label="Dashboard"
                active={pathname === '/dashboard'}
              />
              <SidebarLink
                href="/vault"
                icon={Database}
                label="Vault"
                active={pathname === '/vault'}
               
              />
              <SidebarLink
                href="/projects"
                icon={MessageSquare}
                label="Workspaces"
                active={pathname === '/projects'}
              />
              <SidebarLink
                href="/workflows"
                icon={Zap}
                label="Workflows"
                active={pathname === '/workflows'}
                badge={5}
              />
              <SidebarLink
                href="/integrations"
                icon={Clock}
                label="Integrations"
                active={pathname === '/integrations'}
              />
            </div>
            
            {/* Recent projects section */}
            {!collapsed && (
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
                    />
                  ))
                ) : (
                  <p className="text-xs text-gray-500 px-3">No recent workspaces</p>
                )}
                <div className="mt-2 px-3">
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => router.push('/projects')}>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    View All Workspaces
                  </Button>
                </div>
              </>
            )}
            {collapsed && (
              <div className="flex flex-col items-center gap-3 my-3">
                <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
                  <Briefcase className="h-5 w-5 text-gray-500" />
                </Button>
              </div>
            )}
          </nav>
        </ScrollArea>
        
        {/* Footer links */}
        <div className={cn(
          "border-t",
          collapsed ? "p-2" : "p-4"
        )}>
          <nav className="flex flex-col gap-1">
            {/* <SidebarLink
              href="/profile"
              icon={User}
              label="Profile"
              active={pathname === '/profile'}
            />
            <SidebarLink
              href="/settings"
              icon={Settings}
              label="Settings"
              active={pathname === '/settings'}
            /> */}
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100 text-gray-600",
                collapsed ? "justify-center px-2" : ""
              )}
            >
              <LogOut className="h-5 w-5 text-gray-500" />
              {!collapsed && <span>Sign out</span>}
            </button>
          </nav>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex-1 flex items-center">
              {/* <div className="relative max-w-md w-full mr-4 hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search everything..." 
                  className="w-full pl-10 rounded-full border-gray-200"
                />
              </div> */}
              {/* <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
                {pathname === '/dashboard' ? 'Dashboard' : 
                 pathname.includes('vault') ? 'Document Vault' :
                 pathname.includes('assistant') ? 'AI Assistant' :
                 pathname.includes('workflows') ? 'Workflows' :
                 pathname.includes('integrations') ? 'Integrations' : 'Legal AI'}
              </h1> */}
            </div>
            <div className="flex items-center space-x-4">
              {/* <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => router.push('/notifications')}
              >
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-600"></span>
                <Bell className="h-5 w-5" />
              </Button> */}
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/assistant')}
                className="hidden sm:flex"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Quick Assistant
              </Button>
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