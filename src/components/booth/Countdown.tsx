import { useEffect, useState, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { countNumber, glowLoop, floatLoop } from '@animations/index';
import { useAudio } from './audio/AudioManager';

interface CountdownProps {
  targetDate?: Date;
}

const TOTAL_SECONDS = 300; // 5 minutes

export const Countdown = memo(function Countdown({ targetDate }: CountdownProps) {
  const getTarget = () => {
    if (targetDate) return targetDate;
    const next = new Date();
    next.setMinutes(next.getMinutes() + 5);
    next.setSeconds(0);
    return next;
  };

  const [target] = useState(getTarget);
  const [remaining, setRemaining] = useState(0);
  const { playSfx } = useAudio();
  const prevRemainingRef = useRef(remaining);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [target]);

  // Play countdown tick SFX when the seconds value changes
  useEffect(() => {
    if (prevRemainingRef.current !== remaining && remaining > 0) {
      playSfx('countdown');
    }
    prevRemainingRef.current = remaining;
  }, [remaining, playSfx]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = remaining / TOTAL_SECONDS;
  const circumference = 2 * Math.PI * 64;
  const isNearZero = remaining <= 10 && remaining > 0;

  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Animated progress ring - enlarged diameter */}
      <motion.div className="relative h-52 w-52" variants={floatLoop} animate="float">
        {/* Glow behind ring */}
        <motion.div className="absolute -inset-4 rounded-full" variants={glowLoop} animate="glow">
          <div className="h-full w-full rounded-full bg-gradient-radial from-amber-400/25 via-blue-500/12 to-transparent blur-xl" />
        </motion.div>

        {/* Track ring */}
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r="64"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="7"
          />
          {/* Progress ring */}
          <motion.circle
            cx="70"
            cy="70"
            r="64"
            fill="none"
            stroke="url(#countdownGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
          <defs>
            <linearGradient id="countdownGrad" x1="0" y1="0" x2="140" y2="140">
              <stop stopColor="#fbbf24" />
              <stop offset="1" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>

        {/* Pulse near zero */}
        {isNearZero && (
          <motion.div
            className="pointer-events-none absolute -inset-4 rounded-full"
            animate={{
              boxShadow: [
                '0 0 30px rgba(251,191,36,0.2)',
                '0 0 60px rgba(251,191,36,0.5)',
                '0 0 30px rgba(251,191,36,0.2)',
              ],
              scale: [1, 1.05, 1],
            }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
          />
        )}

        {/* Light burst when countdown reaches zero */}
        {remaining === 0 && (
          <motion.div
            className="pointer-events-none absolute -inset-8 rounded-full"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.6, 2.4] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
          >
            <div className="h-full w-full rounded-full bg-gradient-radial from-amber-400/60 via-blue-500/35 to-transparent blur-xl" />
          </motion.div>
        )}

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xs font-bold tracking-[0.25em] text-white/45">NEXT DRAW</div>
          <div className="mt-1 flex items-baseline gap-1">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`m-${minutes}`}
                className={`font-mono text-6xl font-black drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] ${
                  isNearZero ? 'text-red-400' : 'text-amber-300'
                }`}
                variants={countNumber}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {String(minutes).padStart(2, '0')}
              </motion.span>
            </AnimatePresence>
            <span className="text-3xl font-bold text-amber-400/60">:</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`s-${seconds}`}
                className={`font-mono text-6xl font-black drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] ${
                  isNearZero ? 'text-red-400' : 'text-amber-300'
                }`}
                variants={countNumber}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {String(seconds).padStart(2, '0')}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="mt-1 flex gap-4 text-[10px] font-medium tracking-wider text-white/35">
            <span>MIN</span>
            <span>SEC</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
