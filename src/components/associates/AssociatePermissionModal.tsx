// components/associates/AssociatePermissionModal.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Loader2, FileText, Users } from 'lucide-react';
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

interface AssociatePermissionModalProps {
  open: boolean;
  onClose: () => void;
  associateId: string;
  associateName: string;
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
          <div className="h-4 w-4 rounded bg-muted shrink-0" />
        </div>
      ))}
    </>
  );
}

export function AssociatePermissionModal({
  open,
  onClose,
  associateId,
  associateName,
  onUpdated,
}: AssociatePermissionModalProps) {
  const { notify } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [kbDocumentCount, setKbDocumentCount] = useState(0);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setSearch('');
    try {
      const res = (await apiService.get(
        `/api/associates/${associateId}/permissions`
      )) as any;
      const data = res.data?.data ?? res.data;

      setIsOwner(data?.isOwner ?? false);
      setCurrentUserId(data?.currentUserId ?? '');
      setKbDocumentCount(data?.kbDocumentCount ?? 0);

      const members: OrgMember[] = data?.orgMembers ?? [];
      setOrgMembers(members);

      const shared: string[] = (data?.sharedUserIds ?? []).filter(
        (id: string) => id !== data?.currentUserId
      );
      setSelectedIds(new Set(shared));
    } catch {
      notify.error('Failed to load sharing settings');
    } finally {
      setLoading(false);
    }
  }, [open, associateId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggle = (id: string) => {
    if (!isOwner) return;
    if (id === currentUserId) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.put(`/api/associates/${associateId}/permissions`, {
        userIds: Array.from(selectedIds),
      });
      const count = selectedIds.size;
      notify.success(
        count === 0
          ? 'Associate is now private'
          : `Shared with ${count} ${count === 1 ? 'person' : 'people'}`
      );
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm p-0 gap-0 flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b">
          <DialogTitle className="text-sm font-semibold text-muted-foreground truncate">
            Share AI Associate
          </DialogTitle>
          <p className="text-base font-semibold truncate leading-snug mt-0.5">
            {associateName}
          </p>
          <p className="text-xs text-muted-foreground leading-snug mt-1.5 flex items-start gap-1.5">
            <Users className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Associates are private by default. People you add will get
              {kbDocumentCount > 0 ? (
                <>
                  {' '}access to this associate and to its{' '}
                  <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                    <FileText className="h-3 w-3" />
                    {kbDocumentCount}
                  </span>{' '}
                  knowledge base document{kbDocumentCount === 1 ? '' : 's'}.
                </>
              ) : (
                <> access to this associate.</>
              )}
            </span>
          </p>
        </DialogHeader>

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

        <div className="flex-1 min-h-[6rem] overflow-y-auto divide-y">
          {loading ? (
            <SkeletonRows />
          ) : (
            <>
              {filtered.length === 0 && (
                <p className="px-4 py-4 text-sm text-center text-muted-foreground">
                  {search ? 'No people found' : 'No other team members yet'}
                </p>
              )}

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
                    onKeyDown={(e) => {
                      if (canToggle && (e.key === 'Enter' || e.key === ' ')) toggle(member.id);
                    }}
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
                          <span className="ml-1.5 text-xs font-normal text-primary">
                            Owner
                          </span>
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
              Only the associate owner can manage sharing.
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
