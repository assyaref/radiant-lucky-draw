/**
 * Enterprise Admin Dashboard — DashboardHeader
 *
 * M2.3A — Page title, subtitle, and refresh action.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineArrowPath } from 'react-icons/hi2';
import { colors, radius, shadows, transitions } from '@design-system/index';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string | null;
  onRefresh?: () => void;
}

export const DashboardHeader = memo(function DashboardHeader({
  title,
  subtitle,
  lastUpdated,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <motion.div
      className="flex flex-wrap items-center justify-between gap-4"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.luxury()}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.text.primary }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
            {subtitle}
          </p>
        )}
        {lastUpdated && (
          <p className="mt-1 text-xs" style={{ color: colors.text.tertiary }}>
            Last updated {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>

      {onRefresh && (
        <motion.button
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
          style={{
            background: colors.glass.light,
            borderColor: colors.glass.line,
            color: colors.text.secondary,
            borderRadius: radius.button,
            boxShadow: shadows.card,
          }}
          whileHover={{ y: -2, boxShadow: shadows.cardHover }}
          whileTap={{ scale: 0.97 }}
        >
          <HiOutlineArrowPath className="h-4 w-4" />
          Refresh
        </motion.button>
      )}
    </motion.div>
  );
});
