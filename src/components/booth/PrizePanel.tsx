import { memo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedCounter, glowLoop } from '@animations/index';

interface PrizeCardProps {
  icon: string;
  name: string;
  stock: number;
  tier: string;
  isGrand?: boolean;
  index: number;
}

const PrizeCard = memo(function PrizeCard({
  icon,
  name,
  stock,
  tier,
  isGrand,
  index,
}: PrizeCardProps) {
  return (
    <motion.div
      className={`group relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-500 ${
        isGrand
          ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent'
          : 'border-white/8 bg-white/5 hover:border-blue-400/25'
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      {/* Breathing glow behind grand prize */}
      {isGrand && (
        <motion.div
          className="pointer-events-none absolute -inset-2 rounded-2xl"
          variants={glowLoop}
          animate="glow"
        >
          <div className="h-full w-full rounded-2xl bg-gradient-radial from-amber-400/15 to-transparent blur-lg" />
        </motion.div>
      )}

      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        animate={
          isGrand
            ? {
                boxShadow: [
                  'inset 0 0 30px rgba(251,191,36,0.1)',
                  'inset 0 0 50px rgba(251,191,36,0.2)',
                  'inset 0 0 30px rgba(251,191,36,0.1)',
                ],
              }
            : {}
        }
        transition={isGrand ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
      />

      {/* Grand prize shining effect - every 8 seconds */}
      {isGrand && (
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
          animate={{ opacity: [0, 0, 0.5, 0, 0, 0, 0, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          >
            <div className="h-full w-1/3 skew-x-12 bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />
          </motion.div>
        </motion.div>
      )}

      {/* Grand prize border sweep */}
      {isGrand && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          animate={{
            boxShadow: [
              'inset 0 0 0 1px rgba(251,191,36,0.1)',
              'inset 0 0 0 1px rgba(251,191,36,0.5)',
              'inset 0 0 0 1px rgba(251,191,36,0.1)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />
      )}

      <div className="relative z-10 p-3.5">
        {/* Icon + Image showcase */}
        <div className="mb-2.5 flex items-center gap-3">
          {/* Image showcase tile */}
          <motion.div
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${
              isGrand
                ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-blue-500/10'
                : 'border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent'
            }`}
            animate={isGrand ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <motion.span
              className={`text-2xl ${isGrand ? 'drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''}`}
              animate={isGrand ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              {icon}
            </motion.span>
            {/* Image tile shine */}
            <motion.div
              className="pointer-events-none absolute inset-0"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <div className="h-full w-full bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
            </motion.div>
          </motion.div>
          <div>
            <h3
              className={`font-bold tracking-wide ${
                isGrand ? 'text-xl text-amber-300' : 'text-base text-white/80'
              }`}
            >
              {name}
            </h3>
            <span
              className={`text-[11px] font-medium tracking-wider ${
                isGrand ? 'text-amber-400/60' : 'text-white/40'
              }`}
            >
              {tier}
            </span>
          </div>
        </div>

        {/* Stock indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              className={`h-2 w-2 rounded-full ${stock > 0 ? 'bg-green-400' : 'bg-red-400'}`}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            />
            <span
              className={`font-mono text-sm ${isGrand ? 'text-amber-300/80' : 'text-white/50'}`}
            >
              <AnimatedCounter value={stock} duration={0.8} pulseOnChange /> remaining
            </span>
          </div>
          <motion.div
            className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider ${
              isGrand ? 'bg-amber-400/20 text-amber-300' : 'bg-blue-400/10 text-blue-300/70'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            {tier}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

interface PrizePanelProps {
  prizes?: Array<{
    icon: string;
    name: string;
    stock: number;
    tier: string;
    isGrand?: boolean;
  }>;
}

export const PrizePanel = memo(function PrizePanel({ prizes }: PrizePanelProps) {
  const defaultPrizes = [
    { icon: '👑', name: 'Platinum Package', stock: 1, tier: 'GRAND PRIZE', isGrand: true },
    { icon: '💎', name: 'Diamond Bundle', stock: 3, tier: 'PREMIUM' },
    { icon: '🏆', name: 'Gold Edition', stock: 10, tier: 'GOLD' },
    { icon: '🎁', name: 'Silver Gift Set', stock: 25, tier: 'SILVER' },
    { icon: '🎯', name: 'Bronze Reward', stock: 50, tier: 'BRONZE' },
  ];

  const items = (prizes || defaultPrizes).slice(0, 5);

  return (
    <div className="flex flex-col gap-2.5">
      <motion.h3
        className="mb-1 text-lg font-bold tracking-[0.1em] text-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        TODAY'S PRIZES
      </motion.h3>
      {items.map((prize, i) => (
        <PrizeCard key={prize.name} {...prize} index={i} />
      ))}
    </div>
  );
});
