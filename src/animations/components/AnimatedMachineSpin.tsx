/**
 * AnimatedMachineSpin
 *
 * Framer Motion machine spin animation component.
 * Simulates the lucky draw machine spinning with rotating elements.
 *
 * No business logic - pure animation.
 */

import { motion } from 'framer-motion';
import { type AnimationComponentProps, CELEBRATION_CONFIGS } from '../types';

export function AnimatedMachineSpin({
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

  const spinDuration = (duration / 1000) * config.speedMultiplier;

  return (
    <div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}>
      {/* Outer rotating ring */}
      <motion.div
        className="absolute h-80 w-80 rounded-full border-2 border-amber-400/20"
        initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
        animate={
          phase === 'enter'
            ? { scale: 1, opacity: 1, rotate: 0 }
            : phase === 'active'
              ? {
                  rotate: 360,
                  scale: [1, 1.05, 1],
                  opacity: [0.8, 1, 0.8],
                }
              : { scale: 0.9, opacity: 0 }
        }
        transition={{
          duration: spinDuration,
          ease: phase === 'enter' ? 'easeOut' : 'linear',
          repeat: phase === 'active' ? Infinity : 0,
          delay: delay / 1000,
        }}
        onAnimationComplete={() => {
          if (phase === 'exit' || phase === 'completed') {
            onComplete?.();
          }
        }}
      />

      {/* Middle rotating ring */}
      <motion.div
        className="absolute h-60 w-60 rounded-full border-2 border-amber-400/10"
        initial={{ rotate: 360, scale: 0.8, opacity: 0 }}
        animate={
          phase === 'enter'
            ? { scale: 1, opacity: 1, rotate: 360 }
            : phase === 'active'
              ? {
                  rotate: -360,
                  scale: [1, 1.03, 1],
                }
              : { scale: 0.9, opacity: 0 }
        }
        transition={{
          duration: spinDuration * 0.8,
          ease: 'linear',
          repeat: phase === 'active' ? Infinity : 0,
          delay: delay / 1000,
        }}
      />

      {/* Inner spinning element */}
      <motion.div
        className="flex h-40 w-40 items-center justify-center"
        initial={{ rotate: -180, scale: 0 }}
        animate={
          phase === 'enter'
            ? { scale: 1, rotate: 0 }
            : phase === 'active'
              ? {
                  rotate: 720,
                  scale: [1, 1.1, 1],
                }
              : { scale: 0, rotate: 180 }
        }
        transition={{
          duration: spinDuration * 0.6,
          ease: 'easeInOut',
          repeat: phase === 'active' ? Infinity : 0,
          delay: delay / 1000,
        }}
      >
        <motion.span
          className="text-6xl"
          animate={
            phase === 'active'
              ? {
                  filter: [
                    'brightness(1)',
                    'brightness(1.5)',
                    'brightness(1)',
                  ],
                }
              : undefined
          }
          transition={{
            repeat: Infinity,
            duration: 0.5,
            ease: 'easeInOut',
          }}
        >
          🎰
        </motion.span>
      </motion.div>

      {/* Glow effect */}
      <motion.div
        className="absolute h-96 w-96 rounded-full"
        animate={{
          opacity: [0.1 * config.glowIntensity, 0.3 * config.glowIntensity, 0.1 * config.glowIntensity],
          scale: [1, 1.1, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.15), transparent 70%)',
        }}
      />
    </div>
  );
}
