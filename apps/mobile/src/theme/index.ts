/**
 * Crewora design system — single source of truth.
 *
 * This file contains color tokens, typography scales, spacing scales, border radius
 * values, shadow presets, and a StyleSheet utility mimicking React Native for strict
 * styling compliance.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import React from 'react';

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Locked Color Palette
export const colors = {
  primary: '#266DD3',
  primaryDark: '#1A56B0',
  primaryLight: '#EBF2FF',
  secondary: '#0F172A', // Secondary/Text
  background: '#FFFFFF',
  surface: '#F8FAFF',
  border: '#E2E8F0',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
} as const;

// Typography Scale
export const typography = {
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 36,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

// 4px Base Grid Spacing Scale
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

// Corner Radius Values
export const radius = {
  sm: 4,
  input: 10,
  button: 10,
  card: 16,
  full: 9999,
} as const;

// Shadow Presets for iOS & Android (simulated as CSS Box Shadows)
export const shadows = {
  sm: '0px 1px 2px rgba(15, 23, 42, 0.05)',
  md: '0px 4px 12px rgba(38, 109, 211, 0.06), 0px 2px 4px rgba(38, 109, 211, 0.04)',
  lg: '0px 10px 24px rgba(38, 109, 211, 0.12), 0px 4px 8px rgba(38, 109, 211, 0.04)',
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;

/** Standard auto-dismiss for toasts (ms). */
export const TOAST_DURATION = 3000;
/** OTP resend countdown (seconds). */
export const OTP_RESEND_SECONDS = 60;

/**
 * StyleSheet emulation mimicking React Native's StyleSheet.create.
 * Ensures CSS-in-JS style objects are completely typed and follow React web styling.
 */
export const StyleSheet = {
  create<T extends Record<string, React.CSSProperties>>(styles: T): T {
    return styles;
  },
};

export default theme;
