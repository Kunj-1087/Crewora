import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className={clsx('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-navy">
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-gray-caption pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            {...props}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={clsx(
              'w-full rounded-lg border bg-white px-4 py-3 text-[16px] text-navy',
              'placeholder:text-gray-caption transition-all duration-150 outline-none',
              'focus:border-primary-500 focus:ring-2 focus:ring-primary-200',
              error
                ? 'border-error focus:border-error focus:ring-red-100'
                : 'border-gray-border',
              'disabled:bg-gray-light disabled:text-gray-body disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
          />

          {rightIcon && (
            <span className="absolute right-3 text-gray-caption">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-gray-body">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

