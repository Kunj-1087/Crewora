/**
 * Notification store — Zustand.
 *
 * Mirrors the existing /notifications endpoints. mark-read actions are optimistic
 * (update locally first, revert on failure) — matching the behaviour the
 * notifications screen previously implemented inline.
 */

import { create } from 'zustand';
import apiClient from '@crewora/api-client';
import { normalizeError, type NormalizedError } from '@/lib/api/errors';
import { logError } from '@/lib/log';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  loading: boolean;
  error: NormalizedError | null;
  unreadCount: () => number;

  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,

  unreadCount: () => get().notifications.filter((n) => !n.isRead).length,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get('/notifications');
      set({ notifications: data.data.notifications || [], loading: false });
    } catch (err) {
      set({ error: normalizeError(err), loading: false });
    }
  },

  markRead: async (id) => {
    const prev = get().notifications;
    const target = prev.find((n) => n.id === id);
    if (!target || target.isRead) return;

    // optimistic
    set({
      notifications: prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    });
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err) {
      logError(err, 'markRead');
      set({ notifications: prev }); // revert
    }
  },

  markAllRead: async () => {
    const prev = get().notifications;
    if (prev.every((n) => n.isRead)) return;

    set({ notifications: prev.map((n) => ({ ...n, isRead: true })) });
    try {
      await apiClient.patch('/notifications/read-all');
    } catch (err) {
      logError(err, 'markAllRead');
      set({ notifications: prev }); // revert
    }
  },
}));
