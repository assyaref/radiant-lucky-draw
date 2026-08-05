/**
 * Premium Lucky Draw Digital Booth — Color Tokens
 *
 * Luxury palette: Deep Navy · Royal Blue · Champagne Gold
 */

export const colors = {
  /* ── Brand: Royal Blue ─────────────────────────────── */
  brand: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
    DEFAULT: '#3b82f6',
  },

  /* ── Gold / Champagne ──────────────────────────────── */
  gold: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
    DEFAULT: '#fbbf24',
  },

  /* ── Deep Space Backgrounds ────────────────────────── */
  bg: {
    base: '#020617', // slate-950
    surface: '#0f172a', // slate-900
    elevated: '#1e293b', // slate-800
    overlay: 'rgba(2, 6, 23, 0.72)',
    footer: 'rgba(15, 23, 42, 0.85)',
  },

  /* ── Glass Surfaces ────────────────────────────────── */
  glass: {
    light: 'rgba(255, 255, 255, 0.06)',
    lighter: 'rgba(255, 255, 255, 0.1)',
    dark: 'rgba(15, 23, 42, 0.55)',
    line: 'rgba(255, 255, 255, 0.08)',
    lineStrong: 'rgba(255, 255, 255, 0.16)',
    glow: 'rgba(59, 130, 246, 0.25)',
    goldGlow: 'rgba(251, 191, 36, 0.22)',
  },

  /* ── Status ────────────────────────────────────────── */
  status: {
    online: '#34d399',
    connected: '#60a5fa',
    disconnected: '#f87171',
    warning: '#fbbf24',
    idle: '#94a3b8',
  },

  /* ── Text ──────────────────────────────────────────── */
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    tertiary: '#64748b',
    inverse: '#020617',
    gold: '#fcd34d',
  },

  /* ── Gradients ─────────────────────────────────────── */
  gradient: {
    blueToGold: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 35%, #f59e0b 100%)',
    goldShine:
      'linear-gradient(120deg, rgba(251,191,36,0) 0%, rgba(251,191,36,0.15) 50%, rgba(251,191,36,0) 100%)',
    blueGlow: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0) 70%)',
    goldGlow: 'radial-gradient(circle, rgba(251,191,36,0.28) 0%, rgba(251,191,36,0) 70%)',
  },
} as const;

export type ColorToken = typeof colors;
