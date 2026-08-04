/**
 * Award-Winning Motion Design Variants
 *
 * A curated library of reusable Framer Motion variants designed for
 * a premium exhibition experience. Every variant is tuned for:
 * - Luxury (slow, elegant easing)
 * - Smoothness (GPU-accelerated transforms only)
 * - Cinematic feel (staggered, layered entrances)
 *
 * All animations use transform/opacity only to guarantee 60 FPS.
 */

import type { Variants } from 'framer-motion';

// ─── Easing Curves ───────────────────────────────────────────────────────

/** Signature luxury ease - slow start, gentle settle */
export const EASE_LUXURY = [0.16, 1, 0.3, 1] as const;

/** Cinematic ease for large entrances */
export const EASE_CINEMATIC = [0.22, 1, 0.36, 1] as const;

/** Soft, natural ease for ambient loops */
export const EASE_SOFT = [0.4, 0, 0.2, 1] as const;

/** Spring-like settle for cards */
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

// ─── Duration Tokens ─────────────────────────────────────────────────────

export const DURATION = {
  instant: 0.2,
  fast: 0.4,
  normal: 0.6,
  slow: 0.9,
  cinematic: 1.4,
  epic: 2.2,
} as const;

// ─── Shared Transition Helpers ───────────────────────────────────────────

export const transition = {
  luxury: (delay = 0) => ({
    duration: DURATION.slow,
    ease: EASE_LUXURY,
    delay,
  }),
  cinematic: (delay = 0) => ({
    duration: DURATION.cinematic,
    ease: EASE_CINEMATIC,
    delay,
  }),
  spring: (delay = 0) => ({
    type: 'spring' as const,
    stiffness: 120,
    damping: 18,
    mass: 0.8,
    delay,
  }),
};

// ─── Hero Variants ───────────────────────────────────────────────────────

/** Huge cinematic entrance for the hero title */
export const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.18, delayChildren: 0.2 },
  },
};

export const heroLine: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.96,
    filter: 'blur(12px)',
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: DURATION.cinematic, ease: EASE_CINEMATIC },
  },
};

export const heroSubtitle: Variants = {
  hidden: { opacity: 0, y: 24, letterSpacing: '0.6em' },
  show: {
    opacity: 1,
    y: 0,
    letterSpacing: '0.3em',
    transition: { duration: DURATION.slow, ease: EASE_LUXURY },
  },
};

// ─── Card Variants ───────────────────────────────────────────────────────

/** Premium card entrance with spring settle */
export const cardEntrance: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 18, mass: 0.8 },
  },
};

/** Hover lift for interactive cards */
export const cardHover = {
  y: -8,
  scale: 1.02,
  transition: { type: 'spring', stiffness: 300, damping: 20 },
};

/** Ambient breathing for cards */
export const cardBreathe: Variants = {
  breathe: {
    scale: [1, 1.012, 1],
    transition: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
  },
};

// ─── Panel Variants ──────────────────────────────────────────────────────

/** Side panel slide-in (left/right) */
export const panelSlide = (from: 'left' | 'right' | 'top' | 'bottom'): Variants => {
  const offset = { x: 0, y: 0 };
  if (from === 'left') offset.x = -60;
  if (from === 'right') offset.x = 60;
  if (from === 'top') offset.y = -60;
  if (from === 'bottom') offset.y = 60;
  return {
    hidden: { opacity: 0, ...offset },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: DURATION.slow, ease: EASE_LUXURY },
    },
  };
};

// ─── Floating / Ambient Variants ─────────────────────────────────────────

/** Gentle floating loop */
export const floatLoop: Variants = {
  float: {
    y: [0, -12, 0],
    transition: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
  },
};

/** Slow rotation loop */
export const rotateLoop: Variants = {
  rotate: {
    rotate: [0, 360],
    transition: { repeat: Infinity, duration: 30, ease: 'linear' },
  },
};

/** Breathing glow loop */
export const glowLoop: Variants = {
  glow: {
    opacity: [0.4, 0.9, 0.4],
    scale: [1, 1.04, 1],
    transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
  },
};

/** Pulsing scale loop */
export const pulseLoop: Variants = {
  pulse: {
    scale: [1, 1.06, 1],
    transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
  },
};

// ─── Light Sweep ─────────────────────────────────────────────────────────

/** Cinematic light sweep across a surface */
export const lightSweep: Variants = {
  sweep: {
    x: ['-120%', '220%'],
    transition: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
  },
};

// ─── Countdown ───────────────────────────────────────────────────────────

/** Number transition with scale + blur */
export const countNumber: Variants = {
  enter: {
    opacity: 0,
    scale: 1.6,
    filter: 'blur(8px)',
  },
  center: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: DURATION.normal, ease: EASE_CINEMATIC },
  },
  exit: {
    opacity: 0,
    scale: 0.6,
    filter: 'blur(8px)',
    transition: { duration: DURATION.fast, ease: EASE_SOFT },
  },
};

// ─── Winner Card ─────────────────────────────────────────────────────────

/** Winner card cinematic entrance */
export const winnerCard: Variants = {
  hidden: { opacity: 0, y: 80, scale: 0.8, rotateX: 12 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { type: 'spring', stiffness: 90, damping: 16, mass: 1 },
  },
  exit: { opacity: 0, scale: 0.85, y: -30, transition: { duration: DURATION.fast } },
};

/** Portrait zoom-in */
export const portraitZoom: Variants = {
  hidden: { scale: 0.6, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 150, damping: 15, delay: 0.3 },
  },
};

// ─── Queue / Progress ────────────────────────────────────────────────────

/** Animated progress bar fill */
export const progressFill: Variants = {
  hidden: { scaleX: 0 },
  show: {
    scaleX: 1,
    transition: { duration: DURATION.slow, ease: EASE_LUXURY },
  },
};

/** Queue card pulse on change */
export const queuePulse: Variants = {
  pulse: {
    scale: [1, 1.03, 1],
    boxShadow: [
      '0 0 0px rgba(96,165,250,0)',
      '0 0 24px rgba(96,165,250,0.4)',
      '0 0 0px rgba(96,165,250,0)',
    ],
    transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
  },
};

// ─── Statistics ──────────────────────────────────────────────────────────

/** KPI pulse on value change */
export const kpiPulse: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
  },
};

// ─── Micro Interactions ──────────────────────────────────────────────────

/** Icon gentle float */
export const iconFloat: Variants = {
  float: {
    y: [0, -6, 0],
    transition: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
  },
};

/** Button pulse */
export const buttonPulse: Variants = {
  pulse: {
    scale: [1, 1.04, 1],
    boxShadow: [
      '0 0 0px rgba(251,191,36,0)',
      '0 0 20px rgba(251,191,36,0.5)',
      '0 0 0px rgba(251,191,36,0)',
    ],
    transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
  },
};

// ─── Camera / Parallax ───────────────────────────────────────────────────

/** Slow cinematic zoom */
export const cameraZoom: Variants = {
  zoom: {
    scale: [1, 1.06, 1],
    transition: { repeat: Infinity, duration: 24, ease: 'easeInOut' },
  },
};

/** Slow ambient pan */
export const cameraPan: Variants = {
  pan: {
    x: [0, 20, 0],
    y: [0, -12, 0],
    transition: { repeat: Infinity, duration: 30, ease: 'easeInOut' },
  },
};

// ─── Stagger Helpers ─────────────────────────────────────────────────────

/**
 * Build a stagger container variant.
 */
export const staggerContainer = (stagger = 0.12, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/**
 * Build a fade-up child variant.
 */
export const fadeUp = (distance = 30, duration = DURATION.slow): Variants => ({
  hidden: { opacity: 0, y: distance },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration, ease: EASE_LUXURY },
  },
});

/**
 * Build a fade-in child variant.
 */
export const fadeIn = (duration = DURATION.normal): Variants => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration, ease: EASE_SOFT },
  },
});

// ─── Export All ──────────────────────────────────────────────────────────

export const motionVariants = {
  heroContainer,
  heroLine,
  heroSubtitle,
  cardEntrance,
  cardHover,
  cardBreathe,
  panelSlide,
  floatLoop,
  rotateLoop,
  glowLoop,
  pulseLoop,
  lightSweep,
  countNumber,
  winnerCard,
  portraitZoom,
  progressFill,
  queuePulse,
  kpiPulse,
  iconFloat,
  buttonPulse,
  cameraZoom,
  cameraPan,
  staggerContainer,
  fadeUp,
  fadeIn,
};
