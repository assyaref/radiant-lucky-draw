import { memo } from 'react';
import { motion } from 'framer-motion';
import { glowLoop, floatLoop } from '@animations/index';

interface WinnerWallProps {
  winnerName?: string;
  prize?: string;
}

const FIREWORK_COLORS = ['#fbbf24', '#60a5fa', '#f472b6', '#34d399', '#a78bfa'];

export const WinnerWall = memo(function WinnerWall({ winnerName = '—', prize = '—' }: WinnerWallProps) {
  const hasWinner = winnerName !== '—' && winnerName !== '';
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-700 ${
        hasWinner
          ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-amber-400/8 to-blue-500/8 p-5'
          : 'border-amber-400/25 bg-gradient-to-br from-amber-500/12 via-amber-400/6 to-blue-500/5 p-4'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      variants={floatLoop}
      layout
    >

      {/* Firework particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <motion.div
            key={`fw-${i}`}
            className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
            style={{
              background: FIREWORK_COLORS[i % FIREWORK_COLORS.length],
              boxShadow: `0 0 8px ${FIREWORK_COLORS[i % FIREWORK_COLORS.length]}`,
            }}
            animate={{
              x: [0, Math.cos(angle) * 70],
              y: [0, Math.sin(angle) * 70],
              opacity: [0, 1, 0],
              scale: [0, 1.4, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              delay: i * 0.3,
              ease: 'easeOut',
            }}
          />
        );
      })}

      {/* Subtle confetti */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`cf-${i}`}
          className="pointer-events-none absolute h-1.5 w-1 rounded-sm"
          style={{
            background: FIREWORK_COLORS[(i + 2) % FIREWORK_COLORS.length],
            left: `${10 + i * 15}%`,
            top: '-5%',
          }}
          animate={{
            y: ['0%', '1200%'],
            x: [0, i % 2 === 0 ? 20 : -20],
            rotate: [0, 360],
            opacity: [0, 1, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + i * 0.4,
            delay: i * 0.5,
            ease: 'easeIn',
          }}
        />
      ))}

      {/* Breathing gold glow */}
      <motion.div
        className="pointer-events-none absolute -inset-2 rounded-2xl"
        variants={glowLoop}
        animate="glow"
      >
        <div className="h-full w-full rounded-2xl bg-gradient-radial from-amber-400/20 to-transparent blur-xl" />
      </motion.div>

      {/* Celebration border - animated */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        animate={{
          boxShadow: [
            'inset 0 0 20px rgba(251,191,36,0.1)',
            'inset 0 0 40px rgba(251,191,36,0.25)',
            'inset 0 0 20px rgba(251,191,36,0.1)',
          ],
        }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
      />

      {/* Gold shine sweep */}
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        animate={{ opacity: [0, 0.35, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >
          <div className="h-full w-1/3 skew-x-12 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
        </motion.div>
      </motion.div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2">
        <motion.span
          className="text-sm"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          🏆
        </motion.span>
        <span className="text-xs font-bold tracking-[0.15em] text-amber-400/70 uppercase">
          Current Winner
        </span>
      </div>

      {/* Winner content */}
      <div className="relative z-10 mt-3 flex items-center gap-3">
        {/* Photo placeholder */}
        <motion.div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-blue-500/10"
          animate={{ boxShadow: ['0 0 15px rgba(251,191,36,0.2)', '0 0 30px rgba(251,191,36,0.4)', '0 0 15px rgba(251,191,36,0.2)'] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <span className="text-2xl">👤</span>
        </motion.div>

        <div className="min-w-0">
          <motion.div
            className="truncate text-2xl font-black text-amber-300"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{ textShadow: '0 0 20px rgba(251,191,36,0.3)' }}
          >
            {winnerName}
          </motion.div>
          <div className="mt-0.5 truncate text-sm font-medium text-amber-400/60">
            {prize}
          </div>
        </div>
      </div>

      {/* Gold divider */}
      <motion.div
        className="relative z-10 mt-3 h-px w-full"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <div className="h-full w-full bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
      </motion.div>
    </motion.div>
  );
});
