/**
 * Enterprise Admin Dashboard — QueueWidget
 *
 * M2.3A — Glass panel summarizing queue status.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineQueueList } from 'react-icons/hi2';
import { colors, radius, shadows, transitions } from '@design-system/index';
import { AnimatedCounter } from '@animations/components/AnimatedCounter';

interface QueueWidgetProps {
  waiting: number;
  ready: number;
  served: number;
  delay?: number;
}

export const QueueWidget = memo(function QueueWidget({
  waiting,
  ready,
  served,
  delay = 0,
}: QueueWidgetProps) {
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
          Queue
        </h3>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${colors.status.warning}1a`, boxShadow: shadows.glow.gold.sm }}
        >
          <HiOutlineQueueList className="h-5 w-5" style={{ color: colors.status.warning }} />
        </div>
      </div>

      <div className="mt-4">
        <AnimatedCounter value={waiting} className="text-3xl font-bold tracking-tight" />
        <p className="mt-1 text-xs" style={{ color: colors.text.tertiary }}>
          Waiting in queue
        </p>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-3 border-t pt-4"
        style={{ borderColor: colors.glass.line }}
      >
        <div>
          <p className="text-lg font-semibold" style={{ color: colors.status.online }}>
            {ready}
          </p>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            Ready
          </p>
        </div>
        <div>
          <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>
            {served}
          </p>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            Served
          </p>
        </div>
      </div>
    </motion.div>
  );
});
