/**
 * Enterprise Lucky Draw Engine Configuration.
 * All timing values in milliseconds.
 */
export const DRAW_CONFIG = {
  /** Duration of the draw animation sequence */
  animationDuration: 3000,

  /** Duration of the countdown before draw */
  countdownDuration: 3000,

  /** Duration of the shuffle/cycling animation */
  shuffleDuration: 2000,

  /** Duration of the confetti celebration */
  confettiDuration: 4000,

  /** Duration of the winner screen display */
  winnerScreenDuration: 5000,

  /** Maximum number of prizes allowed in a single draw pool */
  maxPrizePoolSize: 100,

  /** Minimum weight allowed for any prize */
  minWeight: 0.1,

  /** Maximum weight allowed for any prize */
  maxWeight: 1000,

  /** Default seed for deterministic testing */
  defaultSeed: 42,

  /** Whether to enable strict validation mode */
  strictValidation: true,

  /** Maximum retries for prize selection */
  maxSelectionRetries: 3,
} as const;

/**
 * Winner messages mapped by celebration level.
 */
export const WINNER_MESSAGES: Record<string, string> = {
  ultra: '🎉 JACKPOT! You won the GRAND PRIZE! 🎉',
  high: '🌟 Amazing! You won a premium prize! 🌟',
  medium: '✨ Congratulations! You won a great prize! ✨',
  low: '🎊 You won a prize! 🎊',
  minimal: 'You won! Check your prize.',
};

/**
 * Default prize colors by tier.
 */
export const TIER_COLORS: Record<string, string> = {
  grand: '#fbbf24',
  very_rare: '#a78bfa',
  rare: '#60a5fa',
  normal: '#34d399',
  common: '#94a3b8',
};