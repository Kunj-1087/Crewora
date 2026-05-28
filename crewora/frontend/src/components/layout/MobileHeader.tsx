'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, User, HardHat, ShieldCheck, Menu, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMenuStore } from '@/store/menuStore';

export function MobileHeader() {
  const { user } = useAuthStore();
  const router = useRouter();
  const openMenu = useMenuStore((state) => state.openMenu);

  const handleProfileClick = () => {
    if (!user) {
      router.push('/login');
    } else {
      router.push(user.role === 'worker' ? '/worker/profile' : '/customer/profile');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between shadow-sm select-none shrink-0">
      {/* Left: Hamburger menu and Logo */}
      <div className="flex items-center gap-3">
        <button 
          onClick={openMenu}
          className="text-slate-800 hover:text-navy p-1 transition-colors"
        >
          <Menu size={20} className="stroke-[2.5]" />
        </button>
        <Link href="/" className="flex items-center tracking-tight text-[21px] font-sans">
          <span className="font-black text-slate-900">crew</span>
          <span className="font-black text-blue-600">ora</span>
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search icon triggers filter or highlights search bar */}
        <button className="w-9 h-9 hover:bg-slate-50 text-slate-800 rounded-full flex items-center justify-center transition-colors">
          <Search size={18} className="stroke-[2.5]" />
        </button>

        {user ? (
          <>
            {/* Notification Bell */}
            <button className="w-9 h-9 hover:bg-slate-50 text-slate-800 rounded-full flex items-center justify-center transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border border-white"></span>
            </button>

            {/* User Avatar Action */}
            <button
              onClick={handleProfileClick}
              className="w-8 h-8 border border-slate-100 bg-slate-50 text-slate-600 hover:border-accent rounded-full flex items-center justify-center transition-all select-none overflow-hidden"
            >
              {user.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={14} />
              )}
            </button>
          </>
        ) : (
          <Link href="/login" className="text-xs font-semibold text-accent-700 hover:bg-accent-50 px-3 py-1.5 rounded-lg transition-colors">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
