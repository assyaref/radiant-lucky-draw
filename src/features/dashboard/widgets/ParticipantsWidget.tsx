/**
 * Enterprise Admin Dashboard — ParticipantsWidget
 *
 * M2.3A — Glass panel summarizing participant statistics.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUsers } from 'react-icons/hi2';
import { colors, radius, shadows, transitions } from '@design-system/index';
import { AnimatedCounter } from '@animations/components/AnimatedCounter';

interface ParticipantsWidgetProps {
  total: number;
  registeredToday: number;
  active: number;
  delay?: number;
}

export const ParticipantsWidget = memo(function ParticipantsWidget({
  total,
  registeredToday,
  active,
  delay = 0,
}: ParticipantsWidgetProps) {
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
          Participants
        </h3>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${colors.brand[500]}1a`, boxShadow: shadows.glow.blue.sm }}
        >
          <HiOutlineUsers className="h-5 w-5" style={{ color: colors.brand[400] }} />
        </div>
      </div>

      <div className="mt-4">
        <AnimatedCounter value={total} className="text-3xl font-bold tracking-tight" />
        <p className="mt-1 text-xs" style={{ color: colors.text.tertiary }}>
          Total registered
        </p>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-3 border-t pt-4"
        style={{ borderColor: colors.glass.line }}
      >
        <div>
          <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>
            {registeredToday}
          </p>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            Today
          </p>
        </div>
        <div>
          <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>
            {active}
          </p>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            Active now
          </p>
        </div>
      </div>
    </motion.div>
  );
});
