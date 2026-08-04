import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { countNumber, glowLoop, floatLoop } from '@animations/index';




export const Clock = memo(function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      variants={floatLoop}
    >

      {/* Breathing glow */}
      <motion.div
        className="pointer-events-none absolute -inset-2 rounded-2xl"
        variants={glowLoop}
        animate="glow"
      >
        <div className="h-full w-full rounded-2xl bg-gradient-radial from-blue-400/10 to-transparent blur-lg" />
      </motion.div>

      {/* Glass reflection */}
      <div className="pointer-events-none absolute -left-4 -top-4 h-12 w-12 rotate-12 rounded-full bg-gradient-to-b from-white/10 to-transparent blur-sm" />


      {/* Time */}
      <div className="flex items-baseline gap-1">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`h-${hours}`}
            className="font-mono text-5xl font-bold text-white/90"
            variants={countNumber}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {hours}
          </motion.span>
        </AnimatePresence>
        <span className="text-3xl font-bold text-amber-400/70">:</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`m-${minutes}`}
            className="font-mono text-5xl font-bold text-white/90"
            variants={countNumber}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {minutes}
          </motion.span>
        </AnimatePresence>
        <span className="text-3xl font-bold text-amber-400/70">:</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`s-${seconds}`}
            className="font-mono text-5xl font-bold text-blue-300/80"
            variants={countNumber}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {seconds}
          </motion.span>
        </AnimatePresence>
      </div>


      {/* Date */}
      <div className="mt-2 text-sm font-medium tracking-wide text-white/40">
        {date}
      </div>

      {/* LED blink indicator */}
      <motion.div
        className="absolute right-3 top-3 h-2 w-2 rounded-full bg-green-400"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
      />
    </motion.div>
  );
});
