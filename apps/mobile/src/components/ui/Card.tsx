'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/theme';

export type CardVariant = 'elevated' | 'outlined' | 'filled';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  /** Adds press feedback + button semantics for tappable cards. */
  pressable?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  elevated: 'bg-white shadow-card border border-transparent',
  outlined: 'bg-white border border-gray-border',
  filled: 'bg-gray-light border border-transparent',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      padding = 'md',
      pressable = false,
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        role={pressable ? 'button' : undefined}
        tabIndex={pressable ? 0 : undefined}
        onKeyDown={
          pressable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  (e.currentTarget as HTMLDivElement).click();
                }
              }
            : undefined
        }
        className={cn(
          'rounded-2xl',
          variantStyles[variant],
          paddingStyles[padding],
          pressable &&
            'cursor-pointer transition-[transform,box-shadow] duration-150 ' +
              'hover:shadow-md active:scale-[0.98] motion-reduce:active:scale-100 ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
