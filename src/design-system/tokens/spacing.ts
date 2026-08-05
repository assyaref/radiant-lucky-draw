/**
 * Premium Lucky Draw Digital Booth — Spacing Tokens
 *
 * Consistent 4px-based spacing scale for the booth layout.
 */

export const spacing = {
  /* ── Base Scale (4px grid) ─────────────────────────── */
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  lg: '1rem', // 16px
  xl: '1.5rem', // 24px
  '2xl': '2rem', // 32px
  '3xl': '2.5rem', // 40px
  '4xl': '3rem', // 48px
  '5xl': '4rem', // 64px
  '6xl': '5rem', // 80px

  /* ── Layout Specific ───────────────────────────────── */
  panel: {
    padding: '1.25rem',
    gap: '0.875rem',
    innerGap: '0.625rem',
  },
  topbar: {
    height: '4rem',
    paddingX: '1.25rem',
  },
  machine: {
    gap: '1.5rem',
    section: '0.5rem',
  },
  sidePanel: {
    width: 'min(22rem, 28vw)',
  },
} as const;

export type SpacingToken = typeof spacing;
