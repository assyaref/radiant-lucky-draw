import type { Prize, PrizePool, PrizeTier } from '../types/prize';
import { TIER_WEIGHTS } from '../types/prize';
import { PrizeSelector } from './PrizeSelector';
import { DRAW_CONFIG } from '../config/drawConfig';
import { clamp } from '../utils/math';

/**
 * Probability Engine for the Lucky Draw system.
 * Manages weighted probability distribution across prize tiers.
 *
 * SOLID: Single Responsibility — handles all probability calculations.
 *
 * Weight Distribution:
 * - Grand Prize:    0.5  (extremely rare)
 * - Very Rare:      1    (very rare)
 * - Rare:           3    (rare)
 * - Normal:         15   (common)
 * - Common:         80   (very common)
 *
 * Total: 99.5 — statistically fair distribution.
 */
export class ProbabilityEngine {
  private selector: PrizeSelector;

  constructor() {
    this.selector = new PrizeSelector();
  }

  /**
   * Get the default weight for a prize tier.
   */
  getDefaultWeight(tier: PrizeTier): number {
    return TIER_WEIGHTS[tier] ?? DRAW_CONFIG.minWeight;
  }

  /**
   * Validate and normalize a weight value.
   * Ensures weight is within acceptable bounds.
   */
  normalizeWeight(weight: number): number {
    return clamp(weight, DRAW_CONFIG.minWeight, DRAW_CONFIG.maxWeight);
  }

  /**
   * Calculate the probability distribution for a prize pool.
   * Returns a map of prize ID to probability percentage.
   */
  calculateDistribution(pool: PrizePool): Map<string, number> {
    return this.selector.calculateAllProbabilities(pool);
  }

  /**
   * Get the probability for a single prize in a pool.
   */
  getPrizeProbability(prize: Prize, pool: PrizePool): number {
    return this.selector.calculateProbability(prize, pool);
  }

  /**
   * Analyze the probability distribution across tiers.
   * Returns the total probability percentage per tier.
   */
  analyzeTierDistribution(pool: PrizePool): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const prize of pool.prizes) {
      const tier = prize.tier;
      const prob = this.getPrizeProbability(prize, pool);
      distribution[tier] = (distribution[tier] ?? 0) + prob;
    }

    return distribution;
  }

  /**
   * Check if a prize selection is statistically valid.
   * Verifies that the total probability sums to approximately 100%.
   */
  isValidDistribution(pool: PrizePool): boolean {
    const distribution = this.analyzeTierDistribution(pool);
    const total = Object.values(distribution).reduce((sum, p) => sum + p, 0);
    // Allow 0.1% margin of error due to rounding
    return Math.abs(total - 100) < 0.1;
  }
}
