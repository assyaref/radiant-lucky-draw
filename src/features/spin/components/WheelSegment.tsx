/**
 * WheelSegment
 *
 * Individual segment on the spin wheel.
 * Displays label, color, and optional image for each prize/name segment.
 */

import { motion } from 'framer-motion';
import type { WheelSegment } from '../types';

interface WheelSegmentProps {
  segment: WheelSegment;
  index: number;
  total: number;
  radius: number;
  isSelected?: boolean;
}

export function WheelSegment({
  segment,
  index,
  total,
  radius,
  isSelected = false,
}: WheelSegmentProps) {
  const angle = (360 / total) * index;
  const startAngle = angle;
  const endAngle = angle + 360 / total;
  const midAngle = angle + 180 / total;

  // Calculate position for label (center of segment)
  const labelX = Math.cos((midAngle * Math.PI) / 180) * (radius * 0.65);
  const labelY = Math.sin((midAngle * Math.PI) / 180) * (radius * 0.65);

  // Large arc flag for SVG path (1 if segment > 180 degrees)
  const largeArcFlag = 360 / total > 180 ? 1 : 0;

  // SVG arc path for the segment
  const d = [
    `M 0 0`,
    `L ${radius * Math.cos((startAngle * Math.PI) / 180)} ${radius * Math.sin((startAngle * Math.PI) / 180)}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${radius * Math.cos((endAngle * Math.PI) / 180)} ${radius * Math.sin((endAngle * Math.PI) / 180)}`,
    `Z`,
  ].join(' ');

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <path d={d} fill={segment.color} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
      {segment.imageUrl && (
        <image
          href={segment.imageUrl}
          x={labelX - 20}
          y={labelY - 20}
          width={40}
          height={40}
          preserveAspectRatio="xMidYMid meet"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        />
      )}
      {!segment.imageUrl && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.95)"
          fontSize={12}
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
          }}
        >
          {segment.label}
        </text>
      )}
      {isSelected && (
        <motion.circle
          cx={0}
          cy={0}
          r={6}
          fill="#ffffff"
          stroke={segment.color}
          strokeWidth={3}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.g>
  );
}
