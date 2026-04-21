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
import { Bell, CheckCheck, Clock, X } from 'lucide-react';
import { apiService } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  dismissed: boolean;
  dismissedAt: string | null;
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
  const [history, setHistory] = useState<Notification[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchActive = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get<{ data: Notification[] }>('/api/notifications');
      const data = (res as any).data ?? [];
      setNotifications(data);
      onUnreadCountChange?.(data.length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get<{ data: Notification[] }>('/api/notifications?history=true');
      setHistory((res as any).data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch active when modal opens; fetch history on demand
  useEffect(() => {
    if (open) fetchActive();
  }, [open, fetchActive]);

  useEffect(() => {
    if (open && showHistory) fetchHistory();
  }, [open, showHistory, fetchHistory]);

  // Background poll (active only) every 2 minutes so the badge stays fresh
  useEffect(() => {
    const id = setInterval(fetchActive, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchActive]);

  const markAllRead = async () => {
    await Promise.allSettled(
      notifications.map((n) => apiService.patch(`/api/notifications/${n.id}/read`, {}))
    );
    // Moved to history — clear active list and update badge
    setNotifications([]);
    onUnreadCountChange?.(0);
    if (showHistory) fetchHistory();
  };

  const dismiss = async (id: string, fromHistory = false) => {
    try {
      await apiService.patch(`/api/notifications/${id}/dismiss`, {});
      if (fromHistory) {
        setHistory((prev) => prev.filter((n) => n.id !== id));
      } else {
        setNotifications((prev) => {
          const next = prev.filter((n) => n.id !== id);
          onUnreadCountChange?.(next.length);
          return next;
        });
      }
    } catch {
      // silent
    }
  };

  const handleSwitchToHistory = () => {
    setShowHistory(true);
  };

  const handleSwitchToActive = () => {
    setShowHistory(false);
  };

  const displayed = showHistory ? history : notifications;
  const emptyMessage = showHistory ? 'No notification history' : 'No new notifications';
  const emptyIcon = showHistory ? <Clock className="h-10 w-10 text-gray-200" /> : <Bell className="h-10 w-10 text-gray-200" />;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#0a4b5e]" />
            <DialogTitle>Notifications</DialogTitle>
          </div>
          <DialogDescription>
            {showHistory
              ? 'Previously read notifications.'
              : notifications.length > 0
                ? `You have ${notifications.length} unread notification${notifications.length > 1 ? 's' : ''}.`
                : "You're all caught up."}
          </DialogDescription>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex items-center border-b">
          <button
            onClick={handleSwitchToActive}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              !showHistory
                ? 'border-[#0a4b5e] text-[#0a4b5e]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <Bell className="h-3.5 w-3.5" />
            Inbox
            {notifications.length > 0 && (
              <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            )}
          </button>
          <button
            onClick={handleSwitchToHistory}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              showHistory
                ? 'border-[#0a4b5e] text-[#0a4b5e]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            History
          </button>

          {/* Mark all read — pushed to the right, active tab only */}
          {!showHistory && notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="ml-auto text-xs text-gray-500 h-7 px-2"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List — fixed height shows exactly 3 cards; scrolls for more */}
        <div className="h-[258px] overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">Loading…</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              {emptyIcon}
              <p className="text-sm text-gray-400">{emptyMessage}</p>
            </div>
          ) : (
            displayed.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'h-[80px] border-l-4 rounded-r-lg px-4 py-2 overflow-hidden',
                  TYPE_STYLES[n.type],
                  showHistory ? 'opacity-60' : ''
                )}
              >
                <div className="flex items-start justify-between gap-3 h-full">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className={cn('text-sm font-semibold truncate', TITLE_STYLES[n.type])}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600 truncate">
                      {n.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => dismiss(n.id, showHistory)}
                    className="shrink-0 mt-0.5 text-gray-400 hover:text-gray-700 transition-colors"
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
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
