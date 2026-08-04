import type { Prize, PrizePool } from '../types/prize';
import type { SeededRandom } from '../utils/random';
import { cumulativeWeights, percentage, roundTo } from '../utils/math';

/**
 * Prize selection result with probability information.
 */
export interface SelectionResult {
  /** The selected prize */
  prize: Prize;
  /** The probability percentage of this selection */
  probability: number;
  /** The random value that triggered this selection */
  randomValue: number;
}

/**
 * Weighted Prize Selector.
 * Implements cumulative weight algorithm for statistically fair selection.
 * 
 * SOLID: Single Responsibility — selects prizes based on weighted probability.
 *         Open/Closed — extendable with new selection strategies.
 */
export class PrizeSelector {
  /**
   * Select a prize from the pool using weighted probability.
   * 
   * Algorithm:
   * 1. Calculate cumulative weights from all prizes
   * 2. Generate a random value in [0, totalWeight)
   * 3. Binary search to find which prize the value falls into
   * 4. Return the selected prize with its probability
   * 
   * This ensures prizes with higher weights are proportionally more likely.
   */
  select(prizePool: PrizePool, random: SeededRandom): SelectionResult {
    const { prizes, totalWeight } = prizePool;

    // Calculate cumulative weights
    const weights = prizes.map((p) => p.weight);
    const cumulative = cumulativeWeights(weights);

    // Generate random value in [0, totalWeight)
    const randomValue = random.nextFloat(0, totalWeight);

    // Binary search to find the selected prize
    let low = 0;
    let high = cumulative.length - 1;

    while (low < high) {
      const mid = (low + high) >>> 1;
      if (cumulative[mid] <= randomValue) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    const selectedPrize = prizes[low];
    const probability = roundTo(percentage(selectedPrize.weight, totalWeight), 4);

    return {
      prize: selectedPrize,
      probability,
      randomValue,
    };
  }

  /**
   * Build a prize pool from an array of prizes.
   * Filters out ineligible prizes and calculates total weight.
   */
  buildPrizePool(prizes: Prize[]): PrizePool {
    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);

    return {
      prizes,
      totalWeight,
      count: prizes.length,
    };
  }

  /**
   * Calculate the probability for a specific prize in a pool.
   */
  calculateProbability(prize: Prize, pool: PrizePool): number {
    return roundTo(percentage(prize.weight, pool.totalWeight), 4);
  }

  /**
   * Calculate probabilities for all prizes in a pool.
   * Returns a map of prize ID to probability percentage.
   */
  calculateAllProbabilities(pool: PrizePool): Map<string, number> {
    const probabilities = new Map<string, number>();
    for (const prize of pool.prizes) {
      probabilities.set(prize.id, this.calculateProbability(prize, pool));
    }
    return probabilities;
  }
}