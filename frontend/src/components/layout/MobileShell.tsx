'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Wifi, Signal, Battery, X, Compass, Briefcase, MessageSquare, 
  User, Settings, LogOut, ShieldCheck, ChevronRight 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMenuStore } from '@/store/menuStore';

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { isOpen, closeMenu } = useMenuStore();
  const [time, setTime] = useState('09:41');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12; // 12-hour format
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute navigation endpoints
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

  const handleNavigate = (path: string) => {
    closeMenu();
    router.push(path);
  };

  const handleLogout = async () => {
    closeMenu();
    await logout();
    router.push('/login');
  };

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `w-full flex items-center justify-between p-3 rounded-xl transition-all duration-205 border text-left ${
      isActive 
        ? 'bg-blue-50/70 text-[#0b1528] border-blue-100/80 font-black shadow-sm' 
        : 'bg-transparent border-transparent hover:bg-slate-50/80 text-slate-650 hover:text-[#0b1528]'
    } group`;
  };

  const getIconClass = (path: string) => {
    const isActive = pathname === path;
    return `w-[17px] h-[17px] transition-colors ${
      isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-[#0b1528]'
    }`;
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 md:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] md:from-slate-900 md:via-slate-950 md:to-indigo-950 flex items-center justify-center py-0 md:py-8 font-sans antialiased text-navy">
      {/* simulated phone wrapper on desktop, full-screen on mobile */}
      <div className="w-full h-screen md:h-[880px] md:max-w-[420px] md:rounded-[48px] md:border-[10px] md:border-slate-800 md:shadow-[0_0_80px_rgba(0,0,0,0.8),_inset_0_0_2px_rgba(255,255,255,0.2)] md:ring-2 md:ring-slate-700/50 bg-slate-50 flex flex-col overflow-hidden relative transition-all duration-300">
        
        {/* Drawer Backdrop Overlay */}
        <div 
          onClick={closeMenu}
          className={`absolute inset-0 bg-slate-950/45 z-[100] backdrop-blur-[2px] transition-opacity duration-300 ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Drawer Side Panel */}
        <div 
          className={`absolute top-0 left-0 bottom-0 w-[300px] bg-white z-[110] shadow-2xl flex flex-col border-r border-slate-100/80 transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header with Brand Logo & Close Action */}
          <div className="bg-gradient-to-br from-[#0b1528] via-[#122038] to-[#070d19] text-white p-5 pt-[calc(env(safe-area-inset-top,0px)+1.75rem)] pb-6 shrink-0 relative flex flex-col gap-4 border-b border-white/5 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="text-xl font-black tracking-tight font-sans flex items-center gap-1.5 select-none">
                <span className="text-white">
                  crew<span className="text-blue-500">ora</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              </div>
              <button 
                onClick={closeMenu}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            </div>

            {/* User Details Block inside Header */}
            {user ? (
              <div className="flex items-center gap-3.5 mt-2.5 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-blue-500 to-sky-400 shrink-0">
                  <img 
                    src={user.profilePhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300'} 
                    alt={user.name} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#0b1528]"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="text-xs font-black text-white truncate leading-none">{user.name}</h4>
                    <ShieldCheck size={13} className="text-blue-500 fill-blue-500 text-white shrink-0" />
                  </div>
                  <span className="block text-[9px] text-blue-400 font-black uppercase tracking-wider mt-1">{user.role} Account</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3.5 mt-2.5 text-left">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-300 shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-none">Welcome Guest!</h4>
                  <button 
                    onClick={() => { closeMenu(); router.push('/login'); }}
                    className="text-[9px] text-blue-400 font-black uppercase tracking-wider hover:underline text-left mt-1 block"
                  >
                    Sign in to your account
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Body Scrollable Navigation List */}
          <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-2 bg-white select-none">
            <button
              onClick={() => handleNavigate('/')}
              className={getLinkClass('/')}
            >
              <div className="flex items-center gap-3">
                <Compass className={getIconClass('/')} />
                <span className="text-xs">Explore Services</span>
              </div>
              <ChevronRight size={14} className={`transition-colors ${pathname === '/' ? 'text-blue-500' : 'text-slate-355'}`} />
            </button>

            <button
              onClick={() => handleNavigate(dashboardHref)}
              className={getLinkClass(dashboardHref)}
            >
              <div className="flex items-center gap-3">
                <Briefcase className={getIconClass(dashboardHref)} />
                <span className="text-xs">My Active Jobs</span>
              </div>
              <ChevronRight size={14} className={`transition-colors ${pathname === dashboardHref ? 'text-blue-500' : 'text-slate-355'}`} />
            </button>

            <button
              onClick={() => handleNavigate('/inbox')}
              className={getLinkClass('/inbox')}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className={getIconClass('/inbox')} />
                <span className="text-xs">Inbox Messages</span>
              </div>
              <ChevronRight size={14} className={`transition-colors ${pathname === '/inbox' ? 'text-blue-500' : 'text-slate-355'}`} />
            </button>

            <button
              onClick={() => handleNavigate(profileHref)}
              className={getLinkClass(profileHref)}
            >
              <div className="flex items-center gap-3">
                <User className={getIconClass(profileHref)} />
                <span className="text-xs">Manage Profile</span>
              </div>
              <ChevronRight size={14} className={`transition-colors ${pathname === profileHref ? 'text-blue-500' : 'text-slate-355'}`} />
            </button>

            <div className="h-px bg-slate-100 my-3 mx-1" />

            <button
              onClick={() => {
                closeMenu();
                alert('Settings module is configured. The application is running on version 1.0.0.');
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-transparent hover:bg-slate-50 text-slate-650 hover:text-[#0b1528] transition-all group"
            >
              <div className="flex items-center gap-3">
                <Settings size={17} className="text-slate-400 group-hover:text-[#0b1528]" />
                <span className="text-xs font-bold">App Settings</span>
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
            </button>
          </div>

          {/* Drawer Footer LogOut / LogIn action */}
          <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-xl text-xs font-black transition-all active:scale-[0.98]"
              >
                <LogOut size={15} />
                SIGN OUT
              </button>
            ) : (
              <button
                onClick={() => handleNavigate('/login')}
                className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all active:scale-[0.98]"
              >
                SIGN IN
              </button>
            )}
          </div>
        </div>

        {/* Top Status Bar (Hidden on actual mobile screens, shown on desktop wrapper) */}
        <div className="hidden md:flex items-center justify-between h-9 px-6 bg-white border-b border-gray-border/30 text-xs font-semibold text-slate-800 select-none z-50 shrink-0">
          {/* Left: Time */}
          <span className="w-16 text-left">{time}</span>
          
          {/* Center: Dynamic Notch */}
          <div className="w-28 h-4.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-slate-950 rounded-full border border-slate-900 absolute right-4"></div>
            <div className="w-8 h-1 bg-slate-900 rounded-full"></div>
          </div>
          
          {/* Right: Status Icons */}
          <div className="flex items-center gap-1.5 w-16 justify-end">
            <Signal size={12} className="stroke-[2.5]" />
            <Wifi size={12} className="stroke-[2.5]" />
            <Battery size={13} className="stroke-[2.5] fill-slate-800" />
          </div>
        </div>

        {/* Device Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto relative bg-slate-50 scrollbar-none pb-[68px]">
          {children}
        </div>

        {/* Physical Home Indicator bar (Desktop wrapper only) */}
        <div className="hidden md:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-800 rounded-full z-50 select-none pointer-events-none opacity-80"></div>
      </div>
    </div>
  );
}
