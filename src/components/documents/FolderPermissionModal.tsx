// components/documents/FolderPermissionModal.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Globe, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary select-none">
      {initials}
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
          <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-muted rounded w-28" />
            <div className="h-3 bg-muted rounded w-44" />
          </div>
          <div className="h-4 w-4 rounded bg-muted shrink-0" />
        </div>
      ))}
    </>
  );
}

const EVERYONE_ID = '__everyone__';

export function FolderPermissionModal({
  open,
  onClose,
  folderId,
  folderName,
}: FolderPermissionModalProps) {
  const { notify } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [everyoneSelected, setEveryoneSelected] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setSearch('');
    try {
      const res = await apiService.get(`/api/folders/${folderId}/permissions`) as any;
      const data = res.data?.data ?? res.data;

      setIsOwner(data?.isCreator ?? false);
      setCurrentUserId(data?.currentUserId ?? '');

      const members: OrgMember[] = data?.orgMembers ?? [];
      setOrgMembers(members);

      const vis: string = data?.visibility ?? 'restricted';

      if (vis === 'organization') {
        setEveryoneSelected(true);
        setSelectedIds(new Set(members.map((m: OrgMember) => m.id)));
      } else {
        setEveryoneSelected(false);
        const permitted: string[] = (data?.permittedUsers ?? [])
          .map((p: any) => p.id)
          .filter((id: string) => id !== data?.currentUserId);
        setSelectedIds(new Set(permitted));
      }
    } catch {
      notify.error('Failed to load sharing settings');
    } finally {
      setLoading(false);
    }
  }, [open, folderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggle = (id: string) => {
    if (!isOwner) return;
    if (id === currentUserId) return;

    if (id === EVERYONE_ID) {
      if (everyoneSelected) {
        setEveryoneSelected(false);
        setSelectedIds(new Set());
      } else {
        setEveryoneSelected(true);
        setSelectedIds(new Set(orgMembers.map((m) => m.id)));
      }
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      const allSelected = orgMembers.every((m) => next.has(m.id));
      setEveryoneSelected(allSelected);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let visibility: string;
      let userIds: string[];

      if (everyoneSelected || (orgMembers.length > 0 && orgMembers.every((m) => selectedIds.has(m.id)))) {
        visibility = 'organization';
        userIds = [];
      } else {
        visibility = 'restricted';
        userIds = Array.from(selectedIds);
      }

      await apiService.put(`/api/folders/${folderId}/permissions`, { visibility, userIds });
      notify.success('Folder sharing updated');
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to update sharing';
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const filtered = search
    ? orgMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase())
      )
    : orgMembers;

  const showEveryone = !search;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm p-0 gap-0 flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b">
          <DialogTitle className="text-sm font-semibold text-muted-foreground truncate">
            Share folder
          </DialogTitle>
          <p className="text-base font-semibold truncate leading-snug mt-0.5">
            {folderName}
          </p>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people…"
              className="pl-8 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus={!loading}
              disabled={loading || !isOwner}
            />
          </div>
        </div>

        {/* Member list */}
        <div className="flex-1 min-h-[6rem] overflow-y-auto divide-y">
          {loading ? (
            <SkeletonRows />
          ) : (
            <>
              {/* Everyone row */}
              {showEveryone && (
                <div
                  role={isOwner ? 'button' : undefined}
                  tabIndex={isOwner ? 0 : undefined}
                  onClick={() => isOwner && toggle(EVERYONE_ID)}
                  onKeyDown={(e) => { if (isOwner && (e.key === 'Enter' || e.key === ' ')) toggle(EVERYONE_ID); }}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                    isOwner ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default',
                    everyoneSelected && 'bg-primary/5'
                  )}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Everyone in organization</p>
                    <p className="text-xs text-muted-foreground">All current and future members</p>
                  </div>
                  <Checkbox
                    checked={everyoneSelected}
                    disabled={!isOwner}
                    onCheckedChange={() => toggle(EVERYONE_ID)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Share with everyone"
                  />
                </div>
              )}

              {/* No results */}
              {filtered.length === 0 && search && (
                <p className="px-4 py-4 text-sm text-center text-muted-foreground">
                  No people found
                </p>
              )}

              {/* Individual members */}
              {filtered.map((member) => {
                const isOwnerRow = member.id === currentUserId;
                const isChecked = isOwnerRow || selectedIds.has(member.id);
                const canToggle = isOwner && !isOwnerRow;
                return (
                  <div
                    key={member.id}
                    role={canToggle ? 'button' : undefined}
                    tabIndex={canToggle ? 0 : undefined}
                    onClick={() => canToggle && toggle(member.id)}
                    onKeyDown={(e) => { if (canToggle && (e.key === 'Enter' || e.key === ' ')) toggle(member.id); }}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      canToggle ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default',
                      isChecked && !isOwnerRow && 'bg-primary/5'
                    )}
                  >
                    <Avatar name={member.name} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {member.name}
                        {isOwnerRow && (
                          <span className="ml-1.5 text-xs font-normal text-primary">Owner</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <Checkbox
                      checked={isChecked}
                      disabled={!isOwner || isOwnerRow}
                      onCheckedChange={() => canToggle && toggle(member.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Share with ${member.name}`}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 px-4 py-3 border-t bg-muted/30 flex-wrap">
          {!loading && !isOwner && (
            <p className="text-xs text-muted-foreground mr-auto">
              Only the folder owner can manage sharing.
            </p>
          )}
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          {!loading && (
            <Button size="sm" onClick={handleSave} disabled={saving || !isOwner}>
              {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
