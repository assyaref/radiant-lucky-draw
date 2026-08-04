import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveTVStore } from '../../../store/live-tv/liveTVStore';

export function CountdownScreen() {
  const { nextStage } = useLiveTVStore();
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      nextStage();
      return;
    }

    const timer = setTimeout(() => {
      setCount((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, nextStage]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617]">
      {/* Background glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/20 via-red-500/10 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            className="flex flex-col items-center"
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          >
            <motion.span
              className="text-[12rem] font-black leading-none"
              style={{
                backgroundImage: `linear-gradient(135deg, ${
                  count === 1 ? '#ef4444' : count === 2 ? '#f59e0b' : '#34d399'
                }, #fbbf24)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {count}
            </motion.span>
          </motion.div>
        </AnimatePresence>

        <motion.p
          className="mt-4 text-lg font-bold tracking-[0.2em] text-white/40 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Get Ready
        </motion.p>
      </div>
    </div>
  );
}