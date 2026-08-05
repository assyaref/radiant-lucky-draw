import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLiveTVStore } from '../../../store/live-tv/liveTVStore';

export function PrizeRevealScreen() {
  const { prize, nextStage } = useLiveTVStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      nextStage();
    }, 4000);
    return () => clearTimeout(timer);
  }, [nextStage]);

  if (!prize) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617]">
      {/* Background glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
        <div
          className="h-full w-full blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${prize.color}20, transparent 70%)`,
          }}
        />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Prize icon */}
        <motion.div
          className="mb-6 flex h-32 w-32 items-center justify-center rounded-full"
          style={{
            border: `2px solid ${prize.color}40`,
            background: `radial-gradient(circle, ${prize.color}15, transparent)`,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
          transition={{
            scale: { type: 'spring', stiffness: 150, damping: 12 },
            rotate: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
          }}
        >
          <motion.span
            className="text-6xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {prize.icon}
          </motion.span>
        </motion.div>

        {/* Prize name */}
        <motion.h1
          className="mb-2 text-5xl font-black tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 150, damping: 12 }}
          style={{ color: prize.color }}
        >
          {prize.name}
        </motion.h1>

        {/* Prize value */}
        <motion.div
          className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 150, damping: 12 }}
        >
          <span
            className="text-3xl font-black"
            style={{
              backgroundImage: `linear-gradient(135deg, ${prize.color}, #fbbf24)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {prize.value}
          </span>
        </motion.div>

        {/* Sparkle particles */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full"
              style={{
                backgroundColor: prize.color,
                transform: `rotate(${angle}deg) translateY(-140px)`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
