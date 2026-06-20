'use client';

import React from 'react';
import { cn } from '@/theme';

export type SkeletonShape = 'line' | 'circle' | 'rect';

export interface SkeletonProps {
  shape?: SkeletonShape;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const shapeStyles: Record<SkeletonShape, string> = {
  line: 'rounded-md h-3.5',
  circle: 'rounded-full',
  rect: 'rounded-xl',
};

export function Skeleton({ shape = 'line', width, height, className }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton-sweep', shapeStyles[shape], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/** Placeholder matching the job/request card layout. */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-border bg-white p-4" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="55%" />
          <Skeleton width="35%" height={10} />
        </div>
        <Skeleton shape="rect" width={64} height={22} />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton width="90%" />
        <Skeleton width="70%" />
      </div>
    </div>
  );
}

/** Placeholder matching the worker/provider profile layout. */
export function SkeletonProfile() {
  return (
    <div className="flex flex-col items-center gap-3 p-6" aria-hidden="true">
      <Skeleton shape="circle" width={96} height={96} />
      <Skeleton width="50%" height={20} />
      <Skeleton width="35%" />
      <div className="mt-4 flex w-full gap-2">
        <Skeleton shape="rect" width="100%" height={56} />
        <Skeleton shape="rect" width="100%" height={56} />
        <Skeleton shape="rect" width="100%" height={56} />
      </div>
    </div>
  );
}
