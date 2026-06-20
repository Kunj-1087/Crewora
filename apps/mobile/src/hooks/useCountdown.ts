'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCountdown {
  /** Seconds remaining. */
  seconds: number;
  /** True while the countdown is running. */
  active: boolean;
  /** (Re)start the countdown from `startSeconds`. */
  start: () => void;
}

/**
 * Simple second-based countdown, used for the OTP "Resend" timer.
 * Does not auto-start; call `start()` (e.g. after sending an OTP).
 */
export function useCountdown(startSeconds: number): UseCountdown {
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    setSeconds(startSeconds);
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clear();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [startSeconds, clear]);

  useEffect(() => clear, [clear]);

  return { seconds, active: seconds > 0, start };
}
