/**
 * Enterprise Admin Dashboard — PrizeWidget
 *
 * M2.3A — Glass panel summarizing prize inventory.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineTrophy } from 'react-icons/hi2';
import { colors, radius, shadows, transitions } from '@design-system/index';
import { AnimatedCounter } from '@animations/components/AnimatedCounter';

interface PrizeWidgetProps {
  available: number;
  claimed: number;
  total: number;
  delay?: number;
}

export const PrizeWidget = memo(function PrizeWidget({
  available,
  claimed,
  total,
  delay = 0,
}: PrizeWidgetProps) {
  const claimedPct = total > 0 ? Math.round((claimed / total) * 100) : 0;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-md"
      style={{
        background: colors.glass.dark,
        borderColor: colors.glass.line,
        borderRadius: radius.panel,
        boxShadow: shadows.card,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.luxury(delay)}
      whileHover={{ y: -4, boxShadow: shadows.cardHover }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
          Prizes
        </h3>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${colors.gold[400]}1a`, boxShadow: shadows.glow.gold.sm }}
        >
          <HiOutlineTrophy className="h-5 w-5" style={{ color: colors.gold[400] }} />
        </div>
      </div>

      <div className="mt-4">
        <AnimatedCounter value={available} className="text-3xl font-bold tracking-tight" />
        <p className="mt-1 text-xs" style={{ color: colors.text.tertiary }}>
          Available prizes
        </p>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span style={{ color: colors.text.secondary }}>Claimed</span>
          <span style={{ color: colors.text.primary }}>
            {claimed} / {total}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ background: colors.glass.light }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${colors.gold[400]}, ${colors.gold[500]})`,
              boxShadow: shadows.glow.gold.sm,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${claimedPct}%` }}
            transition={transitions.luxury(0.3)}
          />
        </div>
      </div>
    </motion.div>
  );
});
