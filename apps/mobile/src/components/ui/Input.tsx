'use client';

import React, { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/theme';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Supporting text shown below the field when there is no error. */
  helperText?: string;
  /** @deprecated use helperText */
  hint?: string;
  leftIcon?: React.ReactNode;
  /** Custom element rendered at the right edge (e.g. clear button). */
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Floating-label input. The label animation is pure CSS (peer-placeholder-shown /
 * peer-focus) so it stays uncontrolled and works cleanly with react-hook-form.
 * When `type="password"`, a show/hide toggle is rendered automatically.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      hint,
      leftIcon,
      rightElement,
      fullWidth = true,
      className,
      id,
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    const reactId = useId();
    const inputId = id || `input-${reactId}`;
    const support = helperText ?? hint;

    const isPassword = type === 'password';
    const [show, setShow] = useState(false);
    const resolvedType = isPassword ? (show ? 'text' : 'password') : type;

    const rightContent =
      rightElement ??
      (isPassword ? (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="text-gray-caption hover:text-navy transition-colors p-1 -m-1"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      ) : null);

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-caption pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            type={resolvedType}
            disabled={disabled}
            placeholder=" "
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : support
                ? `${inputId}-hint`
                : undefined
            }
            className={cn(
              'peer w-full rounded-xl border bg-white text-[16px] text-navy outline-none',
              'transition-[border-color,box-shadow] duration-150',
              // top padding leaves room for the floated label
              label ? 'px-4 pt-5 pb-2' : 'px-4 py-3.5',
              'placeholder:text-transparent',
              'focus:ring-2',
              error
                ? 'border-error focus:border-error focus:ring-red-100'
                : 'border-gray-border focus:border-accent-600 focus:ring-accent-100',
              'disabled:bg-gray-light disabled:text-gray-body disabled:cursor-not-allowed',
              leftIcon && 'pl-11',
              rightContent && 'pr-11',
              className
            )}
            {...props}
          />

          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 origin-left pointer-events-none',
                'text-[16px] text-gray-caption transition-all duration-150',
                leftIcon && 'left-11',
                // floated state: focused OR has content (placeholder hidden)
                'peer-focus:top-3 peer-focus:-translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:left-4',
                'peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:left-4',
                error ? 'peer-focus:text-error' : 'peer-focus:text-accent-700'
              )}
            >
              {label}
              {props.required && <span className="text-error ml-0.5">*</span>}
            </label>
          )}

          {rightContent && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
              {rightContent}
            </span>
          )}
        </div>

        {error ? (
          <p id={`${inputId}-error`} className="text-[13px] text-error" role="alert">
            {error}
          </p>
        ) : support ? (
          <p id={`${inputId}-hint`} className="text-[13px] text-gray-body">
            {support}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
