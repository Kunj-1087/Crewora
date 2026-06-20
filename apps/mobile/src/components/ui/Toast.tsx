'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn, TOAST_DURATION } from '@/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeConfig: Record<
  ToastType,
  { icon: React.ElementType; accent: string; iconColor: string }
> = {
  success: { icon: CheckCircle2, accent: 'border-l-success', iconColor: 'text-success' },
  error: { icon: XCircle, accent: 'border-l-error', iconColor: 'text-error' },
  warning: { icon: AlertTriangle, accent: 'border-l-warning', iconColor: 'text-warning' },
  info: { icon: Info, accent: 'border-l-accent-600', iconColor: 'text-accent-600' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', durationMs = TOAST_DURATION) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Stacked above the bottom tab bar, centered within the device frame. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[84px] z-[200] flex flex-col items-center gap-2 px-4 pb-safe"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const { icon: Icon, accent, iconColor } = typeConfig[toast.type];
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-gray-border border-l-4 bg-white px-4 py-3 shadow-lg',
                'animate-toastIn',
                accent
              )}
            >
              <Icon size={20} className={cn('mt-0.5 flex-shrink-0', iconColor)} aria-hidden="true" />
              <p className="flex-1 text-sm font-medium text-navy">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="-m-1 flex-shrink-0 p-1 text-gray-caption hover:text-navy transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
