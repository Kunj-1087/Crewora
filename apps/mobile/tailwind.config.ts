import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    '../../packages/ui/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── Crewora Design System ───────────────────────────────────────────────
      colors: {
        // Primary Brand — Navy
        primary: {
          DEFAULT: '#0b1528',
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#627D98',
          500: '#243B53',   // Slate Blue
          600: '#0b1528',   // Primary Navy
          700: '#091020',
          800: '#050a14',
          900: '#020408',
        },
        // Accent Color — Royal Blue
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
        // Semantic Colors
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        },
        // Neutrals
        navy: '#0b1528',
        gray: {
          body: '#475569',
          light: '#F8FAFC',
          border: '#E2E8F0',
          caption: '#94A3B8',
        },
      },
      // ─── Typography ──────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'heading-1': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-3': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'btn': ['16px', { lineHeight: '1', fontWeight: '500' }],
      },
      // ─── Spacing (4dp/8dp scale) ──────────────────────────────────────────
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      // ─── Corner Radius ────────────────────────────────────────────────────
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
      },
      // ─── Shadows / Elevation ─────────────────────────────────────────────
      boxShadow: {
        'sm': '0 1px 3px rgba(38, 109, 211, 0.08)',
        'DEFAULT': '0 4px 12px rgba(38, 109, 211, 0.10)',
        'md': '0 4px 12px rgba(38, 109, 211, 0.10)',
        'lg': '0 8px 24px rgba(38, 109, 211, 0.15)',
        'card': '0 2px 8px rgba(0,0,0,0.06)',
      },
      // ─── Animation ───────────────────────────────────────────────────────
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Modal/card pop — used by ConfirmationModal, FeedbackModal
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Toast entry — slides up from the bottom of the device
        toastIn: {
          '0%': { opacity: '0', transform: 'translateY(120%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Bottom sheet entry
        sheetIn: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        // Wrong-OTP shake
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        // Staggered list-item entry
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        fadeIn: 'fadeIn 0.3s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
        slideDown: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        scaleIn: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        toastIn: 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        sheetIn: 'sheetIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        shake: 'shake 0.4s ease-in-out',
        fadeInDown: 'fadeInDown 0.3s ease-out both',
        fadeInUp: 'fadeInUp 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
