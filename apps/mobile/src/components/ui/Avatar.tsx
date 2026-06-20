'use client';

import React from 'react';
import * as RadixAvatar from '@radix-ui/react-avatar';
import { cn } from '@/theme';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  /** Image URL; falls back to initials when missing or it fails to load. */
  uri?: string | null;
  /** Used to derive initials and as the alt text. */
  name?: string;
  size?: AvatarSize;
  /** Shows a green presence dot in the corner. */
  online?: boolean;
  className?: string;
}

const sizeMap: Record<AvatarSize, { box: string; text: string; dot: string }> = {
  sm: { box: 'h-8 w-8', text: 'text-xs', dot: 'h-2 w-2' },
  md: { box: 'h-11 w-11', text: 'text-sm', dot: 'h-2.5 w-2.5' },
  lg: { box: 'h-16 w-16', text: 'text-lg', dot: 'h-3 w-3' },
  xl: { box: 'h-24 w-24', text: 'text-3xl', dot: 'h-4 w-4' },
};

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  uri,
  name,
  size = 'md',
  online,
  className,
}: AvatarProps) {
  const s = sizeMap[size];

  return (
    <span className={cn('relative inline-flex flex-shrink-0', className)}>
      <RadixAvatar.Root
        className={cn(
          'inline-flex select-none items-center justify-center overflow-hidden rounded-full bg-accent-100 align-middle',
          s.box
        )}
      >
        {uri && (
          <RadixAvatar.Image
            src={uri}
            alt={name || 'Avatar'}
            className="h-full w-full object-cover"
          />
        )}
        <RadixAvatar.Fallback
          delayMs={uri ? 200 : 0}
          className={cn(
            'flex h-full w-full items-center justify-center bg-accent-100 font-bold text-accent-700',
            s.text
          )}
        >
          {initials(name)}
        </RadixAvatar.Fallback>
      </RadixAvatar.Root>

      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            online ? 'bg-success' : 'bg-gray-caption',
            s.dot
          )}
          aria-label={online ? 'Online' : 'Offline'}
        />
      )}
    </span>
  );
}
