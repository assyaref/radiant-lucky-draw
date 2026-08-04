// ============================================================
// Chart Card Wrapper Component
// ============================================================

import { motion } from 'framer-motion';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  delay?: number;
  fullWidth?: boolean;
}

export function ChartCard({
  title,
  subtitle,
  children,
  action,
  className = '',
  delay = 0,
  fullWidth = false,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`rounded-xl border border-dark-border bg-dark-surface-secondary p-5 ${
        fullWidth ? 'col-span-full' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-dark-text-tertiary mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </motion.div>
  );
}
