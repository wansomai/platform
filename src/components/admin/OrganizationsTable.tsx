'use client';

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { MoreVertical, CheckCircle, XCircle, TrendingUp, TrendingDown, Eye, Gift } from "lucide-react";
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

  // Grant access modal state
  const [grantDialog, setGrantDialog] = useState<{ open: boolean; org: AdminOrganization | null }>({
    open: false,
    org: null,
  });
  const [grantValue, setGrantValue] = useState<number>(1);
  const [grantUnit, setGrantUnit] = useState<'months' | 'days'>('months');

  const grantExpiryPreview = useMemo(() => {
    const d = new Date();
    if (grantUnit === 'months') d.setMonth(d.getMonth() + grantValue);
    else d.setDate(d.getDate() + grantValue);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [grantValue, grantUnit]);

  const handleAction = async (
    action: 'approve' | 'reject' | 'upgrade' | 'downgrade',
    org: AdminOrganization
  ) => {
    setActionLoading(org.id);

    try {
      const endpoint = `/api/admin/organizations/${org.id}/${action}`;
      await apiService.post(endpoint, {});
      toast.success('Your request was successful');
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to perform action');
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, type: null, org: null });
    }
  };

  const handleGrantAccess = async () => {
    if (!grantDialog.org) return;
    if (grantValue < 1 || grantValue > 120) {
      toast.error('Duration must be between 1 and 120');
      return;
    }
    setActionLoading(grantDialog.org.id);
    try {
      await apiService.post(`/api/admin/organizations/${grantDialog.org.id}/grant-access`, {
        value: grantValue,
        unit: grantUnit,
      });
      toast.success(`Access granted: ${grantValue} ${grantUnit}`);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to grant access');
    } finally {
      setActionLoading(null);
      setGrantDialog({ open: false, org: null });
      setGrantValue(1);
      setGrantUnit('months');
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
            {organizations.map((org) => {
              const hasActiveGrant =
                !org.grantedExpired &&
                org.grantedExpiresAt != null &&
                new Date(org.grantedExpiresAt) > new Date();

              return (
                <TableRow key={org.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{org.name}</div>
                      {org.contactEmail && (
                        <div className="text-xs text-gray-500">{org.contactEmail}</div>
                      )}
                      {hasActiveGrant && (
                        <div className="text-xs text-blue-600 mt-0.5">
                          Granted {org.grantedDuration} · expires {format(new Date(org.grantedExpiresAt!), 'MMM d, yyyy')}
                        </div>
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
                            <DropdownMenuItem onClick={() => openConfirmDialog('approve', org)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve Upgrade
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openConfirmDialog('reject', org)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject Upgrade
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {org.accountType === 'personal' && org.upgradeStatus !== 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => openConfirmDialog('upgrade', org)}>
                              <TrendingUp className="mr-2 h-4 w-4" />
                              Trial Upgrade (15 days)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem onClick={() => setGrantDialog({ open: true, org })}>
                          <Gift className="mr-2 h-4 w-4" />
                          Grant Access
                        </DropdownMenuItem>
                        {org.accountType === 'enterprise' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openConfirmDialog('downgrade', org)}
                              className="text-red-600"
                            >
                              <TrendingDown className="mr-2 h-4 w-4" />
                              Downgrade to Personal
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Simple confirm dialog for approve / reject / upgrade / downgrade */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) =>
        !open && setConfirmDialog({ open: false, type: null, org: null })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'approve' && 'Approve Upgrade Request'}
              {confirmDialog.type === 'reject' && 'Reject Upgrade Request'}
              {confirmDialog.type === 'upgrade' && 'Trial Upgrade (15 days)'}
              {confirmDialog.type === 'downgrade' && 'Downgrade Organization'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'approve' &&
                `Approve the upgrade request for ${confirmDialog.org?.name}? This will change their account to Enterprise.`}
              {confirmDialog.type === 'reject' &&
                `Reject the upgrade request for ${confirmDialog.org?.name}?`}
              {confirmDialog.type === 'upgrade' &&
                `Grant ${confirmDialog.org?.name} a 15-day Pro trial? This bypasses the normal request workflow.`}
              {confirmDialog.type === 'downgrade' &&
                `Downgrade ${confirmDialog.org?.name} to Personal? This will remove all non-owner members.`}
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

      {/* Grant Access modal */}
      <Dialog
        open={grantDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setGrantDialog({ open: false, org: null });
            setGrantValue(1);
            setGrantUnit('months');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Pro Access</DialogTitle>
            <DialogDescription>
              Grant time-limited Pro access to <strong>{grantDialog.org?.name}</strong>.
              Use this for customers who paid via bank transfer. This is not a trial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Duration</label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={grantValue}
                  onChange={(e) => setGrantValue(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Unit</label>
                <select
                  value={grantUnit}
                  onChange={(e) => setGrantUnit(e.target.value as 'months' | 'days')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="months">Months</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>

            <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Access expires:</span> {grantExpiryPreview}
              </p>
            </div>

            <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-sm text-amber-800">
                The user will receive: <em>&ldquo;You have been granted {grantValue} {grantUnit} access to use Wansom. Enjoy your experience. In case of anything, email the support via the support icon.&rdquo;</em>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrantDialog({ open: false, org: null })}
              disabled={actionLoading === grantDialog.org?.id}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGrantAccess}
              disabled={actionLoading === grantDialog.org?.id}
            >
              {actionLoading === grantDialog.org?.id ? 'Granting…' : `Grant ${grantValue} ${grantUnit}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
