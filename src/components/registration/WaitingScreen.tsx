import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRegistration } from './RegistrationContext';

function ProgressRing({ progress, size = 160, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress ring */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#progressGrad)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function WaitingScreen() {
  const { queueNumber, estimatedWait, currentQueue } = useRegistration();
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Simulate queue progress
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        const pct = Math.min((next / (estimatedWait * 60)) * 100, 95);
        setProgress(pct);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [estimatedWait]);

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/10 via-blue-500/8 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        {/* Progress Ring with Queue Number */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 12 }}
        >
          <ProgressRing progress={progress} size={180} strokeWidth={6} />

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase">
              Your Number
            </p>
            <motion.p
              className="text-4xl font-black tracking-tight"
              style={{
                backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              #{queueNumber}
            </motion.p>
          </div>
        </motion.div>

        {/* Current Queue */}
        <motion.div
          className="mb-6 w-full rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase">
                Current Queue
              </p>
              <p className="mt-1 text-2xl font-black text-white">#{currentQueue}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase">
                Est. Wait
              </p>
              <p className="mt-1 text-lg font-black text-amber-300">{estimatedWait} min</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-blue-400"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Status */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="h-2.5 w-2.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span className="text-sm font-medium tracking-wider text-emerald-400/70 uppercase">
            Waiting...
          </span>
        </motion.div>

        {/* Elapsed time */}
        <motion.p
          className="mt-4 text-xs font-light text-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Elapsed: {formatTime(elapsed)}
        </motion.p>
      </div>
    </motion.div>
  );
}