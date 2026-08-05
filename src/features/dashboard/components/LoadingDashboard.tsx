/**
 * Enterprise Admin Dashboard — LoadingDashboard
 *
 * M2.3A — Premium shimmer skeleton for the dashboard shell.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { colors, radius } from '@design-system/index';

interface LoadingDashboardProps {
  cards?: number;
}

export const LoadingDashboard = memo(function LoadingDashboard({
  cards = 4,
}: LoadingDashboardProps) {
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: colors.glass.light, borderRadius: radius.card }}
    >
      <motion.div
        className="absolute inset-y-0 w-1/2"
        style={{ background: colors.gradient.goldShine }}
        animate={{ x: ['-120%', '320%'] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
      />
    </div>
  );

  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>

      {/* Middle charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
});
