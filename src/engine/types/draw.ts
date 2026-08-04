import type { PrizeTier } from './prize';

/**
 * Configuration for a single draw session.
 */
export interface DrawConfig {
  /** Unique draw session identifier */
  id: string;
  /** Display name for this draw */
  name: string;
  /** Description of this draw event */
  description: string;
  /** Whether this draw is currently active */
  active: boolean;
  /** Prize IDs available in this draw */
  prizeIds: string[];
  /** Maximum number of winners for this draw (0 = unlimited) */
  maxWinners: number;
  /** Current winner count */
  winnerCount: number;
  /** Start time for scheduled draws */
  startTime: string | null;
  /** End time for scheduled draws */
  endTime: string | null;
  /** Minimum tier required to participate */
  minTier: PrizeTier | null;
}

/**
 * Parameters for creating a new Draw configuration.
 */
export interface DrawCreateParams {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
  prizeIds: string[];
  maxWinners?: number;
  startTime?: string;
  endTime?: string;
  minTier?: PrizeTier;
}

/**
 * Draw session state for runtime tracking.
 */
export interface DrawSession {
  /** Reference to the draw config */
  drawId: string;
  /** When this session started */
  startedAt: string;
  /** Current status */
  status: DrawStatus;
  /** Number of draws performed */
  drawCount: number;
  /** IDs of prizes awarded in this session */
  awardedPrizeIds: string[];
}

export const DrawStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type DrawStatus = (typeof DrawStatus)[keyof typeof DrawStatus];