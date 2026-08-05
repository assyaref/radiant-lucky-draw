/**
 * AnimatedCountdown
 *
 * Framer Motion countdown animation component.
 * Displays a pulsing number countdown (3, 2, 1) with dramatic entrance/exit.
 *
 * No business logic - pure animation.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { type AnimationComponentProps, CELEBRATION_CONFIGS } from '../types';

interface AnimatedCountdownProps extends AnimationComponentProps {
  /** Current countdown value */
  count: number;
}

export function AnimatedCountdown({
  active,
  phase,
  celebrationLevel,
  duration,
  delay = 0,
  count,
  onComplete,
  className = '',
}: AnimatedCountdownProps) {
  const config = CELEBRATION_CONFIGS[celebrationLevel];

  if (!active) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.2, 0.5 * config.glowIntensity, 0.2],
        }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/20 via-red-500/10 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            className="flex flex-col items-center"
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 12,
              delay: delay / 1000,
            }}
            onAnimationComplete={() => {
              if (phase === 'exit' || phase === 'completed') {
                onComplete?.();
              }
            }}
          >
            <motion.span
              className="text-[12rem] font-black leading-none"
              style={{
                backgroundImage: `linear-gradient(135deg, ${
                  count === 1 ? '#ef4444' : count === 2 ? '#f59e0b' : '#34d399'
                }, #fbbf24)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              animate={
                phase === 'active'
                  ? {
                      scale: [1, 1.05, 1],
                      opacity: [1, 0.8, 1],
                    }
                  : undefined
              }
              transition={{
                repeat: Infinity,
                duration: duration / 1000,
                ease: 'easeInOut',
              }}
            >
              {count}
            </motion.span>

            <motion.p
              className="mt-4 text-lg font-bold tracking-[0.2em] text-white/40 uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + delay / 1000 }}
            >
              Get Ready
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
