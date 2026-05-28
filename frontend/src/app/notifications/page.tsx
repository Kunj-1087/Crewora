'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, ArrowLeft, CheckCircle2, MessageSquare, Briefcase, 
  Calendar, Info, Check, AlertCircle, RefreshCw 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api/client';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/notifications');
      setNotifications(data.data.notifications || []);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err?.response?.data?.message || 'Failed to load notifications history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && user) {
      fetchNotifications();
    } else if (isInitialized && !user) {
      setLoading(false);
    }
  }, [user, isInitialized]);

  const handleMarkAsRead = async (id: string, link: string | null) => {
    try {
      // Find the notification locally to see if it's already read
      const notif = notifications.find(n => n.id === id);
      if (notif && !notif.isRead) {
        // Optimistic update
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        // Call API in background
        await apiClient.patch(`/notifications/${id}/read`);
      }
      
      // Navigate to the linked target if present
      if (link) {
        router.push(link);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert optimistic update
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    if (notifications.filter(n => !n.isRead).length === 0) return;
    
    setActionLoading(true);
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      
      await apiClient.patch('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      fetchNotifications();
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('message') || t.includes('chat') || t.includes('sent you')) {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
          <MessageSquare size={16} />
        </div>
      );
    }
    if (t.includes('job') || t.includes('post') || t.includes('request')) {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-[#10b981] shrink-0">
          <Briefcase size={16} />
        </div>
      );
    }
    if (t.includes('match') || t.includes('accept') || t.includes('assign') || t.includes('confirm')) {
      return (
        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 shrink-0">
          <CheckCircle2 size={16} />
        </div>
      );
    }
    if (t.includes('schedule') || t.includes('date') || t.includes('time')) {
      return (
        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
          <Calendar size={16} />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
        <Bell size={16} />
      </div>
    );
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Wait for store initialization
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <RefreshCw size={24} className="text-slate-400 animate-spin" />
      </div>
    );
  }

  // Not logged in view
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <header className="sticky top-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center shadow-sm">
          <button onClick={() => router.push('/')} className="mr-3 text-slate-600 hover:text-slate-800">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-extrabold text-[#0b1528]">Notifications</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-4 animate-bounce">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-base font-bold text-slate-800">Authentication Required</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-normal">
            Please log in to your account to view your persistent alerts and message notifications history.
          </p>
          <Link href="/login" className="mt-5">
            <button className="bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-sm transition-all active:scale-95">
              Sign In to Your Account
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col select-none pb-12">
      {/* Premium Sticky Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="text-slate-600 hover:text-slate-800 p-1 rounded-full hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={20} className="stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-base font-black text-[#0b1528] tracking-tight">Notifications</h1>
          </div>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || actionLoading}
            className={`text-xs font-extrabold flex items-center gap-1 transition-all ${
              unreadCount > 0 
                ? 'text-[#10b981] hover:text-[#059669] active:scale-95' 
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Check size={14} className="stroke-[2.5]" />
            <span>Read All</span>
          </button>
        )}
      </header>

      {/* Main Listing View */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-2 bg-slate-100 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center text-red-700">
            <AlertCircle size={32} className="mx-auto mb-2 text-red-500" />
            <h3 className="text-sm font-bold">Failed to Load</h3>
            <p className="text-xs text-red-500 mt-1">{error}</p>
            <button 
              onClick={fetchNotifications}
              className="mt-4 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-4 py-2 border border-slate-200 rounded-xl"
            >
              Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-100 px-6 mt-2 shadow-sm">
            <div className="relative w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-[#10b981] mx-auto mb-4">
              <div className="absolute inset-0 bg-[#10b981]/10 rounded-full animate-ping"></div>
              <Bell size={28} className="relative" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">All caught up!</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-normal">
              You do not have any new messages or system alerts at this moment.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item.id, item.link)}
                className={`bg-white rounded-2xl p-4 border transition-all duration-150 flex gap-3 cursor-pointer shadow-sm relative group ${
                  item.isRead 
                    ? 'border-slate-100 opacity-90 hover:opacity-100' 
                    : 'border-emerald-100 bg-[#f0fdf4]/30 hover:bg-[#f0fdf4]/50'
                }`}
              >
                {/* Visual Unread Dot indicator */}
                {!item.isRead && (
                  <span className="absolute top-4 right-4 w-2 h-2 bg-[#10b981] rounded-full shadow-sm"></span>
                )}

                {/* Categorized icon container */}
                {getNotificationIcon(item.title)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between pr-4">
                    <h4 className={`text-xs font-extrabold text-[#0b1528] tracking-tight group-hover:text-blue-600 transition-colors ${
                      !item.isRead ? 'font-black' : 'font-extrabold'
                    }`}>
                      {item.title}
                    </h4>
                  </div>
                  
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed pr-2">
                    {item.body}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                    
                    {item.link && (
                      <span className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-wider flex items-center gap-0.5">
                        View Details
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
