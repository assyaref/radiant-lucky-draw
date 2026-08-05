import { motion } from 'framer-motion';
import { useBooth } from '../modes/BoothContext';
import { glowLoop } from '@animations/index';

export function QueueVisualization() {
  const { queueCount, nowServing, estimatedWait } = useBooth();

  return (
    <motion.div
      className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Breathing glow */}
      <motion.div
        className="pointer-events-none absolute -inset-2 rounded-xl"
        variants={glowLoop}
        animate="glow"
      >
        <div className="h-full w-full rounded-xl bg-gradient-radial from-blue-400/10 to-transparent blur-lg" />
      </motion.div>

      <h3 className="relative z-10 flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] text-white/40 uppercase">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
        Queue Status
      </h3>

      <div className="relative z-10 grid grid-cols-3 gap-3">
        {/* Now Serving */}
        <div className="text-center">
          <motion.p
            className="text-2xl font-black tabular-nums"
            style={{
              backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.3))',
            }}
            key={nowServing}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            #{nowServing}
          </motion.p>
          <p className="text-[9px] font-medium text-white/30 uppercase tracking-wider">
            Now Serving
          </p>
        </div>

        {/* In Queue */}
        <div className="text-center">
          <motion.p
            className="text-2xl font-black tabular-nums text-blue-300"
            style={{ textShadow: '0 0 12px rgba(59,130,246,0.3)' }}
            key={queueCount}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {queueCount}
          </motion.p>
          <p className="text-[9px] font-medium text-white/30 uppercase tracking-wider">In Queue</p>
        </div>

        {/* Est. Wait */}
        <div className="text-center">
          <motion.p
            className="text-2xl font-black tabular-nums text-emerald-300"
            style={{ textShadow: '0 0 12px rgba(52,211,153,0.3)' }}
            key={estimatedWait}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {estimatedWait}m
          </motion.p>
          <p className="text-[9px] font-medium text-white/30 uppercase tracking-wider">Est. Wait</p>
        </div>
      </div>

      {/* Realtime progress bar */}
      <div className="relative z-10 h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-blue-500 to-amber-400"
          animate={{
            width: [`${nowServing % 100}%`, `${(nowServing % 100) + 10}%`],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  );
}
