'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/theme';

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Show the header close button. Defaults to true when a title is present. */
  showClose?: boolean;
  /** Max height of the sheet (CSS value). Defaults to 85vh. */
  maxHeight?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  showClose,
  maxHeight = '85vh',
  children,
  className,
}: BottomSheetProps) {
  const shouldShowClose = showClose ?? !!title;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[150] bg-navy/40 backdrop-blur-sm data-[state=open]:animate-fadeIn" />
        <Dialog.Content
          aria-describedby={undefined}
          style={{ maxHeight }}
          className={cn(
            'fixed inset-x-0 bottom-0 z-[151] mx-auto flex w-full max-w-[420px] flex-col',
            'rounded-t-3xl border-t border-gray-border bg-white shadow-lg',
            'animate-sheetIn focus:outline-none pb-safe',
            className
          )}
        >
          {/* Grab handle */}
          <div className="flex justify-center pt-3">
            <span className="h-1 w-10 rounded-full bg-gray-border" aria-hidden="true" />
          </div>

          {(title || shouldShowClose) && (
            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <Dialog.Title
                className={cn(
                  'text-base font-bold text-navy',
                  !title && 'sr-only'
                )}
              >
                {title || 'Options'}
              </Dialog.Title>
              {shouldShowClose && (
                <Dialog.Close
                  className="-m-1.5 rounded-full p-1.5 text-gray-caption transition-colors hover:bg-gray-light hover:text-navy"
                  aria-label="Close"
                >
                  <X size={20} />
                </Dialog.Close>
              )}
            </div>
          )}

          <div className="overflow-y-auto px-5 pb-5 pt-1">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
