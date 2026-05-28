import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={clsx('skeleton', className)}
      style={{ width, height: height || '16px' }}
      aria-hidden="true"
    />
  );
}

export function WorkerCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start gap-4">
        <Skeleton className="rounded-full flex-shrink-0" width="56px" height="56px" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height="20px" />
          <Skeleton width="40%" height="14px" />
          <Skeleton width="80%" height="14px" />
        </div>
      </div>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="card animate-pulse space-y-3">
      <Skeleton width="70%" height="20px" />
      <Skeleton width="40%" height="14px" />
      <Skeleton width="100%" height="14px" />
      <Skeleton width="90%" height="14px" />
    </div>
  );
}
