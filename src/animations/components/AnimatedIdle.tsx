/**
 * AnimatedIdle
 *
 * Framer Motion idle animation component.
 * Subtle ambient animation for when the system is idle.
 *
 * No business logic - pure animation.
 */

import { motion } from 'framer-motion';
import { type AnimationComponentProps } from '../types';

export function AnimatedIdle({
  active,
  phase,
  delay = 0,
  onComplete,
  className = '',
}: AnimationComponentProps) {
  if (!active) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      {/* Subtle ambient pulse */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={
          phase === 'active'
            ? {
                opacity: [0.02, 0.05, 0.02],
              }
            : { opacity: 0 }
        }
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: 'easeInOut',
          delay: delay / 1000,
        }}
        onAnimationComplete={() => {
          if (phase === 'exit' || phase === 'completed') {
            onComplete?.();
          }
        }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/5 via-transparent to-transparent" />
      </motion.div>

      {/* Floating particles */}
      {Array.from({ length: 5 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-amber-400/20"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={
            phase === 'active'
              ? {
                  y: [0, -20, 0],
                  opacity: [0.2, 0.5, 0.2],
                }
              : undefined
          }
          transition={{
            repeat: Infinity,
            duration: 3 + i,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}
