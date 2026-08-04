import type { Prize } from '../types/prize';
import type { DrawConfig } from '../types/draw';
import type { ValidationResult, ValidationError } from '../types/result';
import { DrawErrorCode } from '../types/result';
import { DRAW_CONFIG } from '../config/drawConfig';
import { isValidWeight } from '../utils/math';

/**
 * Validation engine for the Lucky Draw system.
 * Ensures all prizes and draw configurations meet business rules before execution.
 * 
 * SOLID: Single Responsibility — validates data integrity.
 */
export class Validation {
  /**
   * Validate a single prize entry.
   */
  validatePrize(prize: Prize): ValidationResult {
    const errors: ValidationError[] = [];

    // Check for empty ID
    if (!prize.id || prize.id.trim().length === 0) {
      errors.push({
        field: 'id',
        message: 'Prize ID cannot be empty',
        code: DrawErrorCode.DUPLICATE_ID,
      });
    }

    // Check for empty name
    if (!prize.name || prize.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Prize name cannot be empty',
        code: DrawErrorCode.INTERNAL_ERROR,
      });
    }

    // Check for negative stock
    if (prize.stock < 0) {
      errors.push({
        field: 'stock',
        message: `Prize "${prize.id}" has negative stock: ${prize.stock}`,
        code: DrawErrorCode.NEGATIVE_STOCK,
      });
    }

    // Check for zero stock (disabled)
    if (prize.stock === 0) {
      errors.push({
        field: 'stock',
        message: `Prize "${prize.id}" has zero stock and cannot be selected`,
        code: DrawErrorCode.INSUFFICIENT_STOCK,
      });
    }

    // Check if prize is disabled
    if (!prize.enabled) {
      errors.push({
        field: 'enabled',
        message: `Prize "${prize.id}" is disabled`,
        code: DrawErrorCode.PRIZE_DISABLED,
      });
    }

    // Check for invalid weight
    if (!isValidWeight(prize.weight)) {
      errors.push({
        field: 'weight',
        message: `Prize "${prize.id}" has invalid weight: ${prize.weight}. Must be a positive number.`,
        code: DrawErrorCode.INVALID_WEIGHT,
      });
    }

    // Check weight bounds
    if (prize.weight < DRAW_CONFIG.minWeight) {
      errors.push({
        field: 'weight',
        message: `Prize "${prize.id}" weight ${prize.weight} is below minimum ${DRAW_CONFIG.minWeight}`,
        code: DrawErrorCode.INVALID_WEIGHT,
      });
    }

    if (prize.weight > DRAW_CONFIG.maxWeight) {
      errors.push({
        field: 'weight',
        message: `Prize "${prize.id}" weight ${prize.weight} exceeds maximum ${DRAW_CONFIG.maxWeight}`,
        code: DrawErrorCode.INVALID_WEIGHT,
      });
    }

    // Check daily winner limit
    if (prize.maxDailyWinner > 0 && prize.dailyWinnerCount >= prize.maxDailyWinner) {
      errors.push({
        field: 'dailyWinnerCount',
        message: `Prize "${prize.id}" has reached its daily winner limit (${prize.maxDailyWinner})`,
        code: DrawErrorCode.MAX_WINNERS_REACHED,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a collection of prizes.
   * Checks for duplicate IDs and validates each prize individually.
   */
  validatePrizePool(prizes: Prize[]): ValidationResult {
    const errors: ValidationError[] = [];

    if (prizes.length === 0) {
      errors.push({
        field: 'prizes',
        message: 'Prize pool is empty. No prizes available for drawing.',
        code: DrawErrorCode.NO_PRIZES,
      });
      return { valid: false, errors };
    }

    if (prizes.length > DRAW_CONFIG.maxPrizePoolSize) {
      errors.push({
        field: 'prizes',
        message: `Prize pool exceeds maximum size of ${DRAW_CONFIG.maxPrizePoolSize}`,
        code: DrawErrorCode.INTERNAL_ERROR,
      });
    }

    // Check for duplicate IDs
    const ids = new Set<string>();
    for (const prize of prizes) {
      if (ids.has(prize.id)) {
        errors.push({
          field: 'id',
          message: `Duplicate prize ID: "${prize.id}"`,
          code: DrawErrorCode.DUPLICATE_ID,
        });
      }
      ids.add(prize.id);

      // Validate individual prize
      const prizeResult = this.validatePrize(prize);
      errors.push(...prizeResult.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a draw configuration.
   */
  validateDrawConfig(config: DrawConfig): ValidationResult {
    const errors: ValidationError[] = [];

    if (!config.id || config.id.trim().length === 0) {
      errors.push({
        field: 'id',
        message: 'Draw config ID cannot be empty',
        code: DrawErrorCode.DUPLICATE_ID,
      });
    }

    if (!config.active) {
      errors.push({
        field: 'active',
        message: `Draw "${config.id}" is not active`,
        code: DrawErrorCode.DRAW_INACTIVE,
      });
    }

    if (config.prizeIds.length === 0) {
      errors.push({
        field: 'prizeIds',
        message: `Draw "${config.id}" has no prizes configured`,
        code: DrawErrorCode.NO_PRIZES,
      });
    }

    // Check expiration
    if (config.endTime) {
      const endDate = new Date(config.endTime);
      if (endDate < new Date()) {
        errors.push({
          field: 'endTime',
          message: `Draw "${config.id}" has expired (ended ${config.endTime})`,
          code: DrawErrorCode.EXPIRED_DRAW,
        });
      }
    }

    // Check max winners
    if (config.maxWinners > 0 && config.winnerCount >= config.maxWinners) {
      errors.push({
        field: 'winnerCount',
        message: `Draw "${config.id}" has reached its maximum winner count (${config.maxWinners})`,
        code: DrawErrorCode.MAX_WINNERS_REACHED,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Filter prizes to only include eligible ones.
   * Returns prizes that pass all validation checks.
   */
  getEligiblePrizes(prizes: Prize[]): Prize[] {
    return prizes.filter((prize) => {
      const result = this.validatePrize(prize);
      return result.valid;
    });
  }
}