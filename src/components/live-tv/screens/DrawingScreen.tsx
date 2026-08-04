import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLiveTVStore } from '../../../store/live-tv/liveTVStore';

const PRIZE_NAMES = ['Grand Prize', 'Smartphone', 'Smartwatch', 'Headphones', 'Gift Card'];

export function DrawingScreen() {
  const { nextStage } = useLiveTVStore();
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);

  useEffect(() => {
    // Rapidly cycle through prizes
    const cycle = setInterval(() => {
      setCurrentPrizeIndex((i) => (i + 1) % PRIZE_NAMES.length);
    }, 100);

    // Stop after 3 seconds and show result
    const stop = setTimeout(() => {
      clearInterval(cycle);
      nextStage();
    }, 3000);

    return () => {
      clearInterval(cycle);
      clearTimeout(stop);
    };
  }, [nextStage]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617]">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/20 via-purple-500/15 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        <motion.p
          className="mb-8 text-sm font-bold tracking-[0.2em] text-amber-400/60 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Drawing...
        </motion.p>

        {/* Rapidly cycling prize name */}
        <motion.div
          key={currentPrizeIndex}
          className="mb-4 rounded-2xl border border-amber-400/20 bg-white/[0.03] px-8 py-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.08 }}
        >
          <motion.span
            className="text-3xl font-black tracking-tight"
            style={{
              backgroundImage: 'linear-gradient(135deg, #fbbf24, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {PRIZE_NAMES[currentPrizeIndex]}
          </motion.span>
        </motion.div>

        {/* Scanning line effect */}
        <motion.div
          className="absolute h-1 w-64 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-sm"
          animate={{ top: ['30%', '70%', '30%'] }}
          transition={{ repeat: Infinity, duration: 0.5, ease: 'linear' }}
        />
      </div>
    </div>
  );
}