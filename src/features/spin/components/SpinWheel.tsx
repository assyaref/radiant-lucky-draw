/**
 * SpinWheel
 *
 * Main spin wheel component using Framer Motion for smooth rotation animation.
 * Supports both prize and name modes. No business logic - pure presentation.
 */

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';
import type { WheelSegment, SpinResult } from '../types';
import { WheelSegment as WheelSegmentComponent } from './WheelSegment';

interface SpinWheelProps {
  segments: WheelSegment[];
  isSpinning: boolean;
  result: SpinResult | null;
  rotationAngle: number;
  duration: number;
  pointerColor?: string;
  wheelSize?: number;
  onSpinComplete?: (result: SpinResult) => void;
}

const DEFAULT_WHEEL_SIZE = 360;
const DEFAULT_POINTER_COLOR = '#fbbf24';

export function SpinWheel({
  segments,
  isSpinning,
  result,
  rotationAngle = 0,
  pointerColor = DEFAULT_POINTER_COLOR,
  wheelSize = DEFAULT_WHEEL_SIZE,
  onSpinComplete,
}: SpinWheelProps) {
  const radius = wheelSize / 2;
  const total = segments.length;

  // Motion value for wheel rotation
  const rotation = useMotionValue(rotationAngle);

  // Spring for smooth deceleration
  const springRotation = useSpring(rotation, {
    stiffness: 300,
    damping: 30,
  });

  // Animate rotation when spinning starts
  useEffect(() => {
    if (isSpinning && result) {
      rotation.set(0);
      rotation.set(result.rotationAngle);
    }
  }, [isSpinning, result, rotation]);

  // Detect when spin animation completes
  useEffect(() => {
    if (isSpinning === false && result?.success && onSpinComplete) {
      onSpinComplete(result);
    }
  }, [isSpinning, result, onSpinComplete]);

  if (total === 0) {
    return null;
  }

  const segmentAngle = 360 / total;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: wheelSize,
        height: wheelSize,
      }}
    >
      {/* SVG Wheel */}
      <svg
        width={wheelSize}
        height={wheelSize}
        className="relative z-10"
        viewBox={`${-radius} ${-radius} ${wheelSize} ${wheelSize}`}
      >
        {/* Wheel center hole */}
        <circle
          cx={0}
          cy={0}
          r={radius * 0.15}
          fill="#0f172a"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={2}
        />

        {/* Segments */}
        {segments.map((segment, index) => (
          <WheelSegmentComponent
            key={segment.id}
            segment={segment}
            index={index}
            total={total}
            radius={radius}
            isSelected={result?.success && segment.id === result.segment.id}
          />
        ))}

        {/* Separator lines */}
        {segments.map((_, index) => {
          const angle = (segmentAngle * index * Math.PI) / 180;
          const x1 = radius * 0.85 * Math.cos(angle);
          const y1 = radius * 0.85 * Math.sin(angle);
          const x2 = radius * Math.cos(angle);
          const y2 = radius * Math.sin(angle);
          return (
            <line
              key={`sep-${index}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={2}
            />
          );
        })}
      </svg>

      {/* Rotating wheel container */}
      <motion.div
        style={{
          rotate: springRotation,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {/* Center hub */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-600 shadow-2xl border-4 border-white flex items-center justify-center relative z-20">
          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
            <span className="text-white font-bold text-xl">🎯</span>
          </div>
        </div>
      </motion.div>

      {/* Pointer at top */}
      <div
        className="absolute -top-4 left-1/2 -translate-x-1/2 z-30"
        style={{ width: 0, height: 0 }}
      >
        <div
          className="border-l-8 border-r-8 border-b-16 border-transparent border-b-[pointerColor]"
          style={{ borderBottomColor: pointerColor }}
        />
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-2 bg-white rounded-full" />
      </div>
    </div>
  );
}
