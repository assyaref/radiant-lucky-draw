/**
 * Name Spin API — quick prize draw from a typed list of names.
 * The server picks the winner and broadcasts `namespin:started` to Monitors.
 * Nothing is stored (no winner record, no stock change).
 */

import api from './client';

export interface NameSpinPayload {
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
  /** Wheel segments (same sample as the idle wheel); winner at `winnerSegment`. */
  segments: string[];
  winnerSegment: number;
  durationMs: number;
  revealHoldMs: number;
  startedAt: string;
}

export const nameSpinApi = {
  spin: (payload: NameSpinPayload) =>
    api.post<{ success: boolean; data: NameSpinResult }>('/name-spin', payload),
};

/** Same cleaning as the server: trim, collapse spaces, drop empties & case-insensitive duplicates. */
export function cleanNames(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/\r?\n|;|\t/)) {
    const name = raw.replace(/\s+/g, ' ').trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase('id-ID');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export default nameSpinApi;
