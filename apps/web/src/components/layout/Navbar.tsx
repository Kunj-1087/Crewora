'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@crewora/ui';
import { clsx } from 'clsx';
import { AppDownloadButton } from '@/components/app-download/AppDownloadButton';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const dashboardHref = user?.role === 'worker' ? '/worker/dashboard' : '/customer/dashboard';

  return (
    <nav className="bg-white border-b border-gray-border sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold text-navy group-hover:text-primary-500 transition-colors">
              Crewora
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/for-workers"
              className="text-gray-body hover:text-primary-500 font-medium transition-colors"
            >
              For Workers
            </Link>
            <Link
              href="/workers"
              className="text-gray-body hover:text-primary-500 font-medium transition-colors"
            >
              Find Workers
            </Link>

            <AppDownloadButton variant="secondary" size="sm" source="navbar" />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User size={16} className="text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-navy">{user.name}</span>
                  <ChevronDown size={14} className={clsx(
                    'text-gray-body transition-transform',
                    userMenuOpen && 'rotate-180'
                  )} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-border py-1 animate-fadeIn">
                    <Link
                      href={dashboardHref}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-navy hover:bg-primary-50 transition-colors"
                    >
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <Link
                      href={user.role === 'worker' ? '/worker/profile' : '/customer/profile'}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-navy hover:bg-primary-50 transition-colors"
                    >
                      <User size={15} /> Profile
                    </Link>
                    <hr className="my-1 border-gray-border" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error-light w-full transition-colors"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/customer/register">
                  <Button variant="primary" size="sm">Post a Job</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-primary-50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-border bg-white animate-fadeIn">
          <div className="px-4 py-4 space-y-2">
            <Link href="/for-workers" className="block py-2.5 text-gray-body hover:text-primary-500 font-medium" onClick={() => setMobileOpen(false)}>
              For Workers
            </Link>
            <Link href="/workers" className="block py-2.5 text-gray-body hover:text-primary-500 font-medium" onClick={() => setMobileOpen(false)}>
              Find Workers
            </Link>

            <div className="py-2">
              <AppDownloadButton variant="secondary" size="sm" source="navbar" fullWidth />
            </div>

            {user ? (
              <>
                <Link href={dashboardHref} className="block py-2.5 text-navy font-medium" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block py-2.5 text-error font-medium w-full text-left">
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" fullWidth>Sign In</Button>
                </Link>
                <Link href="/customer/register" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" fullWidth>Post a Job</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
