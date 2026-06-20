'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/theme';

export interface StarRatingProps {
  /** Rating from 0 to `max`. */
  value: number;
  max?: number;
  /** Enables tap-to-rate. When set, `onChange` receives 1..max. */
  onChange?: (value: number) => void;
  size?: number;
  /** Show the numeric value beside the stars. */
  showValue?: boolean;
  /** Show "(N)" review count beside the value. */
  reviewCount?: number;
  className?: string;
}

export function StarRating({
  value,
  max = 5,
  onChange,
  size = 16,
  showValue = false,
  reviewCount,
  className,
}: StarRatingProps) {
  const interactive = !!onChange;
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div
        className="inline-flex items-center gap-0.5"
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={interactive ? 'Select a rating' : `Rated ${value} of ${max}`}
      >
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1;
          const fillRatio = Math.max(0, Math.min(1, display - i)); // 0, 0.5, 1...

          const star = (
            <span className="relative inline-flex" style={{ width: size, height: size }}>
              <Star size={size} className="text-warning" aria-hidden="true" />
              {fillRatio > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillRatio * 100}%` }}
                >
                  <Star
                    size={size}
                    className="text-warning fill-warning"
                    aria-hidden="true"
                  />
                </span>
              )}
            </span>
          );

          return interactive ? (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={value === starValue}
              aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
              onClick={() => onChange?.(starValue)}
              onMouseEnter={() => setHover(starValue)}
              onMouseLeave={() => setHover(null)}
              className="p-0.5 transition-transform active:scale-90 motion-reduce:active:scale-100"
            >
              {star}
            </button>
          ) : (
            <React.Fragment key={i}>{star}</React.Fragment>
          );
        })}
      </div>

      {showValue && (
        <span className="text-[13px] font-semibold text-navy">
          {value.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-[13px] text-gray-body">({reviewCount})</span>
      )}
    </div>
  );
}
