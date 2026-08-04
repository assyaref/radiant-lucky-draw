/**
 * LiveEventEngine - Attract Flash Overlay
 * Renders the grand prize flash every 15s while idle.
 * Features: glow, spotlight, animated banner.
 */
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveEventEngine } from './LiveEventEngine';
import { CINEMATIC_EASE } from './transitionManager';

export const AttractFlashOverlay = memo(function AttractFlashOverlay() {
  const { state } = useLiveEventEngine();
  const isActive = state === 'attract';

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[30] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: CINEMATIC_EASE }}
        >
          {/* Spotlight */}
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <div className="h-full w-full bg-gradient-radial from-amber-400/30 via-transparent to-transparent" />
          </motion.div>

          {/* Glow pulse */}
          <motion.div
            className="absolute inset-0"
            animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <div className="h-full w-full bg-gradient-radial from-amber-500/20 via-blue-500/10 to-transparent blur-3xl" />
          </motion.div>

          {/* Animated banner */}
          <motion.div
            className="relative z-10 text-center"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <motion.div
              className="mb-4 text-8xl"
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              👑
            </motion.div>
            <motion.h2
              className="mb-2 text-6xl font-black tracking-wider"
              animate={{
                textShadow: [
                  '0 0 20px rgba(251,191,36,0.4)',
                  '0 0 50px rgba(251,191,36,0.8)',
                  '0 0 20px rgba(251,191,36,0.4)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{
                backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              GRAND PRIZE
            </motion.h2>
            <motion.p
              className="text-2xl font-bold tracking-wider text-amber-200/80"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
            >
              Platinum Package Worth $5,000
            </motion.p>
            <motion.p
              className="mt-3 text-lg font-medium tracking-[0.2em] text-white/60"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
            >
              SCAN & PLAY NOW
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
