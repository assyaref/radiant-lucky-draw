import { motion } from 'framer-motion';

export function IdleScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617]">
      {/* Background glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/10 via-blue-500/5 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/5"
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        >
          <span className="text-5xl">🎰</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="mb-2 text-4xl font-black tracking-wider"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Lucky Draw
        </motion.h1>

        <motion.p
          className="mb-8 text-sm font-light text-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Waiting for next participant...
        </motion.p>

        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-amber-400/50"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}