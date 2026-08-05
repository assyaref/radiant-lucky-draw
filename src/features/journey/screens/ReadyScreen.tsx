import { memo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, radius, shadows, transitions, loopDurations } from '@design-system/index';
import { GlassPanel } from '../components/GlassPanel';
import { useJourney } from '../JourneyContext';

const COUNTDOWN_START = 3;

/**
 * ReadyScreen
 *
 * Displayed when the participant reaches the front of the queue.
 * Shows "You're Next", a large glowing READY badge, an animated
 * 3-2-1 countdown, and a Start Draw button that uses the existing
 * draw flow (via JourneyContext navigation).
 */
export const ReadyScreen = memo(function ReadyScreen() {
  const { queue, setReadyState, goTo } = useJourney();
  const [count, setCount] = useState(COUNTDOWN_START);
  const [counting, setCounting] = useState(true);

  // Animated 3-2-1 countdown.
  useEffect(() => {
    if (!counting) return;
    if (count <= 0) {
      setCounting(false);
      setReadyState('ready');
      return;
    }
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count, counting, setReadyState]);

  const handleStartDraw = useCallback(() => {
    setReadyState('ready');
    goTo('draw');
  }, [goTo, setReadyState]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">
      {/* Content */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <motion.h1
          className="mb-2 text-center text-3xl font-black tracking-tight sm:text-4xl"
          style={{
            backgroundImage: colors.gradient.blueToGold,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.1)}
        >
          You're Next
        </motion.h1>

        <motion.p
          className="mb-8 text-center text-sm font-light tracking-widest uppercase"
          style={{ color: colors.text.secondary }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.25)}
        >
          Get ready to draw
        </motion.p>

        {/* Large glowing READY badge */}
        <motion.div
          className="relative mb-8 flex h-44 w-44 items-center justify-center rounded-full"
          style={{
            background: colors.gradient.blueToGold,
            boxShadow: shadows.winner,
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={transitions.spring(0.3)}
        >
          {/* Pulsing glow rings */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${colors.gold.DEFAULT}` }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: loopDurations.pulse, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${colors.brand.DEFAULT}` }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{
              repeat: Infinity,
              duration: loopDurations.pulse,
              ease: 'easeInOut',
              delay: 0.4,
            }}
          />

          <motion.span
            className="text-4xl font-black tracking-widest text-white"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: loopDurations.breathe, ease: 'easeInOut' }}
          >
            READY
          </motion.span>
        </motion.div>

        {/* Countdown overlay */}
        <div className="mb-8 flex h-16 items-center justify-center">
          <AnimatePresence mode="wait">
            {counting ? (
              <motion.span
                key={count}
                className="text-6xl font-black"
                style={{
                  backgroundImage: colors.gradient.blueToGold,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={transitions.spring(0.1)}
              >
                {count}
              </motion.span>
            ) : (
              <motion.span
                className="text-2xl font-black"
                style={{ color: colors.text.gold }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transitions.luxury()}
              >
                You're up!
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Queue number reference */}
        <GlassPanel glow="gold" className="mb-8 w-full p-4" delay={0.4}>
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: colors.text.secondary }}
            >
              Your Number
            </span>
            <span className="text-xl font-black" style={{ color: colors.text.gold }}>
              {queue?.queueNumber ?? '—'}
            </span>
          </div>
        </GlassPanel>

        {/* Start Draw button */}
        <motion.button
          type="button"
          onClick={handleStartDraw}
          className="relative w-full overflow-hidden rounded-2xl py-4 text-lg font-bold"
          style={{
            background: colors.gradient.blueToGold,
            color: colors.text.inverse,
            borderRadius: radius.button,
            boxShadow: shadows.button.gold,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.spring(0.6)}
          whileHover={{ scale: 1.02, boxShadow: shadows.button.goldHover }}
          whileTap={{ scale: 0.98 }}
        >
          Start Draw
        </motion.button>
      </div>
    </div>
  );
});
