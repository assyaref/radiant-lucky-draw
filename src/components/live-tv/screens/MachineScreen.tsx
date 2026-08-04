import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLiveTVStore } from '../../../store/live-tv/liveTVStore';

export function MachineScreen() {
  const { nextStage } = useLiveTVStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      nextStage();
    }, 3000);
    return () => clearTimeout(timer);
  }, [nextStage]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617]">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.1, 0.4, 0.1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="h-full w-full bg-gradient-radial from-purple-500/15 via-amber-400/8 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Lucky Machine */}
        <motion.div
          className="mb-8 flex h-40 w-40 items-center justify-center rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-purple-500/10 shadow-2xl shadow-amber-400/10"
          animate={{ rotate: [0, 3, -3, 0], scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <motion.span
            className="text-7xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            🎰
          </motion.span>
        </motion.div>

        {/* Spinning lights around machine */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute h-3 w-3 rounded-full"
              style={{
                background: i % 2 === 0 ? '#fbbf24' : '#a78bfa',
                transform: `rotate(${angle}deg) translateY(-100px)`,
              }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
            />
          ))}
        </div>

        <motion.p
          className="text-lg font-bold tracking-[0.2em] text-amber-400/60 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Spinning...
        </motion.p>
      </div>
    </div>
  );
}