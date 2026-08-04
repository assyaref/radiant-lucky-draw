import { motion, AnimatePresence } from 'framer-motion';
import { useBooth } from './BoothContext';

export function WelcomeMode() {
  const { mode } = useBooth();

  return (
    <AnimatePresence>
      {mode === 'welcome' && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[50] flex items-center justify-center bg-[#020617]/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Background glow */}
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <div className="h-full w-full bg-gradient-radial from-amber-400/20 via-blue-500/10 to-transparent blur-3xl" />
          </motion.div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6"
            >
              <svg width="80" height="80" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="url(#welcomeGrad)" strokeWidth="3" />
                <path d="M24 8 L28 18 L38 18 L30 24 L33 34 L24 28 L15 34 L18 24 L10 18 L20 18 Z" fill="url(#welcomeGrad)" />
                <defs>
                  <linearGradient id="welcomeGrad" x1="0" y1="0" x2="48" y2="48">
                    <stop stopColor="#fbbf24" />
                    <stop offset="1" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            <motion.h1
              className="mb-4 text-5xl font-black tracking-wider md:text-7xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{
                backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b, #60a5fa, #3b82f6)',
                backgroundSize: '300% 300%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              WELCOME
            </motion.h1>

            <motion.p
              className="text-xl font-light tracking-[0.3em] text-white/60 md:text-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              RADIANT GROUP
            </motion.p>

            <motion.p
              className="mt-4 text-sm font-medium tracking-[0.2em] text-amber-400/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, delay: 1 }}
            >
              LUCKY DRAW DIGITAL BOOTH
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}