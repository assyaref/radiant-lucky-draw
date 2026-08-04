/**
 * Prize Tier definitions for weighted probability distribution.
 * Higher tier = rarer = lower weight.
 */
export const PrizeTier = {
  GRAND: 'grand',
  VERY_RARE: 'very_rare',
  RARE: 'rare',
  NORMAL: 'normal',
  COMMON: 'common',
} as const;

export type PrizeTier = (typeof PrizeTier)[keyof typeof PrizeTier];

/**
 * Default weight values per tier.
 * These ensure statistically fair distribution across tiers.
 */
export const TIER_WEIGHTS: Record<PrizeTier, number> = {
  [PrizeTier.GRAND]: 0.5,
  [PrizeTier.VERY_RARE]: 1,
  [PrizeTier.RARE]: 3,
  [PrizeTier.NORMAL]: 15,
  [PrizeTier.COMMON]: 80,
};

/**
 * Celebration level determines the visual intensity of the win animation.
 */
export const CelebrationLevel = {
  ULTRA: 'ultra',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  MINIMAL: 'minimal',
} as const;

export type CelebrationLevel = (typeof CelebrationLevel)[keyof typeof CelebrationLevel];

/**
 * Maps prize tiers to their celebration levels.
 */
export const TIER_CELEBRATION: Record<PrizeTier, CelebrationLevel> = {
  [PrizeTier.GRAND]: CelebrationLevel.ULTRA,
  [PrizeTier.VERY_RARE]: CelebrationLevel.HIGH,
  [PrizeTier.RARE]: CelebrationLevel.MEDIUM,
  [PrizeTier.NORMAL]: CelebrationLevel.LOW,
  [PrizeTier.COMMON]: CelebrationLevel.MINIMAL,
};

/**
 * Core Prize model.
 * Fully independent of any UI framework.
 */
export interface Prize {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Optional description */
  description: string;
  /** Prize tier for probability weighting */
  tier: PrizeTier;
  /** Optional image URL */
  image: string;
  /** Theme color for UI rendering */
  color: string;
  /** Probability weight (higher = more likely) */
  weight: number;
  /** Current stock count. 0 = unavailable */
  stock: number;
  /** Maximum winners per day. 0 = unlimited */
  maxDailyWinner: number;
  /** Whether this prize is currently active */
  enabled: boolean;
  /** Display order for UI sorting */
  displayOrder: number;
  /** Daily winner count (runtime state) */
  dailyWinnerCount: number;
}

/**
 * Parameters for creating a new Prize.
 * Omits runtime state fields.
 */
export interface PrizeCreateParams {
  id: string;
  name: string;
  description?: string;
  tier: PrizeTier;
  image?: string;
  color?: string;
  weight?: number;
  stock: number;
  maxDailyWinner?: number;
  enabled?: boolean;
  displayOrder?: number;
}

/**
 * Prize pool configuration for a single draw session.
 */
export interface PrizePool {
  /** All eligible prizes for this draw */
  prizes: Prize[];
  /** Total weight of all prizes in the pool */
  totalWeight: number;
  /** Number of prizes available */
  count: number;
}