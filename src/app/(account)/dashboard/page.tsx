// app/dashboard/page.tsx
"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import WelcomeBanner from "@/components/layout/WelcomeBanner";
import {
  FileText,
  FolderPlus,
  ArrowRight,
  MessageSquare,
  Briefcase,
  FileUp,
  Zap,
  Loader2,
  LucideScanEye,
  Scale,
} from "lucide-react";
import { useProjectStore } from "@/store/project.store";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { useDocumentsStore } from "@/store/documents.store";
import { useNotifications } from "@/hooks/useNotifications";
import { ChatInput } from "@/components/chat/ChatInput";
import { useProfile } from "@/store/profile.store";
// Quick Action Card Component
interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  color?: string;
  loading?: boolean;
  disabled?: boolean;
}

const QuickActionCard = React.memo(
  ({
    icon: Icon,
    title,
    href,
    onClick,
    color = "text-primary",
    loading = false,
    disabled = false,
  }: QuickActionProps) => {
    const content = (
      <div
        className={`block p-3 ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <div className="">
          <div className=" flex gap-1 flex-shrink-0">
            <div
              className={`rounded  ${color.replace("text", "bg")}/10 ${
                disabled ? "opacity-50" : ""
              }`}
            >
              {loading ? (
                <Loader2 className={`h-6 w-6 animate-spin ${color}`} />
              ) : (
                <Icon className={`h-6 w-6 text-gray-600`} />
              )}
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-gray-600">{title}</h3>
              {loading && (
                <span className="text-xs text-gray-500 animate-pulse">
                  Creating...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    if (href && !loading && !disabled) {
      return (
        <Card className="hover:shadow-md transition-all">
          <Link href={href}>{content}</Link>
        </Card>
      );
    }

    return (
      <Card
        className={`hover:shadow-md transition-all ${
          !disabled && !loading ? "hover:shadow-md" : ""
        }`}
      >
        <div onClick={disabled || loading ? undefined : onClick}>{content}</div>
      </Card>
    );
  }
);

export default function DashboardPage() {
  const router = useRouter();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [isCreatingQuickChat, setIsCreatingQuickChat] = useState(false);
  const {
    fetchProjects,
    projects,
    isLoading: projectsLoading,
  } = useProjectStore();
  const {
    documents,
    fetchDocuments,
    isLoading: documentsLoading,
  } = useDocumentsStore();
  const { fetchProfile } = useProfile();
  const { notify } = useNotifications();

  // Load dashboard data on mount only
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchProjects(),
          fetchDocuments({ limit: 5 }),
          fetchProfile(true), // Fetch fresh profile to ensure latest activeOrganizationId
        ]);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load dashboard data";
        notify.error(errorMessage);
      }
    };

    loadData();
  }, []); // Only run on mount

  // Memoized computed values for performance
  const recentProjects = useMemo(() => projects?.slice(0, 3) || [], [projects]);

  const recentDocuments = useMemo(
    () => documents?.slice(0, 5) || [],
    [documents]
  );

  // Memoized event handlers
  const handleShowProjectModal = useCallback(() => {
    setShowProjectModal(true);
  }, []);

  const handleCloseProjectModal = useCallback(() => {
    setShowProjectModal(false);
  }, []);

  const handleWorkspaceCreated = useCallback((projectId: string) => {
    // Optional: Handle workspace creation if needed
  }, []);

  // Memoized router navigation handlers
  const navigateToVault = useCallback(() => {
    router.push("/vault");
  }, [router]);

  const navigateToProjects = useCallback(() => {
    router.push("/projects");
  }, [router]);

  return (
    <div className="container min-h-screen flex flex-col  items-center justify-center mx-auto p-6 space-y-6 max-w-7xl">
      {/* Welcome Banner */}
      <WelcomeBanner />
      <ChatInput
        homepageMode={true}
        onWorkspaceCreated={handleWorkspaceCreated}
      />

      {/* Quick Actions & Activity Feed */}
      <div className="">
        {/* Quick Actions */}
        <div className=" space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-2">
            <QuickActionCard
              icon={MessageSquare}
              title="Draft A Contract"
              description="Create a dedicated workspace for each client matter or case."
              onClick={handleShowProjectModal}
              color="text-green-600"
              loading={isCreatingQuickChat}
              disabled={isCreatingQuickChat}
            />
            <QuickActionCard
              icon={LucideScanEye}
              title="Review Documents"
              description="Add contracts, pleadings, or evidence to your vault"
              href="/vault"
              color="text-blue-600"
              disabled={isCreatingQuickChat}
            />

            <QuickActionCard
              icon={Scale}
              title="Prepare for A Case"
              description="Automate predefined legal processes with AI"
              href="/workflows"
              color="text-amber-600"
              disabled={isCreatingQuickChat}
            />
            <QuickActionCard
              icon={FileUp}
              title="Upload Files"
              description="Add contracts, pleadings, or evidence to your vault"
              href="/vault"
              color="text-blue-600"
              disabled={isCreatingQuickChat}
            />
            <QuickActionCard
              icon={Zap}
              title="Start A Workflow"
              description="Automate predefined legal processes with AI"
              href="/workflows"
              color="text-amber-600"
              disabled={isCreatingQuickChat}
            />
          </div>
        </div>
      </div>

      <CreateProjectModal
        open={showProjectModal}
        onClose={handleCloseProjectModal}
      />
    </div>
  );
}
