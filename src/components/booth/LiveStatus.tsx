import { memo } from 'react';
import { motion } from 'framer-motion';
import { glowLoop, floatLoop } from '@animations/index';

interface LiveStatusProps {
  isOnline?: boolean;
  drawStatus?: string;
}

export const LiveStatus = memo(function LiveStatus({
  isOnline = true,
  drawStatus = 'READY',
}: LiveStatusProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      variants={floatLoop}
    >
      {/* Breathing glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        variants={glowLoop}
        animate="glow"
      >
        <div className="h-full w-full rounded-2xl bg-gradient-radial from-blue-500/10 via-transparent to-transparent" />
      </motion.div>

      {/* Glass reflection */}
      <div className="pointer-events-none absolute -left-4 -top-4 h-10 w-10 rotate-12 rounded-full bg-gradient-to-b from-white/10 to-transparent blur-sm" />

      <div className="text-xs font-bold tracking-[0.15em] text-white/40">SYSTEM STATUS</div>

      <div className="mt-3 space-y-2">
        {/* Online status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Connection</span>
          <div className="flex items-center gap-2">
            <motion.div
              className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            />
            <span className={`text-sm font-bold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Draw status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Draw Status</span>
          <div className="flex items-center gap-2">
            <motion.div
              className="h-2.5 w-2.5 rounded-full bg-amber-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.5 }}
            />
            <span className="text-sm font-bold text-amber-300">{drawStatus}</span>
          </div>
        </div>

        {/* Server status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Server</span>
          <div className="flex items-center gap-2">
            <motion.div
              className="h-2.5 w-2.5 rounded-full bg-blue-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 1 }}
            />
            <span className="text-sm font-bold text-blue-300">ACTIVE</span>
          </div>
        </div>

        {/* Participants today */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Participants</span>
          <div className="flex items-center gap-2">
            <motion.div
              className="h-2.5 w-2.5 rounded-full bg-violet-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 1.5 }}
            />
            <span className="text-sm font-bold text-violet-300">1,248</span>
          </div>
        </div>

        {/* Prize stock */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Prize Stock</span>
          <div className="flex items-center gap-2">
            <motion.div
              className="h-2.5 w-2.5 rounded-full bg-rose-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 2 }}
            />
            <span className="text-sm font-bold text-rose-300">24 LEFT</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
