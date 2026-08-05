import { memo } from 'react';
import { motion } from 'framer-motion';
import { colors, radius } from '@design-system/index';

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

/**
 * Premium shimmer skeleton loader for the participant journey.
 * Uses a sweeping gold/blue light across glass surfaces.
 */
export const LoadingSkeleton = memo(function LoadingSkeleton({
  lines = 4,
  className = '',
}: LoadingSkeletonProps) {
  return (
    <div className={`w-full space-y-4 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden"
          style={{
            height: i === 0 ? '2.5rem' : '3.25rem',
            borderRadius: radius.md,
            background: colors.glass.light,
          }}
        >
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-y-0 w-1/2"
            style={{
              background: colors.gradient.goldShine,
            }}
            animate={{ x: ['-120%', '320%'] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut', delay: i * 0.15 }}
          />
        </div>
      ))}
    </div>
  );
});
