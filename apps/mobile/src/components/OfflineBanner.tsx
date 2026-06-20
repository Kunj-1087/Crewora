'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnline } from '@/hooks/useOnline';

/**
 * Persistent banner shown while the device is offline. Submit actions across the
 * app independently read `useOnline` to disable themselves (spec §5 Offline).
 */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="flex items-center justify-center gap-2 bg-error px-4 py-1.5 text-center text-xs font-semibold text-white animate-slideDown"
    >
      <WifiOff size={14} aria-hidden="true" />
      No internet connection
    </div>
  );
}
