import { motion } from 'framer-motion';
import { useRegistration } from './RegistrationContext';

const PRIZE_PREVIEWS = [
  { emoji: '👑', label: 'Grand Prize', value: '$5,000' },
  { emoji: '📱', label: 'Smartphone', value: '$1,200' },
  { emoji: '⌚', label: 'Smartwatch', value: '$800' },
];

export function WelcomeScreen() {
  const { goToStep } = useRegistration();

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
        animate={{ opacity: [0.15, 0.35, 0.15] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/15 via-blue-500/8 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        {/* Animated Lucky Machine */}
        <motion.div
          className="mb-6 text-6xl"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 12 }}
        >
          <motion.span
            className="inline-block"
            animate={{ rotateY: [0, 360] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          >
            🎰
          </motion.span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="mb-3 text-4xl font-black tracking-wider"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
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

        {/* Subtitle */}
        <motion.p
          className="mb-8 text-center text-sm font-light leading-relaxed text-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Join the Lucky Draw and Win Amazing Prizes
        </motion.p>

        {/* Prize Preview */}
        <motion.div
          className="mb-8 flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {PRIZE_PREVIEWS.map((prize, i) => (
            <motion.div
              key={prize.label}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              whileHover={{ scale: 1.05, borderColor: 'rgba(251,191,36,0.3)' }}
            >
              <span className="text-2xl">{prize.emoji}</span>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{prize.label}</p>
              <p className="text-xs font-black text-amber-300">{prize.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* START Button */}
        <motion.button
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-4 text-lg font-bold text-slate-900 shadow-lg shadow-amber-400/25"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(251,191,36,0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => goToStep('form')}
        >
          START
        </motion.button>

        {/* Footer */}
        <motion.p
          className="mt-6 text-[10px] font-medium tracking-wider text-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          By continuing, you agree to our Terms & Conditions
        </motion.p>
      </div>
    </motion.div>
  );
}