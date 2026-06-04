'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Define routes that should NOT render the default public Navbar and Footer
  const isDashboardRoute = 
    pathname.startsWith('/customer/dashboard') ||
    pathname.startsWith('/customer/jobs') ||
    pathname.startsWith('/customer/profile') ||
    pathname.startsWith('/worker/dashboard') ||
    pathname.startsWith('/worker/profile') ||
    pathname.startsWith('/admin');

  if (isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
