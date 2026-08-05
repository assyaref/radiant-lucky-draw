import { motion, AnimatePresence } from 'framer-motion';
import { useBooth } from '../modes/BoothContext';

export function EmergencyMode() {
  const { mode } = useBooth();

  return (
    <AnimatePresence>
      {mode === 'emergency' && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-[#020617]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Elegant gradient background */}
          <div className="absolute inset-0 bg-gradient-radial from-amber-400/10 via-blue-500/5 to-transparent blur-3xl" />

          <div className="relative z-10 text-center">
            {/* Radiant logo */}
            <motion.div
              className="mb-8"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <svg width="64" height="64" viewBox="0 0 48 48" fill="none" className="mx-auto">
                <circle cx="24" cy="24" r="22" stroke="url(#emergencyGrad)" strokeWidth="3" />
                <path
                  d="M24 8 L28 18 L38 18 L30 24 L33 34 L24 28 L15 34 L18 24 L10 18 L20 18 Z"
                  fill="url(#emergencyGrad)"
                />
                <defs>
                  <linearGradient id="emergencyGrad" x1="0" y1="0" x2="48" y2="48">
                    <stop stopColor="#fbbf24" />
                    <stop offset="1" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            <motion.h2
              className="mb-4 text-4xl font-black tracking-wider text-white/80 md:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Please Wait
            </motion.h2>

            <motion.p
              className="mb-8 text-lg font-light tracking-wide text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              System is reconnecting...
            </motion.p>

            {/* Animated dots */}
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-amber-400/60"
                  animate={{ scale: [0.5, 1, 0.5], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                />
              ))}
            </div>

            {/* Auto-retry indicator */}
            <motion.p
              className="mt-8 text-xs font-medium tracking-wider text-white/20"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Automatically reconnecting...
            </motion.p>

            {/* No technical error messages - elegant experience */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
