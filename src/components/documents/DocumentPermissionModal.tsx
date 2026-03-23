// components/documents/DocumentPermissionModal.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Check, Globe, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';

type Visibility = 'private' | 'organization' | 'restricted';

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DocumentPermissionModalProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  onUpdated?: () => void;
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
          <div className="h-5 w-5 rounded border-2 border-muted shrink-0" />
        </div>
      ))}
    </>
  );
}

const EVERYONE_ID = '__everyone__';

export function DocumentPermissionModal({
  open,
  onClose,
  documentId,
  documentTitle,
  onUpdated,
}: DocumentPermissionModalProps) {
  const { notify } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  // IDs currently selected (not including the owner who is always selected)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [everyoneSelected, setEveryoneSelected] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setSearch('');
    try {
      const res = await apiService.get(`/api/documents/${documentId}/permissions`) as any;
      // API returns { status, message, data: { ... } } — unwrap the nested data
      const data = res.data?.data ?? res.data;

      setIsOwner(data?.isOwner ?? false);
      setCurrentUserId(data?.currentUserId ?? '');

      const members: OrgMember[] = data?.orgMembers ?? [];
      setOrgMembers(members);

      const vis: Visibility = data?.visibility ?? 'private';

      if (vis === 'organization') {
        setEveryoneSelected(true);
        setSelectedIds(new Set(members.map((m: OrgMember) => m.id)));
      } else {
        setEveryoneSelected(false);
        const permitted: string[] = (data?.permittedUsers ?? [])
          .map((p: any) => p.id)
          .filter((id: string) => id !== data?.currentUserId); // owner already implicit
        setSelectedIds(new Set(permitted));
      }
    } catch {
      notify.error('Failed to load sharing settings');
    } finally {
      setLoading(false);
    }
  }, [open, documentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggle = (id: string) => {
    if (!isOwner) return;
    if (id === currentUserId) return; // owner always selected

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
      let visibility: Visibility;
      let userIds: string[];

      if (everyoneSelected || (orgMembers.length > 0 && orgMembers.every((m) => selectedIds.has(m.id)))) {
        visibility = 'organization';
        userIds = [];
      } else if (selectedIds.size === 0) {
        visibility = 'private';
        userIds = [];
      } else {
        visibility = 'restricted';
        userIds = Array.from(selectedIds);
      }

      await apiService.put(`/api/documents/${documentId}/permissions`, {
        visibility,
        userIds,
      });
      notify.success('Sharing updated');
      onUpdated?.();
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
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b">
          <DialogTitle className="text-sm font-semibold text-muted-foreground truncate">
            Share document
          </DialogTitle>
          <p className="text-base font-semibold truncate leading-snug mt-0.5">
            {documentTitle}
          </p>
        </DialogHeader>

        {/* Search — always visible, disabled while loading */}
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
        <div className="max-h-72 overflow-y-auto divide-y">
          {loading ? (
            <SkeletonRows />
          ) : (
            <>
              {/* Everyone row */}
              {showEveryone && (
                <button
                  type="button"
                  disabled={!isOwner}
                  onClick={() => toggle(EVERYONE_ID)}
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
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                      everyoneSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {everyoneSelected && <Check className="h-3 w-3" />}
                  </div>
                </button>
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
                return (
                  <button
                    key={member.id}
                    type="button"
                    disabled={!isOwner || isOwnerRow}
                    onClick={() => toggle(member.id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      isOwner && !isOwnerRow ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default',
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
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                        isChecked
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {isChecked && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        <DialogFooter className="px-4 py-3 border-t bg-muted/30">
          {!loading && !isOwner && (
            <p className="text-xs text-muted-foreground mr-auto">
              Only the document owner can manage sharing.
            </p>
          )}
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          {!loading && isOwner && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
