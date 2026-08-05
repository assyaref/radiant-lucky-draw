import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { colors, radius, shadows, transitions } from '@design-system/index';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  glow?: 'blue' | 'gold' | 'none';
  hover?: boolean;
  delay?: number;
}

/**
 * Reusable premium glass panel for the participant journey.
 * Reuses M2.1 design tokens (colors, radius, shadows, transitions).
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
      transition={transitions.luxury(delay)}
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
