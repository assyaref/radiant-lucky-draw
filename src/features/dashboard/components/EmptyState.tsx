/**
 * Enterprise Admin Dashboard — EmptyState
 *
 * M2.3A — Reusable empty state for dashboard sections.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineInbox } from 'react-icons/hi2';
import { colors, radius, shadows, transitions } from '@design-system/index';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = memo(function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center rounded-2xl border p-10 text-center backdrop-blur-md"
      style={{
        background: colors.glass.dark,
        borderColor: colors.glass.line,
        borderRadius: radius.panel,
        boxShadow: shadows.card,
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.luxury()}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: colors.glass.lighter, boxShadow: shadows.glow.blue.sm }}
      >
        <HiOutlineInbox className="h-8 w-8" style={{ color: colors.text.tertiary }} />
      </div>
      <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm" style={{ color: colors.text.secondary }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold"
          style={{
            background: colors.brand[600],
            color: colors.text.primary,
            boxShadow: shadows.button.primary,
          }}
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
});
