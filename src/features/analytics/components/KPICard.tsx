// ============================================================
// KPI Card Component
// ============================================================

import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: { value: string; up: boolean };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  loading?: boolean;
  delay?: number;
}

const colorMap = {
  primary: { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/20' },
  secondary: {
    bg: 'bg-secondary-500/10',
    text: 'text-secondary-400',
    border: 'border-secondary-500/20',
  },
  success: { bg: 'bg-success-500/10', text: 'text-success-400', border: 'border-success-500/20' },
  warning: { bg: 'bg-warning-500/10', text: 'text-warning-400', border: 'border-warning-500/20' },
  danger: { bg: 'bg-danger-500/10', text: 'text-danger-400', border: 'border-danger-500/20' },
  info: { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/20' },
};

export function KPICard({
  title,
  value,
  icon,
  subtitle,
  trend,
  color = 'primary',
  loading = false,
  delay = 0,
}: KPICardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`rounded-xl border ${colors.border} bg-dark-surface-secondary p-5 hover:border-dark-border/80 transition-all`}
    >
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-dark-surface-tertiary" />
            <div className="h-10 w-10 rounded-lg bg-dark-surface-tertiary" />
          </div>
          <div className="h-8 w-20 rounded bg-dark-surface-tertiary" />
          <div className="h-3 w-16 rounded bg-dark-surface-tertiary" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <p className="text-sm text-dark-text-tertiary">{title}</p>
            <div className={`p-2.5 rounded-lg ${colors.bg}`}>
              <span className={colors.text}>{icon}</span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && <p className="text-xs text-dark-text-tertiary mt-1">{subtitle}</p>}
          </div>
          {trend && (
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-dark-border/50">
              <span
                className={`text-xs font-medium ${trend.up ? 'text-success-400' : 'text-danger-400'}`}
              >
                {trend.up ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-dark-text-tertiary">vs last period</span>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
