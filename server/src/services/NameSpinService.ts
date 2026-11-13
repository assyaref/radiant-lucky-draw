/**
 * Name Spin Service
 *
 * Quick prize draw from a list of names typed/pasted by the operator
 * (independent from booth registration). The server picks the winner with a
 * cryptographically secure RNG — never in the browser — and broadcasts the
 * spin to every Monitor over Supabase Realtime (`namespin:started`), where it
 * is shown on the name wheel.
 *
 * By design nothing is stored: no winner record, no stock change. A prize may
 * be referenced by id only to show its name/image (read-only).
 */

import { randomInt, randomUUID } from 'crypto';
import { PrizeRepository } from '../repositories';
import { RealtimeService, NAME_SPIN_EVENTS } from '../realtime';
import { ValidationError, NotFoundError } from '../utils';
import { cleanNames, sampleForWheel } from '../utils/names';

export interface NameSpinRequest {
  names: string[];
  prizeId?: string;
  prizeName?: string;
  title?: string;
}

export interface NameSpinResult {
  spinId: string;
  winnerName: string;
  winnerIndex: number;
  totalNames: number;
  prizeName: string | null;
  prizeImageUrl: string | null;
  prizeTier: string | null;
  title: string | null;
  /**
   * Wheel segments — the same sample the idle wheel shows (see MonitorService),
   * guaranteed to contain the winner at `winnerSegment`.
   */
  segments: string[];
  winnerSegment: number;
  durationMs: number;
  revealHoldMs: number;
  startedAt: string;
}

const SPIN_DURATION_MS = 9000;
const REVEAL_HOLD_MS = 12000;

export class NameSpinService {
  constructor(
    private prizeRepository: PrizeRepository,
    private realtimeService: RealtimeService,
  ) {}

  async spin(data: NameSpinRequest): Promise<NameSpinResult> {
    const names = cleanNames(data.names);
    if (names.length < 2) throw new ValidationError('Masukkan minimal 2 nama yang berbeda');

    let prizeName = data.prizeName?.trim() || null;
    let prizeImageUrl: string | null = null;
    let prizeTier: string | null = null;
    if (data.prizeId) {
      const prize = await this.prizeRepository.findById(data.prizeId);
      if (!prize) throw new NotFoundError('Prize', data.prizeId);
      prizeName = prize.name;
      prizeImageUrl = prize.imageUrl ?? null;
      prizeTier = prize.tier ?? null;
    }

    const winnerIndex = randomInt(names.length);
    const winnerName = names[winnerIndex];

    // Wheel: same sample as the idle wheel; make sure the winner is on it.
    const segments = sampleForWheel(names);
    let winnerSegment = segments.indexOf(winnerName);
    if (winnerSegment < 0) {
      winnerSegment = randomInt(segments.length);
      segments[winnerSegment] = winnerName;
    }

    const result: NameSpinResult = {
      spinId: randomUUID(),
      winnerName,
      winnerIndex,
      totalNames: names.length,
      prizeName,
      prizeImageUrl,
      prizeTier,
      title: data.title?.trim() || null,
      segments,
      winnerSegment,
      durationMs: SPIN_DURATION_MS,
      revealHoldMs: REVEAL_HOLD_MS,
      startedAt: new Date().toISOString(),
    };

    await this.realtimeService.broadcastNow(NAME_SPIN_EVENTS.STARTED, { ...result });
    return result;
  }

  /** @see cleanNames */
  static cleanNames(input: string[]): string[] {
    return cleanNames(input);
  }
}
