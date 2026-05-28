'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Listen for forced logout events (e.g., refresh token expired)
  useEffect(() => {
    const handleLogout = () => {
      useAuthStore.getState().logout();
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-body text-sm">Loading Crewora...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
