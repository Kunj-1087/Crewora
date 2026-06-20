'use client';

import { useEffect, useState } from 'react';

/**
 * Reflects the user's system-level "reduce motion" preference (spec §7).
 * CSS already short-circuits animations via a media query; use this hook when a
 * component needs to skip JS-driven motion as well.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
