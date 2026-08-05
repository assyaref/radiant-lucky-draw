import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { colors, radius, shadows } from '@design-system/index';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  glow?: 'blue' | 'gold' | 'none';
  hover?: boolean;
  delay?: number;
}

/**
 * Reusable premium glass panel with optional glow and hover lift.
 */
export const GlassPanel = memo(function GlassPanel({
  children,
  className = '',
  glow = 'none',
  hover = false,
  delay = 0,
}: GlassPanelProps) {
  const glowStyle =
    glow === 'blue'
      ? { boxShadow: shadows.glow.blue.sm }
      : glow === 'gold'
        ? { boxShadow: shadows.glow.gold.sm }
        : {};

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-md ${className}`}
      style={{
        background: colors.glass.dark,
        borderColor: colors.glass.line,
        borderRadius: radius.panel,
        ...glowStyle,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
    >
      {/* Top highlight line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        }}
      />
      {children}
    </motion.div>
  );
});
