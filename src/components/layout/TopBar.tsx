import { memo } from 'react';
import { motion } from 'framer-motion';
import { colors, zIndex } from '@design-system/index';
import { StatusBar, AudioControls, AudioVisualizer, Clock } from '@components/booth';

/**
 * Premium top bar with logo, live indicator, time, audio visualizer, and connection status.
 */
export const TopBar = memo(function TopBar() {
  return (
    <motion.header
      className="relative flex items-center justify-between px-6 py-3"
      style={{ zIndex: zIndex.topbar }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="url(#logoGrad)" strokeWidth="3" />
          <path
            d="M24 8 L28 18 L38 18 L30 24 L33 34 L24 28 L15 34 L18 24 L10 18 L20 18 Z"
            fill="url(#logoGrad)"
          />
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
              <stop stopColor={colors.gold[400]} />
              <stop offset="1" stopColor={colors.brand[400]} />
            </linearGradient>
          </defs>
        </svg>
        <div>
          <h2 className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">
            Radiant Group
          </h2>
          <p className="text-[9px] tracking-[0.3em] text-amber-400/40 uppercase">
            Lucky Draw Digital Booth
          </p>
        </div>
      </div>

      {/* Right side: Status + Audio + Visualizer + Clock */}
      <div className="flex items-center gap-4">
        <StatusBar />
        <div className="h-4 w-px bg-white/10" />
        <AudioControls />
        <AudioVisualizer />
        <Clock />
      </div>
    </motion.header>
  );
});
