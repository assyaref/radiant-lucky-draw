import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLiveTVStore } from '../../../store/live-tv/liveTVStore';

export function CongratulationsScreen() {
  const { participant, prize, resetTV } = useLiveTVStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      resetTV();
    }, 5000);
    return () => clearTimeout(timer);
  }, [resetTV]);

  if (!participant || !prize) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617]">
      {/* Background glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/25 via-emerald-500/15 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Congratulations text */}
        <motion.h1
          className="mb-4 text-6xl font-black tracking-tight"
          initial={{ opacity: 0, y: -30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 10 }}
          style={{
            backgroundImage: 'linear-gradient(135deg, #fbbf24, #ef4444, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Congratulations!
        </motion.h1>

        {/* Name */}
        <motion.h2
          className="mb-2 text-3xl font-black text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {participant.fullName}
        </motion.h2>

        {/* Prize won */}
        <motion.div
          className="mb-8 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-white/[0.05] px-6 py-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 150, damping: 12 }}
        >
          <span className="text-2xl">{prize.icon}</span>
          <div>
            <p className="text-xs font-bold tracking-wider text-white/40 uppercase">Won</p>
            <p className="text-lg font-black text-amber-400">
              {prize.name} — {prize.value}
            </p>
          </div>
        </motion.div>

        {/* Returning to idle */}
        <motion.p
          className="text-sm font-light text-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          Returning to idle...
        </motion.p>

        {/* Progress bar */}
        <motion.div
          className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 5, ease: 'linear' }}
          />
        </motion.div>
      </div>
    </div>
  );
}