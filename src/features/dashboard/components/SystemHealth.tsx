/**
 * Enterprise Admin Dashboard — SystemHealth
 *
 * M2.3A — Animated progress bars for CPU, Memory, Response Time,
 * Queue Length, Storage.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { colors, transitions } from '@design-system/index';
import type { HealthMetric } from '../types';

interface SystemHealthProps {
  metrics: HealthMetric[];
}

const colorMap = {
  blue: colors.brand[500],
  gold: colors.gold[400],
  green: colors.status.online,
  amber: colors.status.warning,
  red: colors.status.disconnected,
} as const;

export const SystemHealth = memo(function SystemHealth({ metrics }: SystemHealthProps) {
  return (
    <div className="space-y-4">
      {metrics.map((metric, index) => {
        const barColor = colorMap[metric.color];
        return (
          <div key={metric.id}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span style={{ color: colors.text.secondary }}>{metric.label}</span>
              <span className="font-semibold" style={{ color: colors.text.primary }}>
                {metric.value}%
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: colors.glass.light }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`,
                  boxShadow: `0 0 8px ${barColor}66`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={transitions.luxury(0.2 + index * 0.1)}
              />
            </div>
            <p className="mt-1 text-xs" style={{ color: colors.text.tertiary }}>
              {metric.detail}
            </p>
          </div>
        );
      })}
    </div>
  );
});
