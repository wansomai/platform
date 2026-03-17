// components/documents/FolderPermissionModal.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Globe, Lock, Search, X, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface FolderPermissionModalProps {
  open: boolean;
  onClose: () => void;
  folderId: string;
  folderName: string;
}

export function FolderPermissionModal({
  open,
  onClose,
  folderId,
  folderName,
}: FolderPermissionModalProps) {
  const { notify } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Server tells us authoritatively whether this user is the creator
  const [isCreator, setIsCreator] = useState(false);
  // Server also tells us the current user's ID (for "(you)" labels)
  const [currentUserId, setCurrentUserId] = useState('');

  const [visibility, setVisibility] = useState<'organization' | 'restricted'>('organization');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const res = await apiService.get(`/api/folders/${folderId}/permissions`) as any;
      const data = res.data;

      // isCreator comes from the server — no race condition with profile loading
      setIsCreator(data?.isCreator ?? false);
      setCurrentUserId(data?.currentUserId ?? '');
      setVisibility(data?.visibility ?? 'organization');
      setSelectedUserIds(data?.permittedUsers?.map((u: any) => u.id) ?? []);
      setOrgMembers(data?.orgMembers ?? []);
    } catch {
      notify.error('Failed to load folder permissions');
    } finally {
      setLoading(false);
    }
  // Only re-run when the modal opens or the target folder changes
  }, [open, folderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleUser = (uid: string) => {
    if (uid === currentUserId) return; // creator always stays in the list
    setSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.put(`/api/folders/${folderId}/permissions`, {
        visibility,
        userIds: visibility === 'restricted' ? selectedUserIds : [],
      });
      notify.success('Folder permissions updated');
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to update permissions';
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = orgMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Folder Permissions</DialogTitle>
          <DialogDescription>
            Control who can access <span className="font-medium">{folderName}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isCreator ? (
          /* ── Read-only view for non-creators ── */
          <div className="space-y-3">
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg border-2 p-4',
                visibility === 'organization'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted'
              )}
            >
              {visibility === 'organization' ? (
                <Globe className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {visibility === 'organization'
                    ? 'Organization — everyone can see this folder'
                    : 'Restricted — limited access'}
                </p>
                {visibility === 'restricted' && selectedUserIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Accessible to {selectedUserIds.length} member
                    {selectedUserIds.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Only the folder creator can modify permissions.
            </p>
          </div>
        ) : (
          /* ── Editable view for the creator ── */
          <div className="space-y-4">
            {/* Visibility toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('organization')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm transition-colors',
                  visibility === 'organization'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-muted hover:border-muted-foreground/40'
                )}
              >
                <Globe className="h-6 w-6" />
                <span className="font-medium">Organization</span>
                <span className="text-xs text-muted-foreground text-center">
                  Everyone in the org can see this folder
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('restricted')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm transition-colors',
                  visibility === 'restricted'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-muted hover:border-muted-foreground/40'
                )}
              >
                <Lock className="h-6 w-6" />
                <span className="font-medium">Restricted</span>
                <span className="text-xs text-muted-foreground text-center">
                  Only selected members can access
                </span>
              </button>
            </div>

            {/* User selector — only shown in restricted mode */}
            {visibility === 'restricted' && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Select permitted members</p>

                {/* Selected user chips */}
                {selectedUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedUserIds.map((uid) => {
                      const member = orgMembers.find((m) => m.id === uid);
                      if (!member) return null;
                      const isSelf = uid === currentUserId;
                      return (
                        <Badge
                          key={uid}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                        >
                          {member.name}
                          {isSelf && (
                            <span className="text-xs opacity-60 ml-0.5">(you)</span>
                          )}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => toggleUser(uid)}
                              className="ml-1 rounded-full hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
                  {filteredMembers.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No members found
                    </p>
                  )}
                  {filteredMembers.map((member) => {
                    const isSelected = selectedUserIds.includes(member.id);
                    const isSelf = member.id === currentUserId;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        disabled={isSelf}
                        onClick={() => toggleUser(member.id)}
                        className={cn(
                          'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50',
                          isSelf && 'opacity-60 cursor-not-allowed'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/40'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">
                            {member.name}
                            {isSelf && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {member.email}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs capitalize"
                        >
                          {member.role}
                        </Badge>
                      </button>
                    );
                  })}
                </div>

                {selectedUserIds.filter((id) => id !== currentUserId).length === 0 && (
                  <p className="text-xs text-amber-600">
                    No other members selected — only you will see this folder.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {isCreator ? 'Cancel' : 'Close'}
          </Button>
          {isCreator && (
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save permissions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
