/**
 * Enterprise Admin Dashboard — QuickActions
 *
 * M2.3A — Quick action buttons. No CRUD wired yet (foundation only).
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUserPlus,
  HiOutlinePlay,
  HiOutlineGift,
  HiOutlineArrowDownTray,
  HiOutlineCog6Tooth,
} from 'react-icons/hi2';
import { colors, radius, shadows, transitions } from '@design-system/index';
import type { QuickAction, QuickActionKind } from '../types';

interface QuickActionsProps {
  actions: QuickAction[];
}

const iconMap: Record<
  QuickActionKind,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  participant: HiOutlineUserPlus,
  draw: HiOutlinePlay,
  prizes: HiOutlineGift,
  export: HiOutlineArrowDownTray,
  settings: HiOutlineCog6Tooth,
};

const colorMap: Record<QuickActionKind, string> = {
  participant: colors.brand[400],
  draw: colors.gold[400],
  prizes: colors.status.online,
  export: colors.brand[300],
  settings: colors.text.secondary,
};

export const QuickActions = memo(function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {actions.map((action, index) => {
        const Icon = iconMap[action.kind];
        const color = colorMap[action.kind];
        return (
          <motion.button
            key={action.id}
            className="flex flex-col items-start gap-3 rounded-xl border p-4 text-left backdrop-blur-md"
            style={{
              background: colors.glass.dark,
              borderColor: colors.glass.line,
              borderRadius: radius.card,
              boxShadow: shadows.card,
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.luxury(index * 0.06)}
            whileHover={{ y: -4, boxShadow: shadows.cardHover }}
            whileTap={{ scale: 0.97 }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: `${color}1a`, boxShadow: `0 0 12px ${color}33` }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                {action.label}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: colors.text.tertiary }}>
                {action.description}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
});
