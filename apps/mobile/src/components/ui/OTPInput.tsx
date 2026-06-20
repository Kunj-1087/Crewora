'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/theme';

export interface OTPInputProps {
  /** Current OTP value (controlled). */
  value: string;
  onChange: (value: string) => void;
  /** Fired once the final digit is entered. */
  onComplete?: (value: string) => void;
  length?: number;
  /** Set true to trigger the shake animation (e.g. on a wrong code). */
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
}

export function OTPInput({
  value,
  onChange,
  onComplete,
  length = 6,
  error = false,
  disabled = false,
  autoFocus = true,
  'aria-label': ariaLabel = 'One-time passcode',
}: OTPInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [shake, setShake] = useState(false);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  // Re-trigger the shake animation each time `error` flips to true.
  useEffect(() => {
    if (!error) return;
    setShake(true);
    inputs.current[0]?.focus();
    const t = setTimeout(() => setShake(false), 450);
    return () => clearTimeout(t);
  }, [error]);

  const commit = (next: string) => {
    const trimmed = next.slice(0, length);
    onChange(trimmed);
    if (trimmed.length === length) onComplete?.(trimmed);
  };

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, '').slice(-1); // keep last typed digit only
    if (!char) return;
    const arr = digits.slice();
    arr[index] = char;
    commit(arr.join(''));
    if (index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = digits.slice();
      if (arr[index]) {
        arr[index] = '';
        onChange(arr.join(''));
      } else if (index > 0) {
        arr[index - 1] = '';
        onChange(arr.join(''));
        inputs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pasted) {
      commit(pasted);
      const focusAt = Math.min(pasted.length, length - 1);
      inputs.current[focusAt]?.focus();
    }
  };

  return (
    <div
      className={cn('flex gap-2 sm:gap-3', shake && 'animate-shake')}
      role="group"
      aria-label={ariaLabel}
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-14 w-full min-w-0 rounded-xl border-2 bg-white text-center text-xl font-bold text-navy',
            'outline-none transition-[border-color,box-shadow] duration-150',
            'focus:border-accent-600 focus:ring-4 focus:ring-accent-100',
            error ? 'border-error' : 'border-gray-border',
            'disabled:bg-gray-light disabled:cursor-not-allowed'
          )}
        />
      ))}
    </div>
  );
}
