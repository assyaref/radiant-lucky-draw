/**
 * Enterprise Admin Dashboard — ServerStatus
 *
 * M2.3A — Status cards for API, Database, Socket, Railway, Storage.
 * Green / Yellow / Red indicators.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { colors, radius, shadows, transitions } from '@design-system/index';
import type { ServerStatusItem, ServerStatusLevel } from '../types';

interface ServerStatusProps {
  items: ServerStatusItem[];
}

const levelMeta: Record<ServerStatusLevel, { color: string; label: string }> = {
  green: { color: colors.status.online, label: 'Operational' },
  yellow: { color: colors.status.warning, label: 'Degraded' },
  red: { color: colors.status.disconnected, label: 'Down' },
};

export const ServerStatus = memo(function ServerStatus({ items }: ServerStatusProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => {
        const meta = levelMeta[item.status];
        return (
          <motion.div
            key={item.id}
            className="flex items-center gap-3 rounded-xl border p-3 backdrop-blur-md"
            style={{
              background: colors.glass.dark,
              borderColor: colors.glass.line,
              borderRadius: radius.card,
              boxShadow: shadows.card,
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.luxury(index * 0.06)}
            whileHover={{ y: -2, boxShadow: shadows.cardHover }}
          >
            <div className="relative flex h-3 w-3 flex-shrink-0">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ background: meta.color }}
              />
              <span
                className="relative inline-flex h-3 w-3 rounded-full"
                style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                {item.label}
              </p>
              <p className="truncate text-xs" style={{ color: colors.text.tertiary }}>
                {item.detail}
              </p>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ color: meta.color, background: `${meta.color}1a` }}
            >
              {meta.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
});
