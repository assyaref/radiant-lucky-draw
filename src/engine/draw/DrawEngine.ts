import type { Prize } from '../types/prize';
import { TIER_CELEBRATION, CelebrationLevel } from '../types/prize';
import type { DrawConfig, DrawSession } from '../types/draw';
import { DrawStatus } from '../types/draw';
import type { DrawResult, DrawSummary } from '../types/result';
import { DrawErrorCode } from '../types/result';
import { Validation } from './Validation';
import { PrizeSelector } from './PrizeSelector';
import { ProbabilityEngine } from './ProbabilityEngine';
import { SeededRandom, seedFromTimestamp } from '../utils/random';
import { generateId, timestamp } from '../utils/math';
import { DRAW_CONFIG, WINNER_MESSAGES } from '../config/drawConfig';

/**
 * DrawEngine Event Callbacks.
 * Allows consumers to hook into the draw lifecycle.
 */
export interface DrawEngineCallbacks {
  onDrawStart?: (drawId: string) => void;
  onPrizeSelected?: (prize: Prize, probability: number) => void;
  onPrizeReserved?: (prize: Prize) => void;
  onDrawComplete?: (result: DrawResult) => void;
  onDrawError?: (error: string, code: string) => void;
  onStockUpdated?: (prizeId: string, remainingStock: number) => void;
}

/**
 * Enterprise Lucky Draw Engine.
 *
 * Orchestrates the complete draw lifecycle:
 * 1. Validate prize stock
 * 2. Load prize pool
 * 3. Weighted selection
 * 4. Reserve prize
 * 5. Generate result
 * 6. Return DrawResult
 *
 * SOLID Principles:
 * - Single Responsibility: Orchestrates the draw flow
 * - Open/Closed: Extensible via callbacks and strategies
 * - Liskov Substitution: All dependencies are interface-based
 * - Interface Segregation: Clean, focused interfaces
 * - Dependency Inversion: Depends on abstractions, not concretions
 *
 * Framework Independent: Zero React/UI dependencies.
 * Fully testable with seeded random generator.
 */
export class DrawEngine {
  private validation: Validation;
  private selector: PrizeSelector;
  private probabilityEngine: ProbabilityEngine;
  private random: SeededRandom;
  private callbacks: DrawEngineCallbacks;
  private session: DrawSession | null = null;
  private prizes: Map<string, Prize> = new Map();

  constructor(callbacks?: DrawEngineCallbacks) {
    this.validation = new Validation();
    this.selector = new PrizeSelector();
    this.probabilityEngine = new ProbabilityEngine();
    this.random = new SeededRandom(seedFromTimestamp());
    this.callbacks = callbacks ?? {};
  }

  /**
   * Register prizes with the engine.
   * Validates all prizes before accepting them.
   *
   * @throws Error if validation fails
   */
  registerPrizes(prizes: Prize[]): void {
    const validationResult = this.validation.validatePrizePool(prizes);

    if (!validationResult.valid && DRAW_CONFIG.strictValidation) {
      const messages = validationResult.errors.map((e) => e.message).join('; ');
      throw new Error(`Prize validation failed: ${messages}`);
    }

    // Store all prizes (even invalid ones in non-strict mode)
    for (const prize of prizes) {
      this.prizes.set(prize.id, { ...prize });
    }
  }

  /**
   * Get a registered prize by ID.
   */
  getPrize(id: string): Prize | undefined {
    return this.prizes.get(id);
  }

  /**
   * Get all registered prizes.
   */
  getAllPrizes(): Prize[] {
    return Array.from(this.prizes.values());
  }

  /**
   * Start a new draw session.
   */
  startSession(config: DrawConfig): DrawSession {
    const validationResult = this.validation.validateDrawConfig(config);

    if (!validationResult.valid) {
      const messages = validationResult.errors.map((e) => e.message).join('; ');
      throw new Error(`Draw config validation failed: ${messages}`);
    }

    this.session = {
      drawId: config.id,
      startedAt: timestamp(),
      status: DrawStatus.ACTIVE,
      drawCount: 0,
      awardedPrizeIds: [],
    };

    return this.session;
  }

  /**
   * Get the current session state.
   */
  getSession(): DrawSession | null {
    return this.session;
  }

  /**
   * Execute a single draw operation.
   *
   * Flow:
   * 1. Validate prize stock
   * 2. Load eligible prize pool
   * 3. Perform weighted selection
   * 4. Reserve the prize (decrement stock)
   * 5. Generate and return DrawResult
   *
   * @param seed Optional seed for deterministic results
   */
  draw(seed?: number): DrawResult {
    const drawId = generateId();

    try {
      this.callbacks.onDrawStart?.(drawId);

      // Step 1: Get eligible prizes
      const allPrizes = this.getAllPrizes();
      const eligiblePrizes = this.validation.getEligiblePrizes(allPrizes);

      if (eligiblePrizes.length === 0) {
        return this.createErrorResult(
          drawId,
          'No eligible prizes available for drawing',
          DrawErrorCode.NO_PRIZES,
        );
      }

      // Step 2: Build prize pool
      const pool = this.selector.buildPrizePool(eligiblePrizes);

      // Step 3: Perform weighted selection
      const rng = seed !== undefined ? new SeededRandom(seed) : this.random;
      const selection = this.selector.select(pool, rng);

      this.callbacks.onPrizeSelected?.(selection.prize, selection.probability);

      // Step 4: Reserve prize (decrement stock)
      const reservedPrize = this.reservePrize(selection.prize);

      // Step 5: Generate result
      const celebrationLevel = TIER_CELEBRATION[reservedPrize.tier] ?? CelebrationLevel.MINIMAL;
      const winnerMessage = WINNER_MESSAGES[celebrationLevel] ?? 'You won!';

      const result: DrawResult = {
        prize: reservedPrize,
        probability: selection.probability,
        timestamp: timestamp(),
        animationDuration: DRAW_CONFIG.animationDuration,
        winnerMessage,
        celebrationLevel,
        drawId,
        success: true,
        error: null,
      };

      // Update session
      if (this.session) {
        this.session.drawCount++;
        this.session.awardedPrizeIds.push(reservedPrize.id);
      }

      this.callbacks.onDrawComplete?.(result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during draw';
      return this.createErrorResult(drawId, message, DrawErrorCode.INTERNAL_ERROR);
    }
  }

  /**
   * Execute multiple draws in sequence.
   * Useful for batch processing or testing.
   */
  drawMultiple(count: number, seed?: number): DrawResult[] {
    const results: DrawResult[] = [];
    for (let i = 0; i < count; i++) {
      const resultSeed = seed !== undefined ? seed + i : undefined;
      results.push(this.draw(resultSeed));
    }
    return results;
  }

  /**
   * Generate a summary of the current session.
   */
  getSummary(): DrawSummary {
    if (!this.session) {
      return {
        totalDraws: 0,
        totalAwarded: 0,
        byTier: {},
        totalValue: '0',
        duration: 0,
      };
    }

    const byTier: Record<string, number> = {};
    for (const prizeId of this.session.awardedPrizeIds) {
      const prize = this.prizes.get(prizeId);
      if (prize) {
        byTier[prize.tier] = (byTier[prize.tier] ?? 0) + 1;
      }
    }

    return {
      totalDraws: this.session.drawCount,
      totalAwarded: this.session.awardedPrizeIds.length,
      byTier,
      totalValue: String(this.session.awardedPrizeIds.length),
      duration: Date.now() - new Date(this.session.startedAt).getTime(),
    };
  }

  /**
   * Reset the engine to its initial state.
   * Clears all prizes and sessions.
   */
  reset(): void {
    this.prizes.clear();
    this.session = null;
    this.random = new SeededRandom(seedFromTimestamp());
  }

  /**
   * Set the random seed for deterministic testing.
   */
  setSeed(seed: number): void {
    this.random = new SeededRandom(seed);
  }

  /**
   * Get the probability engine for analysis.
   */
  getProbabilityEngine(): ProbabilityEngine {
    return this.probabilityEngine;
  }

  /**
   * Get the validation engine.
   */
  getValidation(): Validation {
    return this.validation;
  }

  /**
   * Reserve a prize by decrementing its stock.
   * Returns a copy of the prize with updated stock.
   */
  private reservePrize(prize: Prize): Prize {
    const stored = this.prizes.get(prize.id);
    if (!stored) {
      throw new Error(`Prize "${prize.id}" not found in engine storage`);
    }

    if (stored.stock <= 0) {
      throw new Error(`Prize "${prize.id}" has insufficient stock`);
    }

    // Decrement stock
    stored.stock--;
    stored.dailyWinnerCount++;

    this.callbacks.onPrizeReserved?.({ ...stored });
    this.callbacks.onStockUpdated?.(stored.id, stored.stock);

    return { ...stored };
  }

  /**
   * Create an error result.
   */
  private createErrorResult(drawId: string, message: string, code: string): DrawResult {
    const errorResult: DrawResult = {
      prize: null as unknown as Prize,
      probability: 0,
      timestamp: timestamp(),
      animationDuration: 0,
      winnerMessage: 'Draw failed',
      celebrationLevel: CelebrationLevel.MINIMAL,
      drawId,
      success: false,
      error: `[${code}] ${message}`,
    };

    this.callbacks.onDrawError?.(message, code);
    return errorResult;
  }
}
