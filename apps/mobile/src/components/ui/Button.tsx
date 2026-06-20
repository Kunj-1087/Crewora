'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/theme';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction. */
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// `primary` uses the royal-blue accent (the brand CTA color); navy is reserved for ink.
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 shadow-sm ' +
    'focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
  secondary:
    'bg-accent-50 text-accent-700 hover:bg-accent-100 active:bg-accent-200 ' +
    'focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
  ghost:
    'bg-transparent text-accent-700 hover:bg-accent-50 active:bg-accent-100 ' +
    'focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
  outline:
    'border-2 border-accent-600 text-accent-700 bg-white hover:bg-accent-50 ' +
    'active:bg-accent-100 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
  destructive:
    'bg-error text-white hover:bg-red-600 active:bg-red-700 shadow-sm ' +
    'focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
};

// All sizes meet the 44px minimum tap target (spec §7) via min-h.
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] px-3.5 text-[13px] rounded-lg gap-1.5',
  md: 'min-h-[48px] px-5 text-[15px] rounded-xl gap-2',
  lg: 'min-h-[52px] px-7 text-[16px] rounded-xl gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        {...props}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          'inline-flex items-center justify-center font-semibold outline-none select-none',
          'transition-[transform,background-color,box-shadow] duration-150',
          'active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:transition-none',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={18} aria-hidden="true" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
