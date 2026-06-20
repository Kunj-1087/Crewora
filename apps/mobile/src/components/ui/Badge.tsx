'use client';

import React from 'react';
import { cn } from '@/theme';

export type BadgeVariant =
  | 'default'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

/** Domain statuses (Job + Match) that map to a consistent pill style. */
export type BadgeStatus =
  | 'open'
  | 'matched'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'draft'
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired';

export interface BadgeProps {
  variant?: BadgeVariant;
  /** When set, overrides `variant` with the style for this domain status. */
  status?: BadgeStatus;
  /** Show a leading dot indicator. */
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { pill: string; dot: string }> = {
  default: { pill: 'bg-gray-light text-gray-body', dot: 'bg-gray-body' },
  neutral: { pill: 'bg-slate-100 text-slate-600', dot: 'bg-slate-500' },
  success: { pill: 'bg-success-light text-success', dot: 'bg-success' },
  warning: { pill: 'bg-warning-light text-warning', dot: 'bg-warning' },
  error: { pill: 'bg-error-light text-error', dot: 'bg-error' },
  info: { pill: 'bg-accent-50 text-accent-700', dot: 'bg-accent-500' },
};

const statusToVariant: Record<BadgeStatus, BadgeVariant> = {
  open: 'info',
  matched: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'neutral',
  draft: 'neutral',
  pending: 'info',
  accepted: 'success',
  declined: 'error',
  expired: 'neutral',
};

export function Badge({
  variant = 'default',
  status,
  dot = false,
  children,
  className,
}: BadgeProps) {
  const resolved = status ? statusToVariant[status] : variant;
  const styles = variantStyles[resolved];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        styles.pill,
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
