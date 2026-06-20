'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Briefcase,
  Calendar,
  Check,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationItem } from '@/store/useNotificationStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { timeAgo } from '@/lib/format';
import { cn } from '@/theme';

function iconFor(title: string): { Icon: LucideIcon; tint: string } {
  const t = title.toLowerCase();
  if (t.includes('message') || t.includes('chat') || t.includes('sent you'))
    return { Icon: MessageSquare, tint: 'bg-accent-50 text-accent-600' };
  if (t.includes('job') || t.includes('post') || t.includes('request'))
    return { Icon: Briefcase, tint: 'bg-success-light text-success' };
  if (
    t.includes('match') ||
    t.includes('accept') ||
    t.includes('assign') ||
    t.includes('confirm')
  )
    return { Icon: CheckCircle2, tint: 'bg-teal-50 text-teal-600' };
  if (t.includes('schedule') || t.includes('date') || t.includes('time'))
    return { Icon: Calendar, tint: 'bg-indigo-50 text-indigo-600' };
  return { Icon: Bell, tint: 'bg-slate-100 text-slate-500' };
}

type Group = 'Today' | 'Yesterday' | 'Earlier';

function groupOf(createdAt: string): Group {
  const then = new Date(createdAt);
  const now = new Date();
  const dayMs = 86_400_000;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = then.getTime();
  if (t >= startToday) return 'Today';
  if (t >= startToday - dayMs) return 'Yesterday';
  return 'Earlier';
}

export default function NotificationsPage() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotifications();

  useEffect(() => {
    if (isInitialized && user) fetchNotifications();
  }, [isInitialized, user, fetchNotifications]);

  const grouped = useMemo(() => {
    const order: Group[] = ['Today', 'Yesterday', 'Earlier'];
    const buckets: Record<Group, NotificationItem[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };
    for (const n of notifications) buckets[groupOf(n.createdAt)].push(n);
    return order
      .map((label) => ({ label, items: buckets[label] }))
      .filter((g) => g.items.length > 0);
  }, [notifications]);

  const onItemClick = async (item: NotificationItem) => {
    await markRead(item.id);
    if (item.link) router.push(item.link);
  };

  const Header = (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="-ml-1 rounded-full p-1.5 text-slate-600 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-navy">Notifications</h1>
      </div>
      {notifications.length > 0 && (
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className={cn(
            'flex items-center gap-1 text-xs font-bold transition-colors',
            unreadCount > 0
              ? 'text-accent-700 hover:underline'
              : 'cursor-not-allowed text-gray-caption'
          )}
        >
          <Check size={14} />
          Mark all read
        </button>
      )}
    </header>
  );

  if (!isInitialized) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-100 border-t-accent-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col">
        {Header}
        <EmptyState
          icon={AlertCircle}
          title="Sign in required"
          description="Please sign in to view your notifications."
          action={{ label: 'Sign In', onClick: () => router.push('/login') }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {Header}

      <div className="flex-1 p-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((n) => (
              <div
                key={n}
                className="flex items-start gap-3 rounded-2xl border border-gray-border bg-white p-4"
              >
                <Skeleton shape="circle" width={32} height={32} />
                <div className="flex-1 space-y-2">
                  <Skeleton width="40%" />
                  <Skeleton width="85%" />
                  <Skeleton width="25%" height={10} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Failed to load"
            description={error.message}
            action={{ label: 'Try Again', onClick: fetchNotifications }}
          />
        ) : notifications.length === 0 ? (
          <EmptyState preset="no-notifications" />
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <section key={group.label} className="space-y-2.5">
                <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-gray-caption">
                  {group.label}
                </h2>
                {group.items.map((item) => {
                  const { Icon, tint } = iconFor(item.title);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onItemClick(item)}
                      className={cn(
                        'flex w-full gap-3 rounded-2xl border bg-white p-4 text-left transition-colors',
                        'active:scale-[0.99] motion-reduce:active:scale-100',
                        item.isRead
                          ? 'border-gray-border'
                          : 'border-l-4 border-l-accent-600 border-gray-border bg-accent-50/30'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          tint
                        )}
                      >
                        <Icon size={16} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={cn(
                              'text-sm text-navy',
                              item.isRead ? 'font-semibold' : 'font-bold'
                            )}
                          >
                            {item.title}
                          </h3>
                          {!item.isRead && (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-600"
                              aria-label="Unread"
                            />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-body">
                          {item.body}
                        </p>
                        <span className="mt-2 block text-[11px] text-gray-caption">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
