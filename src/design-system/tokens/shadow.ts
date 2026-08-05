/**
 * Premium Lucky Draw Digital Booth — Shadow Tokens
 */

export const shadows = {
  /* ── Base Elevation ────────────────────────────────── */
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.25), 0 2px 4px -2px rgb(0 0 0 / 0.2)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.2)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.35), 0 8px 10px -6px rgb(0 0 0 / 0.25)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.4)',

  /* ── Glow Effects ──────────────────────────────────── */
  glow: {
    blue: {
      sm: '0 0 12px rgba(59, 130, 246, 0.35)',
      md: '0 0 24px rgba(59, 130, 246, 0.45)',
      lg: '0 0 48px rgba(59, 130, 246, 0.55)',
    },
    gold: {
      sm: '0 0 12px rgba(251, 191, 36, 0.3)',
      md: '0 0 24px rgba(251, 191, 36, 0.4)',
      lg: '0 0 48px rgba(251, 191, 36, 0.5)',
    },
  },

  /* ── Glass / Panel ─────────────────────────────────── */
  panel: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  card: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
  cardHover: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.15)',

  /* ── Machine ───────────────────────────────────────── */
  machine: {
    dome: '0 0 200px rgba(59, 130, 246, 0.25), inset 0 0 60px rgba(59, 130, 246, 0.25)',
    base: '0 0 100px rgba(251, 191, 36, 0.25), inset 0 1px 0 rgba(251, 191, 36, 0.3)',
  },

  /* ── Buttons ───────────────────────────────────────── */
  button: {
    primary: '0 0 24px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    primaryHover: '0 0 48px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
    gold: '0 0 24px rgba(251, 191, 36, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    goldHover: '0 0 48px rgba(251, 191, 36, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
  },

  /* ── Winner ────────────────────────────────────────── */
  winner: '0 0 80px rgba(251, 191, 36, 0.35), 0 0 160px rgba(59, 130, 246, 0.2)',
} as const;

export type ShadowToken = typeof shadows;
