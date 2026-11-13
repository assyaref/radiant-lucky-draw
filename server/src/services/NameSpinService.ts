/**
 * Name Spin Service
 *
 * Quick prize draw from a list of names typed/pasted by the operator
 * (independent from booth registration). The server picks the winner with a
 * cryptographically secure RNG — never in the browser — and broadcasts the
 * spin to every Monitor over Supabase Realtime (`namespin:started`).
 *
 * By design nothing is stored: no winner record, no stock change. A prize may
 * be referenced by id only to show its name/image (read-only).
 */

import { randomInt, randomUUID } from 'crypto';
import { PrizeRepository } from '../repositories';
import { RealtimeService, NAME_SPIN_EVENTS } from '../realtime';
import { ValidationError, NotFoundError } from '../utils';

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
  /** Names shown on the reel, ending with the winner (subset when the list is long). */
  reel: string[];
  durationMs: number;
  revealHoldMs: number;
  startedAt: string;
}

/** Reel length shown on screen; long lists are sampled. */
const REEL_SIZE = 40;
const SPIN_DURATION_MS = 7000;
const REVEAL_HOLD_MS = 12000;

export class NameSpinService {
  constructor(
    private prizeRepository: PrizeRepository,
    private realtimeService: RealtimeService,
  ) {}

  async spin(data: NameSpinRequest): Promise<NameSpinResult> {
    const names = NameSpinService.cleanNames(data.names);
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

    // Reel: shuffled sample of the other names, winner last.
    const others = names.filter((_, i) => i !== winnerIndex);
    for (let i = others.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [others[i], others[j]] = [others[j], others[i]];
    }
    const reel = [...others.slice(0, REEL_SIZE - 1), winnerName];

    const result: NameSpinResult = {
      spinId: randomUUID(),
      winnerName,
      winnerIndex,
      totalNames: names.length,
      prizeName,
      prizeImageUrl,
      prizeTier,
      title: data.title?.trim() || null,
      reel,
      durationMs: SPIN_DURATION_MS,
      revealHoldMs: REVEAL_HOLD_MS,
      startedAt: new Date().toISOString(),
    };

    await this.realtimeService.broadcastNow(NAME_SPIN_EVENTS.STARTED, { ...result });
    return result;
  }

  /** Trim, collapse whitespace, drop empties and case-insensitive duplicates (first wins). */
  static cleanNames(input: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of input) {
      const name = String(raw ?? '').replace(/\s+/g, ' ').trim();
      if (!name) continue;
      const key = name.toLocaleLowerCase('id-ID');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(name);
    }
    return out;
  }
}
