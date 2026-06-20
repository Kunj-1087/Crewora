'use client';

import React from 'react';
import {
  type LucideIcon,
  ClipboardList,
  Send,
  BellOff,
  SearchX,
  Inbox,
} from 'lucide-react';
import { cn } from '@/theme';
import { Button } from './Button';

export type EmptyStatePreset =
  | 'no-requests'
  | 'no-applications'
  | 'no-notifications'
  | 'no-results'
  | 'generic';

interface PresetConfig {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Presets use the app's domain language (jobs / applications).
const presets: Record<EmptyStatePreset, PresetConfig> = {
  'no-requests': {
    icon: ClipboardList,
    title: 'No jobs yet',
    description: 'When you post a job, it will show up here.',
  },
  'no-applications': {
    icon: Send,
    title: 'No applications yet',
    description:
      "You haven't applied to any jobs yet. Browse open jobs to get started.",
  },
  'no-notifications': {
    icon: BellOff,
    title: 'All caught up!',
    description: 'You have no new notifications right now.',
  },
  'no-results': {
    icon: SearchX,
    title: 'No results',
    description: 'Try adjusting your search or filters.',
  },
  generic: {
    icon: Inbox,
    title: 'Nothing here yet',
    description: '',
  },
};

export interface EmptyStateProps {
  preset?: EmptyStatePreset;
  icon?: LucideIcon;
  title?: string;
  /** Supporting copy. Accepts `description` or `subtitle`. */
  description?: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  preset = 'generic',
  icon,
  title,
  description,
  subtitle,
  action,
  className,
}: EmptyStateProps) {
  const base = presets[preset];
  const Icon = icon ?? base.icon;
  const resolvedTitle = title ?? base.title;
  const resolvedDesc = description ?? subtitle ?? base.description;

  return (
    <div
      className={cn(
        'flex animate-fadeInUp flex-col items-center justify-center px-6 py-16 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
        <Icon size={28} className="text-accent-500" aria-hidden="true" />
      </div>
      <h3 className="mb-1.5 text-lg font-semibold text-navy">{resolvedTitle}</h3>
      {resolvedDesc && (
        <p className="mb-6 max-w-xs text-sm text-gray-body">{resolvedDesc}</p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
