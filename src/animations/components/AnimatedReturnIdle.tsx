/**
 * AnimatedReturnIdle
 *
 * Framer Motion return-to-idle animation component.
 * Smoothly fades out all effects and transitions back to idle state.
 *
 * No business logic - pure animation.
 */

import { motion } from 'framer-motion';
import { type AnimationComponentProps } from '../types';

export function AnimatedReturnIdle({
  active,
  phase,
  duration,
  delay = 0,
  onComplete,
  className = '',
}: AnimationComponentProps) {
  if (!active) return null;

  const animDuration = duration / 1000;

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      {/* Fade to dark */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={
          phase === 'enter'
            ? { opacity: 0.3 }
            : phase === 'active'
              ? { opacity: [0.3, 0.1, 0.3] }
              : { opacity: 0 }
        }
        transition={{
          duration: animDuration * 0.5,
          ease: 'easeInOut',
          delay: delay / 1000,
        }}
        onAnimationComplete={() => {
          if (phase === 'exit' || phase === 'completed') {
            onComplete?.();
          }
        }}
      />

      {/* Iris out effect */}
      <motion.div
        className="absolute inset-0"
        initial={{ clipPath: 'circle(100% at 50% 50%)' }}
        animate={
          phase === 'enter'
            ? { clipPath: 'circle(0% at 50% 50%)' }
            : phase === 'exit'
              ? { clipPath: 'circle(100% at 50% 50%)' }
              : undefined
        }
        transition={{
          duration: animDuration,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: delay / 1000,
        }}
        style={{
          backgroundColor: 'rgba(2, 6, 23, 0.95)',
        }}
      />

      {/* Particles settling */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-amber-400/30"
          style={{
            left: `${10 + i * 10}%`,
            top: '50%',
          }}
          animate={
            phase === 'enter'
              ? {
                  y: [0, 50, 100],
                  opacity: [0.5, 0.2, 0],
                }
              : { opacity: 0 }
          }
          transition={{
            duration: animDuration,
            ease: 'easeIn',
            delay: i * 0.05 + delay / 1000,
          }}
        />
      ))}
    </div>
  );
}
