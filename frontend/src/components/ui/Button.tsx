/**
 * Button Component — Design System
 * All variants use design tokens, no hardcoded colors.
 * Handles loading state with spinner.
 */

import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm ' +
    'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  secondary:
    'bg-primary-50 text-primary-600 hover:bg-primary-100 active:bg-primary-200 ' +
    'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  outline:
    'border-2 border-primary-500 text-primary-600 bg-white hover:bg-primary-50 ' +
    'active:bg-primary-100 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  ghost:
    'text-primary-600 hover:bg-primary-50 active:bg-primary-100 ' +
    'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  danger:
    'bg-error text-white hover:bg-red-700 active:bg-red-800 shadow-sm ' +
    'focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-5 py-2.5 text-[16px] rounded-lg gap-2',
  lg: 'px-8 py-3.5 text-[16px] rounded-lg gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-all duration-150 outline-none',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}
