/**
 * Monitor Service
 *
 * Holds what every Monitor screen displays (table `monitor_state`, one row):
 *  - mode 'event'    → the booth lucky-draw screen (default)
 *  - mode 'namespin' → the name wheel (Spin Nama)
 * plus the wheel's display data (a sample of the names, title, prize).
 * Changes are broadcast as `monitor:state` so open screens switch instantly;
 * screens that load later read GET /api/monitor/state.
 * Display state only — no draw results are stored.
 */

import { prisma } from '../lib/prisma';
import { PrizeRepository } from '../repositories';
import { RealtimeService } from '../realtime';
import { NotFoundError } from '../utils';
import { cleanNames, sampleForWheel } from '../utils/names';

export type MonitorMode = 'event' | 'namespin';

export interface WheelDisplay {
  /** Names drawn on the wheel (sample when the list is long). */
  names: string[];
  totalNames: number;
  title: string | null;
  prizeName: string | null;
  prizeImageUrl: string | null;
}

export interface MonitorState {
  mode: MonitorMode;
  wheel: WheelDisplay;
  updatedAt: string;
}

export interface UpdateMonitorStateRequest {
  mode?: MonitorMode;
  wheel?: {
    names?: string[];
    title?: string | null;
    prizeId?: string | null;
    prizeName?: string | null;
  };
}

const EMPTY_WHEEL: WheelDisplay = {
  names: [],
  totalNames: 0,
  title: null,
  prizeName: null,
  prizeImageUrl: null,
};

export class MonitorService {
  constructor(
    private prizeRepository: PrizeRepository,
    private realtimeService: RealtimeService,
  ) {}

  async get(): Promise<MonitorState> {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT mode, data, updated_at FROM monitor_state WHERE id = 1`,
    );
    const row = rows[0];
    if (!row) return { mode: 'event', wheel: EMPTY_WHEEL, updatedAt: new Date().toISOString() };
    const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data ?? {};
    return {
      mode: row.mode === 'namespin' ? 'namespin' : 'event',
      wheel: { ...EMPTY_WHEEL, ...(data.wheel ?? {}) },
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }

  async update(req: UpdateMonitorStateRequest): Promise<MonitorState> {
    const current = await this.get();
    const wheel: WheelDisplay = { ...current.wheel };

    if (req.wheel) {
      if (req.wheel.names !== undefined) {
        const names = cleanNames(req.wheel.names);
        wheel.names = sampleForWheel(names);
        wheel.totalNames = names.length;
      }
      if (req.wheel.title !== undefined) wheel.title = req.wheel.title?.trim() || null;
      if (req.wheel.prizeId) {
        const prize = await this.prizeRepository.findById(req.wheel.prizeId);
        if (!prize) throw new NotFoundError('Prize', req.wheel.prizeId);
        wheel.prizeName = prize.name;
        wheel.prizeImageUrl = prize.imageUrl ?? null;
      } else if (req.wheel.prizeId === null || req.wheel.prizeName !== undefined) {
        wheel.prizeName = req.wheel.prizeName?.trim() || null;
        wheel.prizeImageUrl = null;
      }
    }

    const mode: MonitorMode = req.mode ?? current.mode;
    await prisma.$queryRawUnsafe(
      `UPDATE monitor_state SET mode = $1, data = $2::jsonb, updated_at = now() WHERE id = 1`,
      mode,
      JSON.stringify({ wheel }),
    );
    const state = await this.get();
    await this.realtimeService.broadcastNow('monitor:state', { ...state });
    return state;
  }
}
