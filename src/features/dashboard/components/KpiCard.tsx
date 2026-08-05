/**
 * Enterprise Admin Dashboard — KpiCard
 *
 * M2.3A — Animated counter, icon, trend, color, and hover lift.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUsers,
  HiOutlineGift,
  HiOutlineTrophy,
  HiOutlineQueueList,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineMinus,
} from 'react-icons/hi2';
import { colors, radius, shadows, transitions } from '@design-system/index';
import { AnimatedCounter } from '@animations/components/AnimatedCounter';
import type { KpiMetric } from '../types';

interface KpiCardProps {
  metric: KpiMetric;
  delay?: number;
}

const iconMap = {
  participants: HiOutlineUsers,
  draw: HiOutlineGift,
  prizes: HiOutlineTrophy,
  queue: HiOutlineQueueList,
} as const;

const colorMap = {
  blue: {
    icon: colors.brand[400],
    glow: shadows.glow.blue.sm,
    bar: colors.brand[500],
  },
  gold: {
    icon: colors.gold[400],
    glow: shadows.glow.gold.sm,
    bar: colors.gold[400],
  },
  green: {
    icon: colors.status.online,
    glow: shadows.glow.blue.sm,
    bar: colors.status.online,
  },
  amber: {
    icon: colors.status.warning,
    glow: shadows.glow.gold.sm,
    bar: colors.status.warning,
  },
} as const;

export const KpiCard = memo(function KpiCard({ metric, delay = 0 }: KpiCardProps) {
  const Icon = iconMap[metric.icon];
  const palette = colorMap[metric.color];

  const TrendIcon =
    metric.direction === 'up'
      ? HiOutlineArrowTrendingUp
      : metric.direction === 'down'
        ? HiOutlineArrowTrendingDown
        : HiOutlineMinus;

  const trendColor =
    metric.direction === 'up'
      ? colors.status.online
      : metric.direction === 'down'
        ? colors.status.disconnected
        : colors.text.tertiary;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border backdrop-blur-md"
      style={{
        background: colors.glass.dark,
        borderColor: colors.glass.line,
        borderRadius: radius.panel,
        boxShadow: shadows.card,
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.luxury(delay)}
      whileHover={{ y: -6, scale: 1.02, boxShadow: shadows.cardHover }}
    >
      {/* Top highlight line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        }}
      />

      <div className="flex items-start justify-between p-5">
        <div className="space-y-3">
          <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
            {metric.label}
          </p>
          <div className="flex items-baseline gap-1">
            <AnimatedCounter
              value={metric.value}
              prefix={metric.prefix}
              suffix={metric.suffix}
              className="text-3xl font-bold tracking-tight"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <TrendIcon className="h-4 w-4" style={{ color: trendColor }} />
            <span style={{ color: trendColor }}>
              {metric.direction === 'flat' ? 'Steady' : `${Math.abs(metric.trend)}%`}
            </span>
            <span style={{ color: colors.text.tertiary }}>vs yesterday</span>
          </div>
        </div>

        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{
            background: colors.glass.lighter,
            boxShadow: palette.glow,
          }}
        >
          <Icon className="h-6 w-6" style={{ color: palette.icon }} />
        </div>
      </div>

      {/* Bottom accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${palette.bar}, transparent)`,
        }}
      />
    </motion.div>
  );
});
