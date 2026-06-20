'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/theme';
import { Button } from './Button';

export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `destructive` for irreversible actions (delete, cancel job, logout). */
  tone?: 'primary' | 'destructive';
  /** Disables buttons and shows a spinner on confirm. */
  loading?: boolean;
  /** Disable just the confirm button (e.g. a required reason is empty). */
  confirmDisabled?: boolean;
  onConfirm: () => void;
  /** Optional extra content (e.g. a reason input) rendered above the buttons. */
  children?: React.ReactNode;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
  confirmDisabled = false,
  onConfirm,
  children,
}: ConfirmationModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[150] bg-navy/40 backdrop-blur-sm data-[state=open]:animate-fadeIn" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[151] w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl border border-gray-border bg-white p-6 shadow-lg',
            'animate-scaleIn focus:outline-none'
          )}
        >
          <Dialog.Title className="text-lg font-bold text-navy">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="mt-2 text-sm text-gray-body">
              {description}
            </Dialog.Description>
          )}

          {children && <div className="mt-4">{children}</div>}

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              fullWidth
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={tone === 'destructive' ? 'destructive' : 'primary'}
              fullWidth
              isLoading={loading}
              disabled={confirmDisabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
