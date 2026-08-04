/**
 * AnimatedPrizeReveal
 *
 * Framer Motion prize reveal animation component.
 * Displays the prize with a dramatic reveal effect - icon, name, and value.
 *
 * No business logic - pure animation.
 */

import { motion } from 'framer-motion';
import { type AnimationComponentProps, CELEBRATION_CONFIGS } from '../types';

interface AnimatedPrizeRevealProps extends AnimationComponentProps {
  /** Prize icon emoji */
  icon: string;
  /** Prize name */
  name: string;
  /** Prize value */
  value: string;
  /** Accent color */
  color: string;
}

export function AnimatedPrizeReveal({
  active,
  phase,
  celebrationLevel,
  delay = 0,
  icon,
  name,
  value,
  color,
  onComplete,
  className = '',
}: AnimatedPrizeRevealProps) {
  const config = CELEBRATION_CONFIGS[celebrationLevel];

  if (!active) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}>
      {/* Background glow */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.2, 0.5 * config.glowIntensity, 0.2] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
        <div
          className="h-full w-full blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${color}20, transparent 70%)`,
          }}
        />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Prize icon */}
        <motion.div
          className="mb-6 flex h-32 w-32 items-center justify-center rounded-full"
          style={{
            border: `2px solid ${color}40`,
            background: `radial-gradient(circle, ${color}15, transparent)`,
          }}
          initial={{ scale: 0 }}
          animate={
            phase === 'enter'
              ? { scale: 1, rotate: [0, 5, -5, 0] }
              : phase === 'active'
                ? { rotate: [0, 5, -5, 0] }
                : { scale: 0.5, opacity: 0 }
          }
          transition={{
            scale: { type: 'spring', stiffness: 150, damping: 12, delay: delay / 1000 },
            rotate: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
          }}
          onAnimationComplete={() => {
            if (phase === 'exit' || phase === 'completed') {
              onComplete?.();
            }
          }}
        >
          <motion.span
            className="text-6xl"
            animate={
              phase === 'active'
                ? { scale: [1, 1.1, 1] }
                : undefined
            }
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {icon}
          </motion.span>
        </motion.div>

        {/* Prize name */}
        <motion.h1
          className="mb-2 text-5xl font-black tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={
            phase === 'enter' || phase === 'active'
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: -20 }
          }
          transition={{
            delay: 0.3 + delay / 1000,
            type: 'spring',
            stiffness: 150,
            damping: 12,
          }}
          style={{ color }}
        >
          {name}
        </motion.h1>

        {/* Prize value */}
        <motion.div
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={
            phase === 'enter' || phase === 'active'
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.8 }
          }
          transition={{
            delay: 0.6 + delay / 1000,
            type: 'spring',
            stiffness: 150,
            damping: 12,
          }}
        >
          <span
            className="text-3xl font-black"
            style={{
              backgroundImage: `linear-gradient(135deg, ${color}, #fbbf24)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {value}
          </span>
        </motion.div>

        {/* Sparkle particles */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full"
              style={{
                backgroundColor: color,
                transform: `rotate(${angle}deg) translateY(-140px)`,
              }}
              animate={
                phase === 'active'
                  ? { opacity: [0, 1, 0], scale: [0, 1.5, 0] }
                  : { opacity: 0 }
              }
              transition={{
                repeat: phase === 'active' ? Infinity : 0,
                duration: 1.5,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
