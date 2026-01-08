'use client';

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, CheckCircle, XCircle, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { format } from "date-fns";
import type { AdminOrganization } from "@/types/admin";
import { toast } from "sonner";
import { apiService } from "@/lib/api";

interface OrganizationsTableProps {
  organizations: AdminOrganization[];
  isLoading?: boolean;
  onRefresh: () => void;
}

export function OrganizationsTable({
  organizations,
  isLoading,
  onRefresh,
}: OrganizationsTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | 'upgrade' | 'downgrade' | null;
    org: AdminOrganization | null;
  }>({ open: false, type: null, org: null });

  const handleAction = async (
    action: 'approve' | 'reject' | 'upgrade' | 'downgrade',
    org: AdminOrganization
  ) => {
    setActionLoading(org.id);

    try {
      const endpoint = `/api/admin/organizations/${org.id}/${action}`;
      const response = await apiService.post(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response;

      toast.success('your request was successful');
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to perform action');
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, type: null, org: null });
    }
  };

  const openConfirmDialog = (
    type: 'approve' | 'reject' | 'upgrade' | 'downgrade',
    org: AdminOrganization
  ) => {
    setConfirmDialog({ open: true, type, org });
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Account Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-6 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-6 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-8 bg-gray-200 rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                <TableCell className="text-right"><div className="h-8 w-8 bg-gray-200 rounded animate-pulse ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-gray-500">No organizations found</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Account Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{org.name}</div>
                    {org.contactEmail && (
                      <div className="text-xs text-gray-500">{org.contactEmail}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm">{org.owner?.fullName || 'No owner'}</div>
                    <div className="text-xs text-gray-500">{org.owner?.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={org.accountType === 'enterprise' ? 'default' : 'secondary'}>
                    {org.accountType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      org.upgradeStatus === 'pending'
                        ? 'destructive'
                        : org.upgradeStatus === 'approved'
                        ? 'default'
                        : 'outline'
                    }
                  >
                    {org.upgradeStatus}
                  </Badge>
                  {org.upgradeRequestedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      Requested {format(new Date(org.upgradeRequestedAt), 'MMM d, yyyy')}
                    </div>
                  )}
                </TableCell>
                <TableCell>{org.memberCount}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {format(new Date(org.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={actionLoading === org.id}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {org.upgradeStatus === 'pending' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => openConfirmDialog('approve', org)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve Upgrade
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openConfirmDialog('reject', org)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject Upgrade
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {org.accountType === 'personal' && org.upgradeStatus !== 'pending' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => openConfirmDialog('upgrade', org)}
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Manual Upgrade
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {org.accountType === 'enterprise' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => openConfirmDialog('downgrade', org)}
                            className="text-red-600"
                          >
                            <TrendingDown className="mr-2 h-4 w-4" />
                            Downgrade to Personal
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) =>
        !open && setConfirmDialog({ open: false, type: null, org: null })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'approve' && 'Approve Upgrade Request'}
              {confirmDialog.type === 'reject' && 'Reject Upgrade Request'}
              {confirmDialog.type === 'upgrade' && 'Manual Upgrade'}
              {confirmDialog.type === 'downgrade' && 'Downgrade Organization'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'approve' &&
                `Are you sure you want to approve the upgrade request for ${confirmDialog.org?.name}? This will change their account to Enterprise.`}
              {confirmDialog.type === 'reject' &&
                `Are you sure you want to reject the upgrade request for ${confirmDialog.org?.name}?`}
              {confirmDialog.type === 'upgrade' &&
                `Are you sure you want to manually upgrade ${confirmDialog.org?.name} to Enterprise? This bypasses the normal request workflow.`}
              {confirmDialog.type === 'downgrade' &&
                `Are you sure you want to downgrade ${confirmDialog.org?.name} to Personal? This will remove all non-owner members.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.type && confirmDialog.org) {
                  handleAction(confirmDialog.type, confirmDialog.org);
                }
              }}
              className={confirmDialog.type === 'downgrade' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
