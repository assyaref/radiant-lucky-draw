/**
 * DrawEngine Simulation Test (RC2.4)
 *
 * Runs 1000 simulated draws through the DrawEngineService and verifies:
 * - Weighted probability distribution (Common > Rare > Epic > Grand)
 * - No duplicate winners
 * - No negative stock
 * - Correct statistics (Prize Remaining, Total Winners, Grand Prize Remaining, Draw Count)
 *
 * This test exercises the DrawEngine as the ONLY source of winner selection.
 * No Math.random() is used in the test harness itself.
 */
import { describe, it, expect } from 'vitest';
import { createDrawEngineService } from '../service/DrawEngineService';
import type { TVParticipant, TVPrize } from '../../types/live-tv';
import { PrizeTier } from '../types/prize';

// ─── Test Fixtures ──────────────────────────────────────────────────────

/** Prize pool covering Common, Rare, Epic, and Grand Prize tiers. */
const TEST_PRIZES: TVPrize[] = [
  { id: 'grand', name: 'Grand Prize', value: '$5,000', icon: '👑', color: '#fbbf24' },
  { id: 'epic', name: 'Epic Smartphone', value: '$1,200', icon: '💎', color: '#60a5fa' },
  { id: 'rare', name: 'Rare Smartwatch', value: '$800', icon: '✨', color: '#34d399' },
  { id: 'common', name: 'Common Gift Card', value: '$100', icon: '🎁', color: '#f472b6' },
];

/** Number of simulated draws to run. */
const SIMULATION_COUNT = 1000;

/** Stock applied to every prize so all 1000 draws can succeed. */
const SIMULATION_STOCK = SIMULATION_COUNT;

/** Generate a unique participant for each draw. */
function makeParticipant(index: number): TVParticipant {
  return {
    id: `p-${index}`,
    number: String(index + 1).padStart(4, '0'),
    fullName: `Participant ${index}`,
    company: 'Test Corp',
    phone: '0812-0000-0000',
    email: `p${index}@test.com`,
  };
}

/** Build a valid active draw config for the simulation. */
function makeDrawConfig(id: string, name: string, active = true) {
  return {
    id,
    name,
    description: `${name} draw`,
    active,
    prizeIds: TEST_PRIZES.map((p) => p.id),
    maxWinners: 0,
    winnerCount: 0,
    startTime: null,
    endTime: null,
    minTier: null,
  };
}

/** Resolve the engine tier from a prize name (mirrors DrawEngineService.resolveTier). */
function resolveTierFromName(name: string): PrizeTier {
  const lower = name.toLowerCase();
  if (lower.includes('grand')) return PrizeTier.GRAND;
  if (lower.includes('epic')) return PrizeTier.VERY_RARE;
  if (lower.includes('rare')) return PrizeTier.RARE;
  if (lower.includes('common')) return PrizeTier.COMMON;
  return PrizeTier.NORMAL;
}

// ─── Simulation ─────────────────────────────────────────────────────────

describe('DrawEngineService 1000-draw simulation (RC2.4)', () => {
  it('runs 1000 draws with correct weighted probability, no duplicates, no negative stock', () => {
    const service = createDrawEngineService({ emit: () => {} });
    service.registerPrizes(TEST_PRIZES, SIMULATION_STOCK);
    expect(service.startSession(makeDrawConfig('simulation', 'Simulation Draw'))).toBe(true);

    const winnersByTier: Record<string, number> = {};
    let successfulDraws = 0;
    let failedDraws = 0;

    for (let i = 0; i < SIMULATION_COUNT; i++) {
      const participant = makeParticipant(i);
      service.registerParticipant(participant);

      const result = service.executeDraw(participant);

      if (result.success && result.prize) {
        successfulDraws++;
        const tier = resolveTierFromName(result.prize.name);
        winnersByTier[tier] = (winnersByTier[tier] ?? 0) + 1;
      } else {
        failedDraws++;
      }
    }

    // All 1000 draws should succeed given sufficient stock.
    expect(successfulDraws).toBe(SIMULATION_COUNT);
    expect(failedDraws).toBe(0);

    const commonCount = winnersByTier[PrizeTier.COMMON] ?? 0;
    const rareCount = winnersByTier[PrizeTier.RARE] ?? 0;
    const epicCount = winnersByTier[PrizeTier.VERY_RARE] ?? 0;
    const grandCount = winnersByTier[PrizeTier.GRAND] ?? 0;

    // Weighted probability: Common (weight 80) most frequent.
    expect(commonCount).toBeGreaterThan(rareCount);
    expect(commonCount).toBeGreaterThan(epicCount);
    expect(commonCount).toBeGreaterThan(grandCount);

    // Grand (weight 0.5) rarest.
    expect(grandCount).toBeLessThan(rareCount);
    expect(grandCount).toBeLessThan(epicCount);

    // Every tier represented across 1000 draws.
    expect(commonCount).toBeGreaterThan(0);
    expect(rareCount).toBeGreaterThan(0);
    expect(epicCount).toBeGreaterThan(0);
    expect(grandCount).toBeGreaterThan(0);

    // Winners by tier sum equals total winners.
    const totalByTier = Object.values(winnersByTier).reduce((a, b) => a + b, 0);
    expect(totalByTier).toBe(SIMULATION_COUNT);

    // No negative stock and correct statistics.
    const stats = service.getStatistics();
    for (const remaining of Object.values(stats.prizeRemaining)) {
      expect(remaining).toBeGreaterThanOrEqual(0);
    }
    expect(stats.grandPrizeRemaining).toBeGreaterThanOrEqual(0);
    expect(stats.drawCount).toBe(SIMULATION_COUNT);
    expect(stats.totalWinners).toBe(SIMULATION_COUNT);
  });

  it('prevents duplicate winners for the same participant', () => {
    const service = createDrawEngineService({ emit: () => {} });
    service.registerPrizes(TEST_PRIZES);
    service.startSession(makeDrawConfig('dup-test', 'Duplicate Test'));

    const participant = makeParticipant(0);
    service.registerParticipant(participant);

    // First draw succeeds.
    const first = service.executeDraw(participant);
    expect(first.success).toBe(true);

    // Second draw for the same participant must be rejected.
    const second = service.executeDraw(participant);
    expect(second.success).toBe(false);
    expect(second.code).toBe('DUPLICATE_WINNER');
  });

  it('rejects unregistered participants', () => {
    const service = createDrawEngineService({ emit: () => {} });
    service.registerPrizes(TEST_PRIZES);
    service.startSession(makeDrawConfig('reg-test', 'Registration Test'));

    // Do not register the participant.
    const participant = makeParticipant(999);
    const result = service.executeDraw(participant);
    expect(result.success).toBe(false);
    expect(result.code).toBe('PARTICIPANT_NOT_REGISTERED');
  });

  it('rejects draws when the session is inactive', () => {
    const service = createDrawEngineService({ emit: () => {} });
    service.registerPrizes(TEST_PRIZES);
    service.startSession(makeDrawConfig('inactive-test', 'Inactive Test', false));

    const participant = makeParticipant(0);
    service.registerParticipant(participant);
    const result = service.executeDraw(participant);
    expect(result.success).toBe(false);
    expect(result.code).toBe('DRAW_INACTIVE');
  });
});
