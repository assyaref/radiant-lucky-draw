/**
 * PrizeWheel
 *
 * Spin wheel specialized for prizes.
 * Accepts WheelSegment array directly (already converted from Prize types).
 */

import { useEffect } from 'react';
import type { WheelSegment } from '../types';
import { SpinWheel } from './SpinWheel';

interface PrizeWheelProps {
  segments: WheelSegment[];
  isSpinning: boolean;
  result: { segment: WheelSegment; rotationAngle: number } | null;
  duration: number;
  onSpinComplete?: (segment: WheelSegment) => void;
}

export function PrizeWheel({
  segments,
  isSpinning,
  result,
  duration = 4,
  onSpinComplete,
}: PrizeWheelProps) {
  const rotationAngle = result?.rotationAngle ?? 0;

  useEffect(() => {
    if (!isSpinning && result && onSpinComplete) {
      onSpinComplete(result.segment);
    }
  }, [isSpinning, result, onSpinComplete]);

  if (segments.length === 0) return null;

  return (
    <SpinWheel
      segments={segments}
      isSpinning={isSpinning}
      result={
        result
          ? {
              mode: 'prize',
              segment: result.segment,
              rotationAngle,
              timestamp: new Date().toISOString(),
              success: true,
            }
          : null
      }
      rotationAngle={rotationAngle}
      duration={duration}
      pointerColor="#fbbf24"
      onSpinComplete={onSpinComplete ? () => onSpinComplete(result!.segment) : undefined}
    />
  );
}
