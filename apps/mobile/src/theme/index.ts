/**
 * Crewora design system — single source of truth.
 *
 * These tokens mirror the Tailwind config (apps/mobile/tailwind.config.ts) exactly.
 * Tailwind classes remain the primary styling mechanism; this module exists so that
 * non-class values (status → variant maps, JS-driven sizes, chart colors, etc.) read
 * from one place instead of hard-coding hex/px throughout the app.
 *
 * Brand: navy (#0b1528) is the primary/ink color; royal blue (#2563eb) is the
 * accent / call-to-action color.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conflict resolution. Used by every UI component. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const colors = {
  // Primary brand — navy (ink, dark surfaces)
  primary: {
    DEFAULT: '#0b1528',
    50: '#F0F4F8',
    100: '#D9E2EC',
    200: '#BCCCDC',
    300: '#9FB3C8',
    400: '#627D98',
    500: '#243B53',
    600: '#0b1528',
    700: '#091020',
    800: '#050a14',
    900: '#020408',
  },
  // Accent — royal blue (CTAs, active states, links)
  accent: {
    DEFAULT: '#2563eb',
    50: '#f0f6ff',
    100: '#e0ecff',
    200: '#c7dcff',
    300: '#9ec2ff',
    400: '#6ba0ff',
    500: '#2563eb',
    600: '#1d4ed8',
    700: '#1e40af',
    800: '#1e3a8a',
    900: '#172554',
  },
  navy: '#0b1528',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0b1528',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  success: { DEFAULT: '#10b981', light: '#d1fae5' },
  warning: { DEFAULT: '#F59E0B', light: '#FEF3C7' },
  error: { DEFAULT: '#EF4444', light: '#FEE2E2' },
  info: { DEFAULT: '#2563eb', light: '#e0ecff' },
  overlay: 'rgba(11, 21, 40, 0.5)',
  skeleton: '#E2E8F0',
  skeletonHighlight: '#F1F5F9',
} as const;

export const typography = {
  size: { xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 30, xxxl: 36 },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.7 },
} as const;

/** 4px base grid (px values). Matches Tailwind spacing scale. */
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const shadows = {
  sm: '0 1px 3px rgba(38, 109, 211, 0.08)',
  md: '0 4px 12px rgba(38, 109, 211, 0.10)',
  lg: '0 8px 24px rgba(38, 109, 211, 0.15)',
  card: '0 2px 8px rgba(0,0,0,0.06)',
} as const;

/** Standard auto-dismiss for toasts (ms). */
export const TOAST_DURATION = 3000;
/** OTP resend countdown (seconds). */
export const OTP_RESEND_SECONDS = 60;

export const theme = { colors, typography, spacing, radius, shadows } as const;
export type Theme = typeof theme;

export default theme;
