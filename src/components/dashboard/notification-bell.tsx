'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Badge } from '@/components/ui';

type NotificationRow = {
  id: string;
  type: 'new_order' | 'new_booking' | 'new_subscriber' | 'new_enrollment' | 'system';
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell({ userId }: { userId: string }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);

  useEffect(() => {
    void loadNotifications();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setItems((prev) => [payload.new as NotificationRow, ...prev]);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  async function loadNotifications() {
    const response = await fetch('/api/notifications');
    const json = await response.json();
    setItems((json.notifications || []) as NotificationRow[]);
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    setItems((prev) => prev.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });

    setItems((prev) => prev.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
  }

  const unreadCount = useMemo(() => items.filter((item) => !item.read_at).length, [items]);

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)} className="relative">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <button className="text-xs text-brand-600 hover:underline" onClick={() => void markAllRead()}>Mark all read</button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  className="w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/70"
                  onClick={() => void markRead(item.id)}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                    {!item.read_at ? <Badge variant="warning">New</Badge> : null}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.message}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
