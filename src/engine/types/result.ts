import type { Prize, CelebrationLevel } from './prize';
import type { Participant } from './participant';

/**
 * Result of a single draw operation.
 */
export interface DrawResult {
  /** The prize that was won */
  prize: Prize;
  /** The probability percentage of this prize being selected */
  probability: number;
  /** ISO timestamp of when the draw occurred */
  timestamp: string;
  /** Duration of the draw animation in ms */
  animationDuration: number;
  /** Message to display to the winner */
  winnerMessage: string;
  /** Celebration intensity level */
  celebrationLevel: CelebrationLevel;
  /** Unique draw identifier */
  drawId: string;
  /** Whether this draw was successful */
  success: boolean;
  /** Error message if draw failed */
  error: string | null;
  /** The participant who won (if any) */
  winner?: Participant | null;
}

/**
 * Summary of a draw session for reporting.
 */
export interface DrawSummary {
  /** Total draws performed */
  totalDraws: number;
  /** Total prizes awarded */
  totalAwarded: number;
  /** Prizes awarded grouped by tier */
  byTier: Record<string, number>;
  /** Total value of prizes awarded */
  totalValue: string;
  /** Session duration in ms */
  duration: number;
}

/**
 * Live statistics for the draw session.
 * Used to update the operator dashboard and Live TV.
 */
export interface DrawStatistics {
  /** Total number of draws performed */
  drawCount: number;
  /** Total number of winners */
  totalWinners: number;
  /** Remaining stock per prize ID */
  prizeRemaining: Record<string, number>;
  /** Remaining stock of the grand prize (tier = grand) */
  grandPrizeRemaining: number;
  /** Number of winners per prize ID */
  winnersByPrize: Record<string, number>;
  /** Number of winners per tier */
  winnersByTier: Record<string, number>;
  /** IDs of participants who have already won (prevents duplicates) */
  winnerIds: string[];
}

/**
 * Validation error details.
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
}

/**
 * Result of a validation operation.
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** List of validation errors */
  errors: ValidationError[];
}

/**
 * Error codes for draw operations.
 */
export const DrawErrorCode = {
  NO_PRIZES: 'NO_PRIZES_AVAILABLE',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PRIZE_DISABLED: 'PRIZE_DISABLED',
  MAX_WINNERS_REACHED: 'MAX_WINNERS_REACHED',
  DRAW_INACTIVE: 'DRAW_INACTIVE',
  INVALID_WEIGHT: 'INVALID_WEIGHT',
  DUPLICATE_ID: 'DUPLICATE_ID',
  NEGATIVE_STOCK: 'NEGATIVE_STOCK',
  EXPIRED_DRAW: 'EXPIRED_DRAW',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PARTICIPANT_NOT_FOUND: 'PARTICIPANT_NOT_FOUND',
  PARTICIPANT_ALREADY_WON: 'PARTICIPANT_ALREADY_WON',
} as const;
