/**
 * Premium Lucky Draw Digital Booth — Z-Index Tokens
 *
 * Centralized stacking order for the booth experience.
 */

export const zIndex = {
  /* ── Background Layers ─────────────────────────────── */
  background: 0,
  particles: 1,
  lighting: 2,
  floor: 3,

  /* ── Main Content ──────────────────────────────────── */
  content: 10,
  topbar: 20,
  panels: 15,

  /* ── Overlays ──────────────────────────────────────── */
  overlay: 30,
  modal: 40,
  toast: 50,

  /* ── Machine ───────────────────────────────────────── */
  machine: {
    body: 10,
    dome: 5,
    base: 8,
  },

  /* ── Effects ───────────────────────────────────────── */
  attractMode: 25,
  celebration: 35,
  emergency: 45,
  confetti: 60,
} as const;

export type ZIndexToken = typeof zIndex;
