import { useState, useEffect, memo } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

const DEMO_WINNERS = [
  { name: 'Sarah Johnson', prize: 'Platinum Package', icon: '👑', color: '#fbbf24' },
  { name: 'Michael Chen', prize: 'Diamond Bundle', icon: '💎', color: '#60a5fa' },
  { name: 'Aisha Rahman', prize: 'Gold Edition', icon: '🏆', color: '#f59e0b' },
  { name: 'David Kim', prize: 'Silver Gift Set', icon: '🎁', color: '#a78bfa' },
  { name: 'Emma Wilson', prize: 'Bronze Reward', icon: '🎯', color: '#34d399' },
];

const CONFETTI_COLORS = ['#fbbf24', '#60a5fa', '#f472b6', '#34d399', '#a78bfa', '#f97316'];

export const WinnerPreview = memo(function WinnerPreview() {
  const [visible, setVisible] = useState(false);
  const [winner, setWinner] = useState(DEMO_WINNERS[0]);

  // Every 30 seconds, show a demo winner preview while idle
  useEffect(() => {
    const showTimer = setInterval(() => {
      setWinner(DEMO_WINNERS[Math.floor(Math.random() * DEMO_WINNERS.length)]);
      setVisible(true);
      // Auto-hide after 6 seconds
      setTimeout(() => setVisible(false), 6000);
    }, 30000);
    return () => clearInterval(showTimer);
  }, []);

  // Hide on user interaction
  useEffect(() => {
    const hide = () => setVisible(false);
    document.addEventListener('click', hide);
    document.addEventListener('touchstart', hide);
    return () => {
      document.removeEventListener('click', hide);
      document.removeEventListener('touchstart', hide);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[35] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Spotlight */}
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <div className="h-full w-full bg-gradient-radial from-amber-400/20 via-transparent to-transparent" />
          </motion.div>

          {/* Confetti particles */}
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-sm"
              style={{
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                left: `${Math.random() * 100}%`,
                top: '-5%',
              }}
              animate={{
                y: ['0vh', '110vh'],
                x: [0, Math.random() > 0.5 ? 60 : -60],
                rotate: [0, 360],
                opacity: [1, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 3 + Math.random() * 2,
                delay: i * 0.1,
                ease: 'easeIn',
              }}
            />
          ))}

          {/* Fireworks bursts */}
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={`fw-${i}`}
              className="absolute h-2 w-2 rounded-full"
              style={{
                backgroundColor: CONFETTI_COLORS[(i + 2) % CONFETTI_COLORS.length],
                left: `${20 + i * 30}%`,
                top: `${20 + (i % 2) * 20}%`,
                boxShadow: '0 0 20px currentColor',
              }}
              animate={{
                scale: [0, 8, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                delay: i * 0.6,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Winner Card */}
          <motion.div
            className="relative z-10 w-[32rem] overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-blue-500/5 to-transparent p-8 backdrop-blur-xl"
            initial={{ scale: 0.7, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            {/* Celebration border glow */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              animate={{
                boxShadow: [
                  'inset 0 0 40px rgba(251,191,36,0.1)',
                  'inset 0 0 70px rgba(251,191,36,0.25)',
                  'inset 0 0 40px rgba(251,191,36,0.1)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />

            {/* Gold shine sweep */}
            <motion.div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                <div className="h-full w-1/3 skew-x-12 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
              </motion.div>
            </motion.div>

            <div className="relative z-10 text-center">
              <motion.div
                className="mb-2 text-xs font-bold tracking-[0.3em] text-amber-400/70"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                🎉 CONGRATULATIONS 🎉
              </motion.div>

              {/* Photo placeholder */}
              <motion.div
                className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-amber-400/50 bg-gradient-to-br from-blue-500/20 to-amber-500/20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <span className="text-5xl">{winner.icon}</span>
              </motion.div>

              <motion.h3
                className="mb-1 text-4xl font-black tracking-wide text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {winner.name}
              </motion.h3>

              <motion.p
                className="text-xl font-medium text-amber-300/80"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              >
                Won the {winner.prize}!
              </motion.p>

              <motion.div
                className="mt-4 text-xs font-medium tracking-wider text-white/40"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                Could you be our next winner? Scan the QR code to play!
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
