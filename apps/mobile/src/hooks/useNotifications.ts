'use client';

import { useNotificationStore } from '@/store/useNotificationStore';

/** Notifications data + actions, delegating to the notification store. */
export function useNotifications() {
  const notifications = useNotificationStore((s) => s.notifications);
  const loading = useNotificationStore((s) => s.loading);
  const error = useNotificationStore((s) => s.error);
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markRead,
    markAllRead,
  };
}
