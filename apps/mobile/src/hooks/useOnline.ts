'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks network connectivity via the browser online/offline events.
 * Works inside the Capacitor WebView without an extra native plugin.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Initialize from the real value once mounted (avoids SSR mismatch).
    setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);

    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
