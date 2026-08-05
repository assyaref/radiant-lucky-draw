/**
 * AnimatedWinnerCard
 *
 * Framer Motion winner card animation component.
 * Displays the winner's name, number, and prize with a grand reveal.
 *
 * No business logic - pure animation.
 */

import { motion } from 'framer-motion';
import { type AnimationComponentProps, CELEBRATION_CONFIGS } from '../types';

interface AnimatedWinnerCardProps extends AnimationComponentProps {
  /** Winner's queue number */
  number: string;
  /** Winner's full name */
  fullName: string;
  /** Winner's company */
  company: string;
  /** Prize icon */
  prizeIcon: string;
  /** Prize name */
  prizeName: string;
  /** Prize value */
  prizeValue: string;
}

export function AnimatedWinnerCard({
  active,
  phase,
  celebrationLevel,
  delay = 0,
  number,
  fullName,
  company,
  prizeIcon,
  prizeName,
  prizeValue,
  onComplete,
  className = '',
}: AnimatedWinnerCardProps) {
  const config = CELEBRATION_CONFIGS[celebrationLevel];

  if (!active) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.3, 0.7 * config.glowIntensity, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/30 via-emerald-500/15 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Winner badge */}
        <motion.div
          className="mb-6 rounded-full border border-amber-400/40 bg-amber-400/15 px-8 py-2"
          initial={{ opacity: 0, y: -20 }}
          animate={
            phase === 'enter' || phase === 'active' ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }
          }
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: delay / 1000,
          }}
          onAnimationComplete={() => {
            if (phase === 'exit' || phase === 'completed') {
              onComplete?.();
            }
          }}
        >
          <span className="text-sm font-bold tracking-[0.2em] text-amber-400 uppercase">
            🏆 Winner
          </span>
        </motion.div>

        {/* Crown */}
        <motion.div
          className="mb-4 text-7xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={
            phase === 'enter' || phase === 'active'
              ? { scale: 1, rotate: 0 }
              : { scale: 0, rotate: 180 }
          }
          transition={{
            type: 'spring',
            stiffness: 150,
            damping: 12,
            delay: 0.1 + delay / 1000,
          }}
        >
          👑
        </motion.div>

        {/* Queue number */}
        <motion.div
          className="mb-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-1"
          initial={{ opacity: 0 }}
          animate={phase === 'enter' || phase === 'active' ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.3 + delay / 1000 }}
        >
          <span className="text-sm font-bold text-white/40">#{number}</span>
        </motion.div>

        {/* Name */}
        <motion.h1
          className="mb-2 text-5xl font-black tracking-tight text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={
            phase === 'enter' || phase === 'active' ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
          }
          transition={{
            delay: 0.4 + delay / 1000,
            type: 'spring',
            stiffness: 150,
            damping: 12,
          }}
        >
          {fullName}
        </motion.h1>

        {/* Company */}
        <motion.p
          className="mb-8 text-xl font-light text-white/40"
          initial={{ opacity: 0 }}
          animate={phase === 'enter' || phase === 'active' ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 + delay / 1000 }}
        >
          {company}
        </motion.p>

        {/* Prize info */}
        <motion.div
          className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-white/[0.03] px-6 py-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={
            phase === 'enter' || phase === 'active'
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.8 }
          }
          transition={{
            delay: 0.8 + delay / 1000,
            type: 'spring',
            stiffness: 150,
            damping: 12,
          }}
        >
          <span className="text-2xl">{prizeIcon}</span>
          <div>
            <p className="text-sm font-bold text-white/60">{prizeName}</p>
            <p className="text-lg font-black text-amber-400">{prizeValue}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
