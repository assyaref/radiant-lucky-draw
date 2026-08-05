/**
 * Premium Lucky Draw Digital Booth — Radius Tokens
 */

export const radius = {
  xs: '0.25rem', // 4px
  sm: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.25rem', // 20px
  '3xl': '1.5rem', // 24px
  full: '9999px',

  /* ── Component Specific ────────────────────────────── */
  panel: '1rem',
  card: '0.875rem',
  button: '0.75rem',
  machine: '2rem',
} as const;

export type RadiusToken = typeof radius;
