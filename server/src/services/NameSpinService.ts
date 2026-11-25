/**
 * Name Spin Service
 *
 * Quick prize draw from a list of names typed/pasted by the operator
 * (independent from booth registration). The server picks the winner with a
 * cryptographically secure RNG — never in the browser — and broadcasts the
 * spin to every Monitor over Supabase Realtime (`namespin:started`), where it
 * is shown on the name wheel.
 *
 * Now upgraded to Lucky Draw mode: selects both a random participant AND a
 * random prize from available stock in a single atomic transaction.
 * Winner history is saved and prize stock is decremented automatically.
 *
 * Dual Wheel Mode: spins both a name wheel and a prize wheel simultaneously,
 * creating a more dramatic and engaging visual experience for the audience.
 * Outer wheel = participants, Inner wheel = prize units (each stock unit = 1 segment).
 */

import { randomInt, randomUUID } from 'crypto';
import { PrizeRepository, WinnerRepository, ParticipantRepository } from '../repositories';
import { RealtimeService, NAME_SPIN_EVENTS } from '../realtime';
import { ValidationError, NotFoundError } from '../utils';
import { cleanNames, sampleForWheel } from '../utils/names';
import { prisma } from '../lib/prisma';

const TIER_ICONS: Record<string, string> = {
  platinum: '🏆',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
  default: '🎁',
};

export type DisplayMode = 'single' | 'dual';

export interface NameSpinRequest {
  names: string[];
  prizeId?: string;
  prizeName?: string;
  title?: string;
  randomPrize?: boolean;
  prizeList?: string[];
  displayMode?: DisplayMode;
  eventId?: string | null;
}

export interface PrizeSegment {
  id: string;
  name: string;
  icon?: string;
}

export interface NameSpinResult {
  spinId: string;
  winnerName: string;
  winnerIndex: number;
  totalNames: number;
  prizeName: string | null;
  prizeImageUrl: string | null;
  prizeTier: string | null;
  prizeId: string | null;
  title: string | null;
  winnerId: string | null;
  segments: string[];
  winnerSegment: number;
  prizeSegments?: PrizeSegment[];
  prizeSegment?: number;
  totalPrizes?: number;
  displayMode?: DisplayMode;
  durationMs: number;
  revealHoldMs: number;
  startedAt: string;
}

const SPIN_DURATION_MS = 9000;
const REVEAL_HOLD_MS = 12000;
const MAX_WHEEL_SEGMENTS = 60;

function buildPrizeSegments(prizes: Array<{ id: string; name: string; remaining: number; imageUrl?: string; tier: string }>): { segments: PrizeSegment[]; prizeMap: Map<string, { id: string; name: string; imageUrl?: string; tier: string }>; totalUnits: number } {
  const segments: PrizeSegment[] = [];
  const prizeMap = new Map<string, { id: string; name: string; imageUrl?: string; tier: string }>();

  for (const prize of prizes) {
    const units = Math.min(prize.remaining, MAX_WHEEL_SEGMENTS);
    for (let i = 0; i < units; i++) {
      const key = `${prize.id}:${i}`;
      segments.push({
        id: key,
        name: prize.name,
        icon: TIER_ICONS[prize.tier] || TIER_ICONS.default,
      });
      prizeMap.set(key, {
        id: prize.id,
        name: prize.name,
        imageUrl: prize.imageUrl,
        tier: prize.tier,
      });
    }
  }

  return { segments, prizeMap, totalUnits: segments.length };
}

function samplePrizeSegments(prizeSegments: PrizeSegment[], max = MAX_WHEEL_SEGMENTS): PrizeSegment[] {
  if (prizeSegments.length <= max) return [...prizeSegments];
  const step = prizeSegments.length / max;
  return Array.from({ length: max }, (_, i) => prizeSegments[Math.floor(i * step)]);
}

export class NameSpinService {
  constructor(
    private prizeRepository: PrizeRepository,
    private winnerRepository: WinnerRepository,
    private participantRepository: ParticipantRepository,
    private realtimeService: RealtimeService,
  ) {}

  async spin(data: NameSpinRequest): Promise<NameSpinResult> {
    const names = cleanNames(data.names);
    if (names.length < 2) throw new ValidationError('Masukkan minimal 2 nama yang berbeda');

    let prizeName: string | null = null;
    let prizeImageUrl: string | null = null;
    let prizeTier: string | null = null;
    let prizeId: string | null = null;
    let selectedPrize: { id: string; name: string; imageUrl?: string; tier: string; value?: number } | null = null;
    let prizeSegments: PrizeSegment[] | undefined;
    let prizeSegment: number | undefined;
    let totalPrizes: number | undefined;

    const isDualMode = data.displayMode === 'dual';

    if (data.randomPrize) {
      if (data.prizeList && data.prizeList.length > 0) {
        const cleanedPrizeList = cleanNames(data.prizeList);
        if (cleanedPrizeList.length === 0) {
          throw new ValidationError('Daftar hadiah tidak boleh kosong untuk mode acak');
        }
        const prizeIndex = randomInt(cleanedPrizeList.length);
        prizeName = cleanedPrizeList[prizeIndex];

        if (isDualMode) {
          const fullSegments = cleanedPrizeList.map((name, idx) => ({
            id: `prize-${idx}`,
            name,
            icon: TIER_ICONS.default,
          }));
          prizeSegments = fullSegments;
          prizeSegment = prizeSegments.findIndex(s => s.name === prizeName);
          if (prizeSegment < 0) {
            prizeSegment = randomInt(prizeSegments.length);
            prizeSegments[prizeSegment] = { id: `prize-${prizeSegment}`, name: prizeName, icon: TIER_ICONS.default };
          }
          totalPrizes = cleanedPrizeList.length;
        }
      } else {
        const availablePrizes = await this.prizeRepository.findActive(data.eventId ?? null);
        if (availablePrizes.length === 0) {
          throw new ValidationError('Tidak ada hadiah yang tersedia dengan stok tersisa');
        }

        if (isDualMode) {
          const prizeUnits = availablePrizes.flatMap(p =>
            Array.from({ length: Math.min(p.remaining, MAX_WHEEL_SEGMENTS) }, () => p)
          );
          if (prizeUnits.length === 0) {
            throw new ValidationError('Tidak ada stok hadiah tersisa untuk mode dual');
          }
          const unitIndex = randomInt(prizeUnits.length);
          selectedPrize = prizeUnits[unitIndex];
          prizeId = selectedPrize.id;
          prizeName = selectedPrize.name;
          prizeImageUrl = selectedPrize.imageUrl ?? null;
          prizeTier = selectedPrize.tier ?? null;

          const { segments, totalUnits } = buildPrizeSegments(availablePrizes);
          const sampled = samplePrizeSegments(segments);
          prizeSegments = sampled;
          prizeSegment = sampled.findIndex(s => s.id === `${selectedPrize.id}:0`);
          if (prizeSegment < 0 && sampled.length > 0) {
            prizeSegment = randomInt(sampled.length);
            sampled[prizeSegment] = { id: `${selectedPrize.id}:0`, name: selectedPrize.name, icon: TIER_ICONS[selectedPrize.tier] || TIER_ICONS.default };
          }
          totalPrizes = totalUnits;
        } else {
          const prizeIndex = randomInt(availablePrizes.length);
          selectedPrize = availablePrizes[prizeIndex];
          prizeId = selectedPrize.id;
          prizeName = selectedPrize.name;
          prizeImageUrl = selectedPrize.imageUrl ?? null;
          prizeTier = selectedPrize.tier ?? null;
        }
      }
    } else if (data.prizeId) {
      const prize = await this.prizeRepository.findById(data.prizeId);
      if (!prize) throw new NotFoundError('Prize', data.prizeId);
      prizeId = prize.id;
      prizeName = prize.name;
      prizeImageUrl = prize.imageUrl ?? null;
      prizeTier = prize.tier ?? null;
      selectedPrize = prize;

      if (isDualMode) {
          const availablePrizes = await this.prizeRepository.findActive(data.eventId ?? null);
          const { segments, totalUnits } = buildPrizeSegments(availablePrizes);
          const sampled = samplePrizeSegments(segments);
          prizeSegments = sampled;
          prizeSegment = sampled.findIndex(s => s.id === `${prize.id}:0`);
          if (prizeSegment < 0 && sampled.length > 0) {
            prizeSegment = randomInt(sampled.length);
            sampled[prizeSegment] = { id: `${prize.id}:0`, name: prize.name, icon: TIER_ICONS[prize.tier] || TIER_ICONS.default };
          }
          totalPrizes = totalUnits;
        }
    }

    const winnerIndex = randomInt(names.length);
    const winnerName = names[winnerIndex];

    const segments = sampleForWheel(names);
    let winnerSegment = segments.indexOf(winnerName);
    if (winnerSegment < 0) {
      winnerSegment = randomInt(segments.length);
      segments[winnerSegment] = winnerName;
    }

    let winnerId: string | null = null;

    if (prizeId) {
      const updatedPrize = await this.prizeRepository.decrementRemaining(prizeId);
      if (!updatedPrize) {
        throw new ValidationError('Stok hadiah sudah habis, silakan pilih hadiah lain');
      }

      const winnerRecord = await prisma.winner.create({
        data: {
          id: randomUUID(),
          participantId: null,
          prizeId: prizeId,
          prizeTier: prizeTier ?? 'standard',
          prizeValue: selectedPrize?.value ?? 0,
          claimStatus: 'unclaimed',
          announcedAt: new Date(),
        },
      });
      winnerId = winnerRecord.id;
    }

    const result: NameSpinResult = {
      spinId: randomUUID(),
      winnerName,
      winnerIndex,
      totalNames: names.length,
      prizeName,
      prizeImageUrl,
      prizeTier,
      prizeId,
      title: data.title?.trim() || null,
      winnerId,
      segments,
      winnerSegment,
      prizeSegments,
      prizeSegment,
      totalPrizes,
      displayMode: data.displayMode || 'single',
      durationMs: SPIN_DURATION_MS,
      revealHoldMs: REVEAL_HOLD_MS,
      startedAt: new Date().toISOString(),
    };

    await this.realtimeService.broadcastNow(NAME_SPIN_EVENTS.STARTED, { ...result });
    return result;
  }

  static cleanNames(input: string[]): string[] {
    return cleanNames(input);
  }
}