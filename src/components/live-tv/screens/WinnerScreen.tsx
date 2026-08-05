import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLiveTVStore } from '../../../store/live-tv/liveTVStore';

export function WinnerScreen() {
  const { participant, prize, nextStage } = useLiveTVStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      nextStage();
    }, 4000);
    return () => clearTimeout(timer);
  }, [nextStage]);

  if (!participant || !prize) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617]">
      {/* Background glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/30 via-emerald-500/15 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Winner badge */}
        <motion.div
          className="mb-6 rounded-full border border-amber-400/40 bg-amber-400/15 px-8 py-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <span className="text-sm font-bold tracking-[0.2em] text-amber-400 uppercase">
            🏆 Winner
          </span>
        </motion.div>

        {/* Crown */}
        <motion.div
          className="mb-4 text-7xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 12 }}
        >
          👑
        </motion.div>

        {/* Queue number */}
        <motion.div
          className="mb-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-sm font-bold text-white/40">#{participant.number}</span>
        </motion.div>

        {/* Name */}
        <motion.h1
          className="mb-2 text-5xl font-black tracking-tight text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 150, damping: 12 }}
        >
          {participant.fullName}
        </motion.h1>

        {/* Company */}
        <motion.p
          className="mb-8 text-xl font-light text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {participant.company}
        </motion.p>

        {/* Prize info */}
        <motion.div
          className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-white/[0.03] px-6 py-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 150, damping: 12 }}
        >
          <span className="text-2xl">{prize.icon}</span>
          <div>
            <p className="text-sm font-bold text-white/60">{prize.name}</p>
            <p className="text-lg font-black text-amber-400">{prize.value}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
