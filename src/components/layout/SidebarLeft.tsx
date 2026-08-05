import { memo } from 'react';
import { motion } from 'framer-motion';
import { colors, zIndex } from '@design-system/index';
import { PrizePanel, PrizeShowcase } from '@components/booth';

/**
 * Left panel — Today's Prizes with premium cards.
 */
export const SidebarLeft = memo(function SidebarLeft() {
  return (
    <motion.aside
      className="flex flex-col justify-center gap-4 overflow-hidden"
      style={{ zIndex: zIndex.panels }}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Section header */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div
          className="h-px w-8"
          style={{ background: `linear-gradient(90deg, ${colors.gold[400]}, transparent)` }}
        />
        <h3 className="text-sm font-bold tracking-[0.2em] text-white/50 uppercase">
          Today's Prizes
        </h3>
      </motion.div>

      {/* Prize cards */}
      <PrizePanel />

      {/* Prize showcase */}
      <PrizeShowcase />
    </motion.aside>
  );
});
