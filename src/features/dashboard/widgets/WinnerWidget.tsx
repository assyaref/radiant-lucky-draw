/**
 * Enterprise Admin Dashboard — WinnerWidget
 *
 * M2.3A — Glass panel summarizing today's winners.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineTrophy } from 'react-icons/hi2';
import { colors, radius, shadows, transitions } from '@design-system/index';
import { AnimatedCounter } from '@animations/components/AnimatedCounter';

interface WinnerWidgetProps {
  today: number;
  claimed: number;
  pending: number;
  delay?: number;
}

export const WinnerWidget = memo(function WinnerWidget({
  today,
  claimed,
  pending,
  delay = 0,
}: WinnerWidgetProps) {
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
          Today's Winners
        </h3>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${colors.status.online}1a`, boxShadow: shadows.glow.blue.sm }}
        >
          <HiOutlineTrophy className="h-5 w-5" style={{ color: colors.status.online }} />
        </div>
      </div>

      <div className="mt-4">
        <AnimatedCounter value={today} className="text-3xl font-bold tracking-tight" />
        <p className="mt-1 text-xs" style={{ color: colors.text.tertiary }}>
          Winners today
        </p>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-3 border-t pt-4"
        style={{ borderColor: colors.glass.line }}
      >
        <div>
          <p className="text-lg font-semibold" style={{ color: colors.status.online }}>
            {claimed}
          </p>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            Claimed
          </p>
        </div>
        <div>
          <p className="text-lg font-semibold" style={{ color: colors.status.warning }}>
            {pending}
          </p>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            Pending
          </p>
        </div>
      </div>
    </motion.div>
  );
});
