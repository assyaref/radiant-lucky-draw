/**
 * AnimatedLighting
 *
 * Framer Motion lighting animation component.
 * Creates dramatic lighting effects with pulsing spotlights and color shifts.
 *
 * No business logic - pure animation.
 */

import { motion } from 'framer-motion';
import { type AnimationComponentProps, CELEBRATION_CONFIGS } from '../types';

export function AnimatedLighting({
  active,
  phase,
  celebrationLevel,
  duration,
  delay = 0,
  onComplete,
  className = '',
}: AnimationComponentProps) {
  const config = CELEBRATION_CONFIGS[celebrationLevel];

  if (!active) return null;

  const animDuration = (duration / 1000) * config.speedMultiplier;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Main spotlight - top */}
      <motion.div
        className="absolute left-1/2 top-0 h-[60vh] w-[80vw] -translate-x-1/2"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={
          phase === 'enter'
            ? { opacity: 0.6 * config.glowIntensity, scaleY: 1 }
            : phase === 'active'
              ? {
                  opacity: [
                    0.4 * config.glowIntensity,
                    0.8 * config.glowIntensity,
                    0.4 * config.glowIntensity,
                  ],
                }
              : { opacity: 0, scaleY: 0.5 }
        }
        transition={{
          duration: animDuration * 0.5,
          ease: 'easeOut',
          repeat: phase === 'active' ? Infinity : 0,
          delay: delay / 1000,
        }}
        onAnimationComplete={() => {
          if (phase === 'exit' || phase === 'completed') {
            onComplete?.();
          }
        }}
      >
        <div
          className="h-full w-full"
          style={{
            background:
              'linear-gradient(180deg, rgba(251,191,36,0.3) 0%, rgba(251,191,36,0.1) 40%, transparent 100%)',
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
          }}
        />
      </motion.div>

      {/* Left spotlight */}
      <motion.div
        className="absolute bottom-0 left-0 h-[80vh] w-[40vw]"
        initial={{ opacity: 0, skewX: 15 }}
        animate={
          phase === 'active'
            ? {
                opacity: [
                  0.2 * config.glowIntensity,
                  0.5 * config.glowIntensity,
                  0.2 * config.glowIntensity,
                ],
              }
            : { opacity: 0 }
        }
        transition={{
          duration: 2,
          repeat: phase === 'active' ? Infinity : 0,
          ease: 'easeInOut',
          delay: delay / 1000,
        }}
      >
        <div
          className="h-full w-full"
          style={{
            background: 'linear-gradient(90deg, rgba(59,130,246,0.2) 0%, transparent 100%)',
            clipPath: 'polygon(0% 0%, 100% 20%, 100% 80%, 0% 100%)',
          }}
        />
      </motion.div>

      {/* Right spotlight */}
      <motion.div
        className="absolute bottom-0 right-0 h-[80vh] w-[40vw]"
        initial={{ opacity: 0, skewX: -15 }}
        animate={
          phase === 'active'
            ? {
                opacity: [
                  0.2 * config.glowIntensity,
                  0.5 * config.glowIntensity,
                  0.2 * config.glowIntensity,
                ],
              }
            : { opacity: 0 }
        }
        transition={{
          duration: 2.5,
          repeat: phase === 'active' ? Infinity : 0,
          ease: 'easeInOut',
          delay: delay / 1000,
        }}
      >
        <div
          className="h-full w-full"
          style={{
            background: 'linear-gradient(-90deg, rgba(239,68,68,0.2) 0%, transparent 100%)',
            clipPath: 'polygon(0% 20%, 100% 0%, 100% 100%, 0% 80%)',
          }}
        />
      </motion.div>

      {/* Color wash */}
      <motion.div
        className="absolute inset-0"
        animate={
          phase === 'active'
            ? {
                backgroundColor: [
                  'rgba(251,191,36,0.02)',
                  'rgba(59,130,246,0.02)',
                  'rgba(239,68,68,0.02)',
                  'rgba(251,191,36,0.02)',
                ],
              }
            : undefined
        }
        transition={{
          duration: 4,
          repeat: phase === 'active' ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
