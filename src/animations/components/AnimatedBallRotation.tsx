/**
 * AnimatedBallRotation
 *
 * Framer Motion ball rotation animation component.
 * Simulates lottery balls tumbling and rotating in the machine.
 *
 * No business logic - pure animation.
 */

import { motion } from 'framer-motion';
import { type AnimationComponentProps, CELEBRATION_CONFIGS } from '../types';

const BALL_COUNT = 8;
const BALL_COLORS = ['#fbbf24', '#ef4444', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#f59e0b', '#ffffff'];

export function AnimatedBallRotation({
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
    <div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}>
      <motion.div
        className="relative h-64 w-64"
        initial={{ scale: 0, opacity: 0 }}
        animate={
          phase === 'enter'
            ? { scale: 1, opacity: 1 }
            : phase === 'active'
              ? {
                  rotate: [0, 360],
                  scale: [1, 1.05, 1],
                }
              : { scale: 0.5, opacity: 0 }
        }
        transition={{
          duration: animDuration,
          ease: 'linear',
          repeat: phase === 'active' ? Infinity : 0,
          delay: delay / 1000,
        }}
        onAnimationComplete={() => {
          if (phase === 'exit' || phase === 'completed') {
            onComplete?.();
          }
        }}
      >
        {/* Orbital ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-amber-400/20"
          animate={
            phase === 'active'
              ? { rotate: 360 }
              : undefined
          }
          transition={{
            repeat: Infinity,
            duration: animDuration * 0.5,
            ease: 'linear',
          }}
        />

        {/* Balls on orbit */}
        {Array.from({ length: BALL_COUNT }, (_, i) => {
          const angle = (360 / BALL_COUNT) * i;
          const radius = 100;
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;

          return (
            <motion.div
              key={i}
              className="absolute flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
              style={{
                backgroundColor: BALL_COLORS[i % BALL_COLORS.length],
                left: `calc(50% - 16px + ${x}px)`,
                top: `calc(50% - 16px + ${y}px)`,
                boxShadow: `0 0 10px ${BALL_COLORS[i % BALL_COLORS.length]}60`,
              }}
              animate={
                phase === 'active'
                  ? {
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 1, 0.7],
                    }
                  : undefined
              }
              transition={{
                repeat: Infinity,
                duration: 1 + (i * 0.2),
                ease: 'easeInOut',
                delay: i * 0.1,
              }}
            >
              {i + 1}
            </motion.div>
          );
        })}

        {/* Center glow */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{
            opacity: [0.3 * config.glowIntensity, 0.7 * config.glowIntensity, 0.3 * config.glowIntensity],
            scale: [1, 1.2, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'easeInOut',
          }}
          style={{
            background: 'radial-gradient(circle, rgba(251,191,36,0.3), transparent 70%)',
          }}
        />
      </motion.div>
    </div>
  );
}
