/**
 * Monitor state API — what the Monitor screens display.
 *  mode 'event'    → booth lucky draw (default)
 *  mode 'namespin' → Spin Nama wheel
 */

import api from './client';
import type { DisplayMode } from './nameSpin';

export type MonitorMode = 'event' | 'namespin';

export interface PrizeSegment {
  id: string;
  name: string;
  icon?: string;
}

export interface WheelDisplay {
  names: string[];
  totalNames: number;
  title: string | null;
  prizeName: string | null;
  prizeImageUrl: string | null;
  prizeList?: string[];
  prizeSegments?: PrizeSegment[];
  totalPrizes?: number;
  displayMode?: DisplayMode;
}

/** Per-event look & sound of the Spin Nama screen. */
export interface MonitorTheme {
  logoUrl: string | null;
  eventLabel: string | null;
  spinSoundUrl: string | null;
  winSoundUrl: string | null;
  soundEnabled: boolean;
}

export const DEFAULT_THEME: MonitorTheme = {
  logoUrl: null,
  eventLabel: null,
  spinSoundUrl: null,
  winSoundUrl: null,
  soundEnabled: true,
};

export interface MonitorState {
  mode: MonitorMode;
  wheel: WheelDisplay;
  theme?: MonitorTheme;
  updatedAt: string;
}

export interface UpdateMonitorStatePayload {
  mode?: MonitorMode;
  wheel?: {
    names?: string[];
    title?: string | null;
    prizeId?: string | null;
    prizeName?: string | null;
    prizeList?: string[];
    prizeSegments?: PrizeSegment[];
    totalPrizes?: number;
    displayMode?: DisplayMode;
  };
  theme?: Partial<MonitorTheme>;
}

export interface UploadedAsset {
  url: string;
  contentType: string;
  size: number;
}

type Envelope<T> = { success: boolean; data: T };

export const monitorApi = {
  get: () => api.get<Envelope<MonitorState>>('/monitor/state'),
  update: (payload: UpdateMonitorStatePayload) =>
    api.put<Envelope<MonitorState>>('/monitor/state', payload),
  /** Upload a logo image or a sound file; returns its public URL. */
  uploadAsset: (kind: 'logo' | 'sound', dataUrl: string, fileName?: string) =>
    api.post<Envelope<UploadedAsset>>('/monitor/assets', { kind, dataUrl, fileName }),
};

/** Same evenly spaced sample the server uses for the wheel (max 60 segments). */
export function sampleForWheel<T>(items: T[], max = 60): T[] {
  if (items.length <= max) return [...items];
  const step = items.length / max;
  return Array.from({ length: max }, (_, i) => items[Math.floor(i * step)]);
}

export default monitorApi;