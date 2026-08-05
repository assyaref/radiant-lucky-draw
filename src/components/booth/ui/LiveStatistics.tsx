import { motion } from 'framer-motion';
import { useBooth } from '../modes/BoothContext';
import { AnimatedCounter } from '@animations/index';

export function LiveStatistics() {
  const { visitorsToday, drawsCompleted, remainingPrizes, grandPrizeAvailable } = useBooth();

  const stats = [
    {
      label: 'Participants',
      value: visitorsToday,
      icon: '👥',
      color: 'text-blue-300',
      gradient: 'from-blue-400/20 to-blue-500/5',
      glow: 'rgba(59,130,246,0.3)',
    },
    {
      label: 'Completed Draws',
      value: drawsCompleted,
      icon: '🎯',
      color: 'text-amber-300',
      gradient: 'from-amber-400/20 to-amber-500/5',
      glow: 'rgba(251,191,36,0.3)',
    },
    {
      label: 'Remaining Prize',
      value: remainingPrizes,
      icon: '🎁',
      color: 'text-emerald-300',
      gradient: 'from-emerald-400/20 to-emerald-500/5',
      glow: 'rgba(52,211,153,0.3)',
    },
    {
      label: 'Grand Prize',
      value: grandPrizeAvailable ? 1 : 0,
      display: grandPrizeAvailable ? 'Available' : 'Claimed',
      icon: '👑',
      color: grandPrizeAvailable ? 'text-amber-300' : 'text-red-300',
      gradient: grandPrizeAvailable
        ? 'from-amber-400/20 to-amber-500/5'
        : 'from-red-400/20 to-red-500/5',
      glow: grandPrizeAvailable ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className={`relative overflow-hidden rounded-lg border border-white/5 bg-gradient-to-br ${stat.gradient} p-3.5 backdrop-blur-md`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Breathing animation */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{ opacity: [0, 0.35, 0], scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 3, delay: i * 0.5 }}
          >
            <div className="h-full w-full bg-gradient-radial from-white/5 to-transparent blur-xl" />
          </motion.div>

          {/* Top accent line */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </motion.div>

          <div className="relative z-10">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xl">{stat.icon}</span>
              <motion.span
                className={`text-2xl font-black tabular-nums ${stat.color}`}
                style={{ textShadow: `0 0 15px ${stat.glow}` }}
                key={stat.value}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {stat.display !== undefined ? (
                  stat.display
                ) : (
                  <AnimatedCounter value={stat.value} duration={0.8} />
                )}
              </motion.span>
            </div>
            <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
              {stat.label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
