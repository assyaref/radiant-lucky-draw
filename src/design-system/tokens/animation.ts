/**
 * Premium Lucky Draw Digital Booth — Animation Tokens
 *
 * Curated easing curves and durations tuned for premium, luxurious motion.
 */

export const easings = {
  /* Luxury signature ease — slow start, gentle settle */
  luxury: [0.16, 1, 0.3, 1] as const,

  /* Cinematic ease for large entrances */
  cinematic: [0.22, 1, 0.36, 1] as const,

  /* Soft, natural ease for ambient loops */
  soft: [0.4, 0, 0.2, 1] as const,

  /* Spring-like settle for cards */
  spring: [0.34, 1.56, 0.64, 1] as const,
};

export const durations = {
  instant: 0.2,
  fast: 0.4,
  normal: 0.6,
  slow: 0.9,
  cinematic: 1.4,
  epic: 2.2,
} as const;

export const transitions = {
  luxury: (delay = 0) => ({
    duration: durations.slow,
    ease: easings.luxury,
    delay,
  }),
  cinematic: (delay = 0) => ({
    duration: durations.cinematic,
    ease: easings.cinematic,
    delay,
  }),
  spring: (delay = 0) => ({
    type: 'spring' as const,
    stiffness: 120,
    damping: 18,
    mass: 0.8,
    delay,
  }),
} as const;

export const loopDurations = {
  float: 5,
  breathe: 3,
  glow: 3,
  rotate: 30,
  pulse: 2,
  sweep: 6,
  machine: 10,
  ball: 1.8,
  particle: 2.5,
} as const;

export type AnimationToken = typeof durations;
