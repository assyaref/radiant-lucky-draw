/**
 * DrawEngineService
 *
 * Enterprise integration layer that connects the DrawEngine to the Live TV flow.
 * This is the ONLY source of winner selection in the system.
 *
 * Responsibilities:
 * - Register prizes (mapped from TV prize pool to engine Prize model)
 * - Validate participants (exists, not already won)
 * - Validate prize availability (in stock, enabled)
 * - Validate draw is active
 * - Execute draws via the DrawEngine (weighted probability)
 * - Prevent duplicate winners
 * - Track statistics (Prize Remaining, Total Winners, Grand Prize Remaining, Draw Count)
 * - Emit socket events (draw:started, draw:spinning, draw:winner, draw:completed)
 *
 * All randomness is delegated to the DrawEngine. No Math.random() in the UI layer.
 */

import { DrawEngine } from '../draw/DrawEngine';
import type { Prize } from '../types/prize';
import { PrizeTier } from '../types/prize';
import type { DrawConfig } from '../types/draw';
import type { DrawResult } from '../types/result';
import { DrawErrorCode } from '../types/result';
import type { TVParticipant, TVPrize } from '../../types/live-tv';
import { SOCKET_EVENTS } from '../../services/socket/types';

// ─── Types ──────────────────────────────────────────────────────────────

/** Validation result for a draw attempt */
export interface DrawValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

/** Statistics tracked by the service */
export interface DrawStatistics {
  /** Total number of draws executed */
  drawCount: number;
  /** Total number of winners */
  totalWinners: number;
  /** Remaining stock per prize */
  prizeRemaining: Record<string, number>;
  /** Remaining stock of grand prize tier prizes */
  grandPrizeRemaining: number;
  /** Winners grouped by prize tier */
  winnersByTier: Record<string, number>;
}

/** Result of a full draw lifecycle */
export interface DrawLifecycleResult {
  success: boolean;
  participant: TVParticipant | null;
  prize: TVPrize | null;
  drawResult: DrawResult | null;
  error?: string;
  code?: string;
}

/** Socket event emitter abstraction (decouples from concrete socket impl) */
export interface DrawEventEmitter {
  emit: (event: string, payload: unknown) => void;
}

// ─── Prize Mapping ──────────────────────────────────────────────────────

/** Default weight per tier for TV prizes */
const TV_TIER_WEIGHTS: Record<string, number> = {
  grand: 0.5,
  rare: 3,
  epic: 1,
  common: 80,
};

/** Map a TV prize to an engine Prize */
function mapTVPrizeToEnginePrize(tvPrize: TVPrize, index: number, stock: number): Prize {
  const tier = resolveTier(tvPrize);
  return {
    id: tvPrize.id,
    name: tvPrize.name,
    description: tvPrize.name,
    tier,
    image: '',
    color: tvPrize.color,
    weight: TV_TIER_WEIGHTS[tier] ?? 15,
    stock,
    maxDailyWinner: 0,
    enabled: true,
    displayOrder: index + 1,
    dailyWinnerCount: 0,
  };
}

/** Resolve the engine tier from a TV prize name */
function resolveTier(tvPrize: TVPrize): PrizeTier {
  const name = tvPrize.name.toLowerCase();
  if (name.includes('grand')) return PrizeTier.GRAND;
  if (name.includes('epic')) return PrizeTier.VERY_RARE;
  if (name.includes('rare')) return PrizeTier.RARE;
  if (name.includes('common')) return PrizeTier.COMMON;
  return PrizeTier.NORMAL;
}

// ─── DrawEngineService ──────────────────────────────────────────────────

export class DrawEngineService {
  private engine: DrawEngine;
  private emitter: DrawEventEmitter | null;
  private drawConfig: DrawConfig | null = null;

  // Participant tracking (prevents duplicate winners)
  private registeredParticipants: Set<string> = new Set();
  private winningParticipants: Set<string> = new Set();

  // Statistics
  private statistics: DrawStatistics = {
    drawCount: 0,
    totalWinners: 0,
    prizeRemaining: {},
    grandPrizeRemaining: 0,
    winnersByTier: {},
  };

  constructor(emitter?: DrawEventEmitter) {
    this.emitter = emitter ?? null;
    this.engine = new DrawEngine({
      onDrawStart: (drawId) => {
        this.emit(SOCKET_EVENTS.DRAW_STARTED, {
          drawId,
          timestamp: new Date().toISOString(),
        });
      },
      onPrizeSelected: (prize, probability) => {
        this.emit(SOCKET_EVENTS.DRAW_SPINNING, {
          drawId: this.drawConfig?.id ?? 'unknown',
          prizeName: prize.name,
          probability,
          timestamp: new Date().toISOString(),
        });
      },
      onDrawComplete: (result) => {
        this.emit(SOCKET_EVENTS.DRAW_COMPLETED, {
          drawId: result.drawId,
          timestamp: new Date().toISOString(),
        });
      },
      onDrawError: (error, code) => {
        this.emit(SOCKET_EVENTS.DRAW_COMPLETED, {
          drawId: this.drawConfig?.id ?? 'unknown',
          error,
          code,
          timestamp: new Date().toISOString(),
        });
      },
    });
  }

  // ─── Configuration ────────────────────────────────────────────────────

  /**
   * Register the prize pool for the draw.
   * Maps TV prizes to engine prizes and registers them with the DrawEngine.
   *
   * @param tvPrizes The TV prize pool to register.
   * @param stock Optional stock count applied to every prize (defaults to 1).
   *              Used by simulations to run many draws against a single pool.
   */
  registerPrizes(tvPrizes: TVPrize[], stock = 1): void {
    const enginePrizes = tvPrizes.map((prize, index) =>
      mapTVPrizeToEnginePrize(prize, index, stock),
    );
    this.engine.registerPrizes(enginePrizes);

    // Initialize statistics
    this.statistics.prizeRemaining = {};
    this.statistics.grandPrizeRemaining = 0;
    for (const prize of enginePrizes) {
      this.statistics.prizeRemaining[prize.id] = prize.stock;
      if (prize.tier === PrizeTier.GRAND) {
        this.statistics.grandPrizeRemaining += prize.stock;
      }
    }
  }

  /**
   * Start a draw session.
   * Validates that the draw is active before accepting.
   *
   * The config is recorded even when inactive so that executeDraw() can
   * reject draws against an inactive session (DRAW_INACTIVE).
   */
  startSession(config: DrawConfig): boolean {
    const validation = this.validateDrawConfig(config);
    if (!validation.valid) {
      return false;
    }
    this.drawConfig = config;
    this.engine.startSession(config);
    return true;
  }

  /**
   * Register a participant as eligible for the draw.
   * Prevents duplicate registration.
   */
  registerParticipant(participant: TVParticipant): void {
    this.registeredParticipants.add(participant.id);
  }

  /**
   * Check if a participant has already won.
   */
  hasParticipantWon(participantId: string): boolean {
    return this.winningParticipants.has(participantId);
  }

  // ─── Draw Lifecycle ───────────────────────────────────────────────────

  /**
   * Execute a full draw lifecycle for a participant.
   *
   * Flow:
   * 1. Validate participant exists
   * 2. Validate participant has not already won
   * 3. Validate draw is active
   * 4. Validate prize availability (handled by DrawEngine)
   * 5. Execute weighted draw via DrawEngine
   * 6. Emit draw:winner event
   * 7. Update statistics
   *
   * @returns DrawLifecycleResult
   */
  executeDraw(participant: TVParticipant): DrawLifecycleResult {
    // Step 1: Validate participant exists
    const participantValidation = this.validateParticipant(participant);
    if (!participantValidation.valid) {
      return {
        success: false,
        participant,
        prize: null,
        drawResult: null,
        error: participantValidation.error,
        code: participantValidation.code,
      };
    }

    // Step 2: Validate draw is active (a draw requires an active session)
    if (!this.drawConfig || !this.drawConfig.active) {
      return {
        success: false,
        participant,
        prize: null,
        drawResult: null,
        error: 'Draw is not active',
        code: DrawErrorCode.DRAW_INACTIVE,
      };
    }

    // Step 3: Execute the draw via DrawEngine (handles prize availability & stock)
    const result = this.engine.draw();

    if (!result.success || !result.prize) {
      return {
        success: false,
        participant,
        prize: null,
        drawResult: result,
        error: result.error ?? 'Draw failed',
        code: DrawErrorCode.INTERNAL_ERROR,
      };
    }

    // Step 4: Mark participant as winner (prevent duplicates)
    this.winningParticipants.add(participant.id);

    // Step 5: Update statistics
    this.updateStatistics(result);

    // Step 6: Emit draw:winner event
    this.emit(SOCKET_EVENTS.DRAW_WINNER, {
      drawId: result.drawId,
      winner: {
        id: participant.id,
        name: participant.fullName,
        number: participant.number,
        company: participant.company,
      },
      prize: {
        id: result.prize.id,
        name: result.prize.name,
        tier: result.prize.tier,
        probability: result.probability,
      },
      timestamp: new Date().toISOString(),
    });

    // Map engine prize back to TV prize for the UI
    const tvPrize: TVPrize = {
      id: result.prize.id,
      name: result.prize.name,
      value: this.formatPrizeValue(result.prize.name),
      icon: this.getPrizeIcon(result.prize.tier),
      color: result.prize.color,
    };

    return {
      success: true,
      participant,
      prize: tvPrize,
      drawResult: result,
    };
  }

  // ─── Validation ───────────────────────────────────────────────────────

  /**
   * Validate that a participant can enter the draw.
   * Rules:
   * - Participant exists (registered)
   * - Participant has not already won
   */
  validateParticipant(participant: TVParticipant): DrawValidationResult {
    if (!participant || !participant.id) {
      return {
        valid: false,
        error: 'Participant does not exist',
        code: 'PARTICIPANT_NOT_FOUND',
      };
    }

    if (!this.registeredParticipants.has(participant.id)) {
      return {
        valid: false,
        error: 'Participant is not registered for this draw',
        code: 'PARTICIPANT_NOT_REGISTERED',
      };
    }

    if (this.winningParticipants.has(participant.id)) {
      return {
        valid: false,
        error: 'Participant has already won a prize',
        code: 'DUPLICATE_WINNER',
      };
    }

    return { valid: true };
  }

  /**
   * Validate that a draw configuration is active and valid.
   */
  validateDrawConfig(config: DrawConfig): DrawValidationResult {
    if (!config) {
      return {
        valid: false,
        error: 'Draw configuration is missing',
        code: DrawErrorCode.DRAW_INACTIVE,
      };
    }

    if (!config.active) {
      return {
        valid: false,
        error: 'Draw is not active',
        code: DrawErrorCode.DRAW_INACTIVE,
      };
    }

    if (config.prizeIds.length === 0) {
      return {
        valid: false,
        error: 'Draw has no prizes configured',
        code: DrawErrorCode.NO_PRIZES,
      };
    }

    return { valid: true };
  }

  // ─── Statistics ───────────────────────────────────────────────────────

  /**
   * Get the current draw statistics.
   */
  getStatistics(): DrawStatistics {
    return { ...this.statistics, prizeRemaining: { ...this.statistics.prizeRemaining } };
  }

  /**
   * Get the underlying DrawEngine (for advanced use / testing).
   */
  getEngine(): DrawEngine {
    return this.engine;
  }

  /**
   * Reset the service to its initial state.
   */
  reset(): void {
    this.engine.reset();
    this.registeredParticipants.clear();
    this.winningParticipants.clear();
    this.drawConfig = null;
    this.statistics = {
      drawCount: 0,
      totalWinners: 0,
      prizeRemaining: {},
      grandPrizeRemaining: 0,
      winnersByTier: {},
    };
  }

  // ─── Private ──────────────────────────────────────────────────────────

  /** Update statistics after a successful draw */
  private updateStatistics(result: DrawResult): void {
    this.statistics.drawCount++;
    this.statistics.totalWinners++;

    const prizeId = result.prize.id;
    const current = this.statistics.prizeRemaining[prizeId] ?? 0;
    this.statistics.prizeRemaining[prizeId] = Math.max(0, current - 1);

    if (result.prize.tier === PrizeTier.GRAND) {
      this.statistics.grandPrizeRemaining = Math.max(0, this.statistics.grandPrizeRemaining - 1);
    }

    this.statistics.winnersByTier[result.prize.tier] =
      (this.statistics.winnersByTier[result.prize.tier] ?? 0) + 1;
  }

  /** Emit a socket event if an emitter is configured */
  private emit(event: string, payload: unknown): void {
    if (this.emitter) {
      this.emitter.emit(event, payload);
    }
  }

  /** Format a prize value string for display */
  private formatPrizeValue(name: string): string {
    if (name.toLowerCase().includes('grand')) return '$5,000';
    if (name.toLowerCase().includes('phone')) return '$1,200';
    if (name.toLowerCase().includes('watch')) return '$800';
    if (name.toLowerCase().includes('headphone')) return '$350';
    return '$100';
  }

  /** Get an icon for a prize tier */
  private getPrizeIcon(tier: PrizeTier): string {
    switch (tier) {
      case PrizeTier.GRAND:
        return '👑';
      case PrizeTier.VERY_RARE:
        return '💎';
      case PrizeTier.RARE:
        return '✨';
      case PrizeTier.NORMAL:
        return '🎁';
      default:
        return '🎉';
    }
  }
}

// ─── Factory ────────────────────────────────────────────────────────────

/**
 * Create a DrawEngineService with sensible defaults.
 */
export function createDrawEngineService(emitter?: DrawEventEmitter): DrawEngineService {
  return new DrawEngineService(emitter);
}
