/**
 * Enterprise Admin Dashboard — RecentWinners
 *
 * M2.3A — Premium winner cards with photo placeholder, prize, time, status.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { colors, radius, shadows, transitions } from '@design-system/index';
import type { RecentWinner, WinnerStatus } from '../types';

interface RecentWinnersProps {
  winners: RecentWinner[];
  limit?: number;
}

const statusMeta: Record<WinnerStatus, { color: string; label: string }> = {
  claimed: { color: colors.status.online, label: 'Claimed' },
  pending: { color: colors.status.warning, label: 'Pending' },
  expired: { color: colors.status.disconnected, label: 'Expired' },
};

export const RecentWinners = memo(function RecentWinners({
  winners,
  limit = 5,
}: RecentWinnersProps) {
  const items = winners.slice(0, limit);

  return (
    <div className="space-y-3">
      {items.map((winner, index) => {
        const status = statusMeta[winner.status];
        return (
          <motion.div
            key={winner.id}
            className="flex items-center gap-3 rounded-xl border p-3 backdrop-blur-md"
            style={{
              background: colors.glass.dark,
              borderColor: colors.glass.line,
              borderRadius: radius.card,
              boxShadow: shadows.card,
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.luxury(index * 0.08)}
            whileHover={{ y: -2, boxShadow: shadows.cardHover }}
          >
            {/* Photo placeholder */}
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{
                background: `linear-gradient(135deg, ${winner.avatarColor}, ${colors.bg.elevated})`,
                color: colors.text.inverse,
                boxShadow: `0 0 12px ${winner.avatarColor}55`,
              }}
            >
              {winner.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: colors.text.primary }}>
                {winner.name}
              </p>
              <p className="truncate text-xs" style={{ color: colors.text.secondary }}>
                {winner.prize}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ color: status.color, background: `${status.color}1a` }}
              >
                {status.label}
              </span>
              <span className="text-[10px]" style={{ color: colors.text.tertiary }}>
                {winner.time}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
