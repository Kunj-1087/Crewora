'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Briefcase, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/theme';

export function MobileTabBar() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const isExplore =
    pathname === '/' ||
    pathname === '/for-workers' ||
    !!pathname?.includes('/workers/');
  const isJobs =
    !!pathname?.includes('/dashboard') || !!pathname?.includes('/jobs/');
  const isProfile =
    !!pathname?.includes('/profile') && !pathname?.includes('/workers/');

  // Dashboard / profile targets depend on role (unchanged routing).
  const dashboardHref = user
    ? user.role === 'worker'
      ? '/worker/dashboard'
      : '/customer/dashboard'
    : '/login';

  const profileHref = user
    ? user.role === 'worker'
      ? '/worker/profile'
      : '/customer/profile'
    : '/login';

  const tabs = [
    { href: '/', label: 'Explore', Icon: Compass, active: isExplore },
    { href: dashboardHref, label: 'Jobs', Icon: Briefcase, active: isJobs },
    { href: profileHref, label: 'Profile', Icon: User, active: isProfile },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 shrink-0 select-none items-center justify-around border-t border-slate-100 bg-white px-2 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.04)] md:absolute md:bottom-0"
    >
      {tabs.map(({ href, label, Icon, active }) => (
        <Link
          key={label}
          href={href}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex h-full min-w-[64px] flex-1 flex-col items-center justify-center text-[10px] font-bold transition-colors',
            active ? 'text-accent-700' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          <span
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 rounded-full px-4 py-1.5 transition-all duration-200',
              'active:scale-90 motion-reduce:active:scale-100',
              active ? 'bg-accent-50' : 'bg-transparent'
            )}
          >
            <Icon
              size={20}
              className={cn('transition-transform duration-200', active && 'stroke-[2.5]')}
              aria-hidden="true"
            />
            <span>{label}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
