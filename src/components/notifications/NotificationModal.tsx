'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, X } from 'lucide-react';
import { apiService } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

interface NotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnreadCountChange?: (count: number) => void;
}

const TYPE_STYLES: Record<Notification['type'], string> = {
  info:    'border-l-blue-400 bg-blue-50',
  warning: 'border-l-amber-400 bg-amber-50',
  success: 'border-l-emerald-400 bg-emerald-50',
  error:   'border-l-red-400 bg-red-50',
};

const TITLE_STYLES: Record<Notification['type'], string> = {
  info:    'text-blue-800',
  warning: 'text-amber-800',
  success: 'text-emerald-800',
  error:   'text-red-800',
};

export default function NotificationModal({
  open,
  onOpenChange,
  onUnreadCountChange,
}: NotificationModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get<{ data: Notification[] }>('/api/notifications');
      const data = (res as any).data ?? [];
      setNotifications(data);
      onUnreadCountChange?.(data.filter((n: Notification) => !n.read).length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  // Fetch when modal opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Background poll every 2 minutes so the badge stays fresh
  useEffect(() => {
    const id = setInterval(fetchNotifications, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await apiService.patch(`/api/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      onUnreadCountChange?.(
        notifications.filter((n) => !n.read && n.id !== id).length
      );
    } catch {
      // silent
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.allSettled(
      unread.map((n) => apiService.patch(`/api/notifications/${n.id}/read`, {}))
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onUnreadCountChange?.(0);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#0a4b5e]" />
            <DialogTitle>Notifications</DialogTitle>
          </div>
          <DialogDescription>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`
              : "You're all caught up."}
          </DialogDescription>
        </DialogHeader>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <div className="flex justify-end -mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="text-xs text-gray-500 h-7 px-2"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all as read
            </Button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center gap-3">
              <Bell className="h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'border-l-4 rounded-r-lg px-4 py-3 transition-opacity',
                  TYPE_STYLES[n.type],
                  n.read ? 'opacity-50' : ''
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-semibold', TITLE_STYLES[n.type])}>
                      {n.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="mt-1.5 text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="shrink-0 mt-0.5 text-gray-400 hover:text-gray-700 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t">
          <Button
            className="w-full bg-[#0a4b5e] hover:bg-[#0a4b5e]/90"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
