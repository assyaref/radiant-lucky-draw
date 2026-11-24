/**
 * Spin Wheel Types
 *
 * Type definitions for the prize and name spin wheel feature.
 * Framework independent - no React/UI dependencies.
 */

/** Mode of the spin wheel */
export type SpinMode = 'prize' | 'name';

/** Individual segment on the spin wheel */
export interface WheelSegment {
  id: string;
  label: string;
  value: string; // prize id or participant id
  color: string;
  weight: number; // probability weight (higher = more likely)
  imageUrl?: string;
}

/** Configuration for the spin wheel */
export interface WheelConfig {
  mode: SpinMode;
  segments: WheelSegment[];
  duration: number; // spin duration in seconds
  rotations: number; // number of full rotations before stopping
  pointerAngle: number; // angle of the pointer in degrees (0 = top)
  colors: string[]; // default colors for segments
}

/** Result of a spin operation */
export interface SpinResult {
  mode: SpinMode;
  segment: WheelSegment;
  prizeId?: string;
  participantId?: string;
  participantName?: string;
  prizeName?: string;
  rotationAngle: number; // final rotation angle in degrees
  timestamp: string;
  success: boolean;
  error?: string;
}

/** Default wheel configuration */
export const DEFAULT_WHEEL_CONFIG: WheelConfig = {
  mode: 'prize',
  segments: [],
  duration: 4,
  rotations: 5,
  pointerAngle: 270, // pointer at top (270deg in CSS where 0 = right)
  colors: [
    '#fbbf24',
    '#a78bfa',
    '#60a5fa',
    '#34d399',
    '#f59e0b',
    '#ef4444',
    '#94a3b8',
    '#64748b',
    '#475569',
    '#8b5cf6',
  ],
};

/** Default segment colors by prize tier */
export const SEGMENT_COLORS: Record<string, string> = {
  grand: '#fbbf24',
  very_rare: '#a78bfa',
  rare: '#60a5fa',
  normal: '#34d399',
  common: '#f59e0b',
  gold: '#fbbf24',
  silver: '#94a3b8',
  bronze: '#ef4444',
  special: '#8b5cf6',
  platinum: '#a78bfa',
  diamond: '#c4b5fd',
};
