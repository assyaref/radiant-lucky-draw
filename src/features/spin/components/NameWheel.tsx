/**
 * NameWheel
 *
 * Spin wheel specialized for participant names.
 * Accepts WheelSegment array directly (already converted from Participant types).
 */

import type { WheelSegment } from '../types';
import { SpinWheel } from './SpinWheel';

interface NameWheelProps {
  segments: WheelSegment[];
  isSpinning: boolean;
  result: { segment: WheelSegment; rotationAngle: number } | null;
  duration: number;
}

export function NameWheel({ segments, isSpinning, result, duration = 4 }: NameWheelProps) {
  const rotationAngle = result?.rotationAngle ?? 0;

  if (segments.length === 0) return null;

  return (
    <SpinWheel
      segments={segments}
      isSpinning={isSpinning}
      result={
        result
          ? {
              mode: 'name',
              segment: result.segment,
              rotationAngle,
              timestamp: new Date().toISOString(),
              success: true,
            }
          : null
      }
      rotationAngle={rotationAngle}
      duration={duration}
      pointerColor="#34d399"
    />
  );
}
