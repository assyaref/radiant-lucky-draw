import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRegistration } from './RegistrationContext';

export function SplashScreen() {
  const { goToStep } = useRegistration();

  useEffect(() => {
    const timer = setTimeout(() => goToStep('welcome'), 2000);
    return () => clearTimeout(timer);
  }, [goToStep]);

  return (
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center bg-[#020617] px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/20 via-blue-500/10 to-transparent blur-3xl" />
      </motion.div>

      {/* Logo */}
      <motion.div
        className="relative z-10 mb-6"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="url(#splashGrad)" strokeWidth="3" />
          <path
            d="M24 8 L28 18 L38 18 L30 24 L33 34 L24 28 L15 34 L18 24 L10 18 L20 18 Z"
            fill="url(#splashGrad)"
          />
          <defs>
            <linearGradient id="splashGrad" x1="0" y1="0" x2="48" y2="48">
              <stop stopColor="#fbbf24" />
              <stop offset="1" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Brand name */}
      <motion.h1
        className="relative z-10 mb-2 text-2xl font-black tracking-[0.15em]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{
          backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b, #60a5fa, #3b82f6)',
          backgroundSize: '300% 300%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        RADIANT
      </motion.h1>

      <motion.p
        className="relative z-10 text-xs font-medium tracking-[0.3em] text-white/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        LUCKY DRAW
      </motion.p>

      {/* Loading dots */}
      <motion.div
        className="relative z-10 mt-12 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full"
            style={{
              background:
                i === 1
                  ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                  : 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            }}
            animate={{ scale: [0.5, 1, 0.5], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
