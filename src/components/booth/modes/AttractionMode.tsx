import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooth } from './BoothContext';

const ATTRACTIONS = [
  {
    icon: '🎰',
    title: 'SPIN & WIN',
    subtitle: 'Try your luck now!',
    gradient: 'from-amber-400/30 via-blue-500/20 to-transparent',
  },
  {
    icon: '👑',
    title: 'GRAND PRIZE',
    subtitle: 'Platinum Package Worth $5,000',
    gradient: 'from-amber-400/30 via-amber-500/20 to-transparent',
  },
  {
    icon: '🏆',
    title: 'BE A WINNER',
    subtitle: 'Join our lucky winners!',
    gradient: 'from-blue-400/30 via-purple-500/20 to-transparent',
  },
  {
    icon: '📱',
    title: 'SCAN & PLAY',
    subtitle: 'Quick & easy registration',
    gradient: 'from-emerald-400/30 via-blue-500/20 to-transparent',
  },
  {
    icon: '💎',
    title: 'EXCLUSIVE PRIZES',
    subtitle: 'Luxury items await you',
    gradient: 'from-purple-400/30 via-pink-500/20 to-transparent',
  },
  {
    icon: '⚡',
    title: 'FAST & FUN',
    subtitle: 'Instant results!',
    gradient: 'from-amber-400/30 via-red-500/20 to-transparent',
  },
];

export function AttractionMode() {
  const { mode } = useBooth();

  // Pick random attraction once per mount using lazy state initialization
  // (React 19 recommended pattern for impure values like Math.random).
  const [attraction] = useState(() => ATTRACTIONS[Math.floor(Math.random() * ATTRACTIONS.length)]);

  return (
    <AnimatePresence>
      {mode === 'attraction' && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[40] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background burst */}
          <motion.div
            className={`absolute inset-0 bg-gradient-radial ${attraction.gradient} blur-3xl`}
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          />

          {/* Content */}
          <div className="relative z-10 text-center">
            <motion.div
              className="mb-4 text-7xl"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {attraction.icon}
            </motion.div>

            <motion.h2
              className="mb-2 text-5xl font-black tracking-wider text-white/90"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {attraction.title}
            </motion.h2>

            <motion.p
              className="text-xl font-medium tracking-wide text-white/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.4 }}
            >
              {attraction.subtitle}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
