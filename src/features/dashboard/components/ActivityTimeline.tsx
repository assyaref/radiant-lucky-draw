/**
 * Enterprise Admin Dashboard — ActivityTimeline
 *
 * M2.3A — Animated timeline of recent activities on glass cards.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { colors, radius, shadows, transitions } from '@design-system/index';
import type { ActivityItem, ActivityType } from '../types';

interface ActivityTimelineProps {
  activities: ActivityItem[];
  limit?: number;
}

const typeMeta: Record<ActivityType, { color: string; label: string }> = {
  draw: { color: colors.brand[400], label: 'Draw' },
  winner: { color: colors.status.online, label: 'Winner' },
  registration: { color: colors.brand[300], label: 'Registration' },
  queue: { color: colors.status.warning, label: 'Queue' },
  system: { color: colors.text.tertiary, label: 'System' },
  prize: { color: colors.gold[400], label: 'Prize' },
};

export const ActivityTimeline = memo(function ActivityTimeline({
  activities,
  limit = 6,
}: ActivityTimelineProps) {
  const items = activities.slice(0, limit);

  return (
    <div className="relative space-y-4">
      {/* Vertical line */}
      <div
        className="absolute left-[7px] top-2 bottom-2 w-px"
        style={{ background: colors.glass.line }}
      />

      {items.map((activity, index) => {
        const meta = typeMeta[activity.type];
        return (
          <motion.div
            key={activity.id}
            className="relative flex items-start gap-4"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transitions.luxury(index * 0.08)}
          >
            {/* Dot */}
            <div
              className="relative z-10 mt-1 flex h-3.5 w-3.5 items-center justify-center rounded-full"
              style={{
                background: colors.bg.surface,
                border: `2px solid ${meta.color}`,
                boxShadow: `0 0 8px ${meta.color}66`,
              }}
            />

            {/* Card */}
            <div
              className="flex-1 rounded-xl border p-3 backdrop-blur-md"
              style={{
                background: colors.glass.dark,
                borderColor: colors.glass.line,
                borderRadius: radius.card,
                boxShadow: shadows.card,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: meta.color, background: `${meta.color}1a` }}
                >
                  {meta.label}
                </span>
                <span className="text-xs" style={{ color: colors.text.tertiary }}>
                  {new Date(activity.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="mt-1.5 text-sm" style={{ color: colors.text.secondary }}>
                {activity.message}
              </p>
              {activity.userName && (
                <p className="mt-0.5 text-xs" style={{ color: colors.text.tertiary }}>
                  {activity.userName}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
