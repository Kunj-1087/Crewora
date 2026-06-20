'use client';

/**
 * AdminShell — shared chrome for every /admin/* page.
 * Owns the sidebar, top header, route protection guard, and loading state so
 * the individual pages only have to render their own content.
 */

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, HardHat, Briefcase, Search, Bell, Mail,
  LayoutDashboard, Settings, Info, LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export type AdminSection = 'overview' | 'customers' | 'workers' | 'jobs';

interface NavItem {
  key: AdminSection;
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'customers', label: 'Customers', href: '/admin/customers', icon: Users },
  { key: 'workers', label: 'Workers', href: '/admin/workers', icon: HardHat },
  { key: 'jobs', label: 'Jobs', href: '/admin/jobs', icon: Briefcase },
];

interface AdminShellProps {
  active: AdminSection;
  children: React.ReactNode;
}

export default function AdminShell({ active, children }: AdminShellProps) {
  const router = useRouter();
  const { user, isInitialized, logout } = useAuthStore();

  // Route protection — only admins may stay here.
  useEffect(() => {
    if (isInitialized && (!user || user.role !== 'admin')) {
      router.replace('/admin');
    }
  }, [user, isInitialized, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Avoid flashing protected UI before the auth guard resolves.
  if (!isInitialized || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">

      {/* ─── Sidebar Navigation ────────────────────────────────────────────── */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 relative z-20">
        <div className="flex flex-col flex-1 p-5 space-y-8 text-left select-none">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-base">C</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-none">Crewora</h2>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Marketplace Manager</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 pt-4">
            {NAV_ITEMS.map(({ key, label, href, icon: Icon }) => {
              const isActive = key === active;
              return (
                <Link
                  key={key}
                  href={href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-xs transition-all text-left ${
                    isActive
                      ? 'bg-blue-600 text-white font-extrabold'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </Link>
              );
            })}
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition-all text-left border-none outline-none bg-transparent cursor-pointer">
              <Settings size={14} />
              <span>Settings</span>
            </button>
          </nav>

          {/* Support Info */}
          <div className="pt-2 text-left">
            <Link href="#" className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">
              <Info size={14} />
              <span>Support</span>
            </Link>
          </div>

        </div>

        {/* Footer Logout */}
        <div className="p-5 border-t border-slate-800 select-none">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-rose-950/20 text-rose-450 hover:text-rose-300 font-bold text-xs transition-all text-left border-none outline-none bg-transparent cursor-pointer"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Panel Content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-10 select-none">
          {/* Search bar */}
          <div className="relative w-72 flex items-center">
            <span className="absolute left-3 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search workers, jobs or customers..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs pl-9 pr-3 py-2 rounded-lg outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>

          {/* Controls & Profile */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border-none outline-none cursor-pointer">
              <Bell size={16} />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border-none outline-none cursor-pointer">
              <Mail size={16} />
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <div className="flex items-center gap-2">
              <div className="text-right text-slate-700">
                <span className="block text-xs font-extrabold text-slate-800">{user.name}</span>
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">System Administrator</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-black text-xs uppercase">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
