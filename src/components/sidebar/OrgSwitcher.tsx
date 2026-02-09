"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Building2, ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/store/profile.store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface OrgSwitcherProps {
  collapsed?: boolean;
  isMobile?: boolean;
  onSwitch?: () => void;
}

export default function OrgSwitcher({
  collapsed,
  isMobile,
  onSwitch,
}: OrgSwitcherProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const {
    organizations,
    currentOrgId,
    orgsLoading,
    isSwitching,
    fetchOrganizations,
    switchOrganization,
  } = useOrganization();

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Only render when user has 2+ organizations
  if (orgsLoading || organizations.length < 2) return null;

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrgId) return;

    const success = await switchOrganization(orgId);
    if (success) {
      await updateSession();
      router.refresh();
      onSwitch?.();
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    }
  };

  return (
    <div className={cn("border-b", collapsed ? "p-2" : "px-3 py-2")}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full justify-between gap-2",
              collapsed && "justify-center px-2"
            )}
            disabled={isSwitching}
          >
            {isSwitching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Building2 className="h-4 w-4 shrink-0" />
            )}
            {!collapsed && (
              <>
                <span className="flex-1 truncate text-left text-xs">
                  {currentOrg?.name || "Organization"}
                </span>
                <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-1"
          side={isMobile ? "bottom" : "right"}
          align="start"
        >
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Switch Organization
            </p>
          </div>
          <div className="flex flex-col">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                disabled={isSwitching}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors w-full text-left",
                  org.id === currentOrgId && "bg-accent"
                )}
              >
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {org.role}
                  </p>
                </div>
                {org.id === currentOrgId && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
