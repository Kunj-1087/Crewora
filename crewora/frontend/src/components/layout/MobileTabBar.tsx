'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Briefcase, MessageSquare, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { clsx } from 'clsx';

export function MobileTabBar() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const isExplore = pathname === '/' || pathname === '/for-workers' || pathname?.includes('/workers/');
  const isJobs = pathname?.includes('/dashboard') || pathname?.includes('/jobs/');
  const isInbox = pathname === '/inbox';
  const isProfile = pathname?.includes('/profile') && !pathname?.includes('/workers/');

  // Compute Dashboard Href
  const dashboardHref = user
    ? user.role === 'worker'
      ? '/worker/dashboard'
      : '/customer/dashboard'
    : '/login';

  // Compute Profile Href
  const profileHref = user
    ? user.role === 'worker'
      ? '/worker/profile'
      : '/customer/profile'
    : '/login';

  const tabClass = (isActive: boolean) =>
    clsx(
      'flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 text-[10px] font-bold',
      isActive ? 'text-accent-800' : 'text-slate-400 hover:text-slate-600'
    );

  const containerClass = (isActive: boolean) =>
    clsx(
      'flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-200 gap-0.5',
      isActive ? 'bg-accent-100' : 'bg-transparent'
    );

  return (
    <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-0 bg-white border-t border-slate-100 flex items-center justify-around h-16 px-2 z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.03)] select-none shrink-0">
      {/* 1. Explore Tab */}
      <Link href="/" className={tabClass(isExplore)}>
        <div className={containerClass(isExplore)}>
          <Compass size={20} className={clsx('transition-transform duration-200', isExplore && 'stroke-[2.5]')} />
          <span>Explore</span>
        </div>
      </Link>

      {/* 2. Jobs Tab */}
      <Link href={dashboardHref} className={tabClass(isJobs)}>
        <div className={containerClass(isJobs)}>
          <Briefcase size={20} className={clsx('transition-transform duration-200', isJobs && 'stroke-[2.5]')} />
          <span>Jobs</span>
        </div>
      </Link>

{/* Inbox tab temporarily disabled */}
      {/* <Link href="/inbox" className={tabClass(isInbox)}>
        <div className={containerClass(isInbox)}>
          <MessageSquare size={20} className={clsx('transition-transform duration-200', isInbox && 'stroke-[2.5]')} />
          <span>Inbox</span>
        </div>
      </Link> */}

      {/* 4. Profile Tab */}
      <Link href={profileHref} className={tabClass(isProfile)}>
        <div className={containerClass(isProfile)}>
          <User size={20} className={clsx('transition-transform duration-200', isProfile && 'stroke-[2.5]')} />
          <span>Profile</span>
        </div>
      </Link>
    </div>
  );
}
