import { memo } from 'react';
import { motion } from 'framer-motion';
import { colors, zIndex } from '@design-system/index';

/**
 * Premium animated background with gradient, blur, and moving light.
 */
export const AnimatedBackground = memo(function AnimatedBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: zIndex.background }}
    >
      {/* Base deep space gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${colors.bg.surface} 0%, ${colors.bg.base} 60%)`,
        }}
      />

      {/* Moving blue light */}
      <motion.div
        className="absolute -top-1/4 left-1/4 h-[60rem] w-[60rem] rounded-full"
        style={{ background: colors.gradient.blueGlow }}
        animate={{ x: [0, 80, -40, 0], y: [0, 40, -20, 0], opacity: [0.4, 0.7, 0.5, 0.4] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
      />

      {/* Moving gold light */}
      <motion.div
        className="absolute -bottom-1/4 right-1/4 h-[50rem] w-[50rem] rounded-full"
        style={{ background: colors.gradient.goldGlow }}
        animate={{ x: [0, -60, 30, 0], y: [0, -30, 20, 0], opacity: [0.3, 0.6, 0.4, 0.3] }}
        transition={{ repeat: Infinity, duration: 22, ease: 'easeInOut' }}
      />

      {/* Center ambient glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: colors.gradient.blueGlow }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
      />

      {/* Subtle grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(2,6,23,0.6) 100%)',
        }}
      />
    </div>
  );
});
