import { motion } from 'framer-motion';

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617]">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="h-full w-full bg-gradient-radial from-blue-500/10 via-amber-400/5 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Spinning ring */}
        <motion.div
          className="mb-8 h-20 w-20 rounded-full border-2 border-amber-400/20 border-t-amber-400"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />

        {/* Loading text */}
        <motion.p
          className="text-lg font-bold tracking-wider text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Loading
        </motion.p>

        {/* Animated dots */}
        <div className="mt-4 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-amber-400"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}