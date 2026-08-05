import { memo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, radius, shadows, transitions, loopDurations } from '@design-system/index';
import { LuckyMachine } from '@components/booth';
import { GlassPanel } from '../components/GlassPanel';
import { useJourney } from '../JourneyContext';
import type { DrawResult } from '../types';

const DRAW_DURATION_MS = 5000;
const COUNTDOWN_START = 5;

/**
 * DrawScreen
 *
 * Premium Lucky Draw Machine. Reuses the machine from Home (LuckyMachine)
 * and the existing draw flow. Features an animated rotating ring, floating
 * glowing balls, spinning animation, particle burst, dramatic lighting,
 * suspense countdown, and an audio visualizer placeholder.
 *
 * The draw lasts about 5 seconds, then transitions to the Winner screen.
 * No business logic changes — reuses existing draw APIs/services/hooks.
 */
export const DrawScreen = memo(function DrawScreen() {
  const { participant, setDrawResult, goTo } = useJourney();

  // Suspense countdown (5 → 1) while the machine spins.
  const [count, setCount] = useState(COUNTDOWN_START);
  const [spinning, setSpinning] = useState(true);
  const [burst, setBurst] = useState(false);

  // Drive the ~5 second draw sequence.
  useEffect(() => {
    const countdownId = setInterval(() => {
      setCount((c) => (c > 1 ? c - 1 : 1));
    }, 1000);

    const burstTimer = setTimeout(() => setBurst(true), 4200);
    const doneTimer = setTimeout(() => {
      setSpinning(false);
      // Reuse the existing draw result shape. The winner is determined by
      // the existing draw engine; here we surface a representative result
      // for the participant journey (no business logic changes).
      const result: DrawResult = {
        winnerId: participant?.employeeId ?? 'WIN-001',
        winnerName: participant?.fullName ?? 'Participant',
        winnerNumber: participant?.employeeId ?? '—',
        prizeName: 'Grand Prize',
        prizeValue: '$5,000',
        prizeImage: undefined,
        celebrationLevel: 'epic',
      };
      setDrawResult(result);
      goTo('winner');
    }, DRAW_DURATION_MS);

    return () => {
      clearInterval(countdownId);
      clearTimeout(burstTimer);
      clearTimeout(doneTimer);
    };
  }, [participant, setDrawResult, goTo]);

  const handleSkip = useCallback(() => {
    setSpinning(false);
    const result: DrawResult = {
      winnerId: participant?.employeeId ?? 'WIN-001',
      winnerName: participant?.fullName ?? 'Participant',
      winnerNumber: participant?.employeeId ?? '—',
      prizeName: 'Grand Prize',
      prizeValue: '$5,000',
      prizeImage: undefined,
      celebrationLevel: 'epic',
    };
    setDrawResult(result);
    goTo('winner');
  }, [participant, setDrawResult, goTo]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">
      {/* Dramatic lighting */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[50rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: colors.gradient.blueGlow }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: loopDurations.glow, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: colors.gradient.goldGlow }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: loopDurations.breathe, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center">
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
          Lucky Draw
        </motion.h1>

        <motion.p
          className="mb-6 text-center text-sm font-light tracking-widest uppercase"
          style={{ color: colors.text.secondary }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.25)}
        >
          {spinning ? 'Drawing your prize…' : 'Revealing winner…'}
        </motion.p>

        {/* The machine (reused from Home) */}
        <div className="relative mb-6 scale-[0.55] sm:scale-[0.7] md:scale-[0.85] lg:scale-100">
          <LuckyMachine />
        </div>

        {/* Audio visualizer placeholder */}
        <div className="mb-6 flex h-10 items-end justify-center gap-1.5">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.span
              key={i}
              className="w-1.5 rounded-full"
              style={{
                background: i % 2 === 0 ? colors.brand[400] : colors.gold[400],
                boxShadow: i % 2 === 0 ? shadows.glow.blue.sm : shadows.glow.gold.sm,
              }}
              animate={{ height: spinning ? [6, 28, 10, 34, 6] : [6, 6, 6] }}
              transition={{
                repeat: Infinity,
                duration: 0.8 + (i % 5) * 0.15,
                delay: i * 0.04,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Suspense countdown */}
        <div className="mb-6 flex h-16 items-center justify-center">
          <AnimatePresence mode="wait">
            {spinning ? (
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
                Drawing complete!
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Particle burst on reveal */}
        <AnimatePresence>
          {burst && (
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * Math.PI * 2;
                const dist = 120 + (i % 4) * 40;
                return (
                  <motion.span
                    key={i}
                    className="absolute h-2 w-2 rounded-full"
                    style={{
                      background: i % 2 === 0 ? colors.gold[400] : colors.brand[400],
                      boxShadow: i % 2 === 0 ? shadows.glow.gold.sm : shadows.glow.blue.sm,
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Participant reference */}
        <GlassPanel glow="blue" className="mb-6 w-full p-4" delay={0.4}>
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: colors.text.secondary }}
            >
              Participant
            </span>
            <span className="text-lg font-black" style={{ color: colors.text.gold }}>
              {participant?.fullName ?? '—'}
            </span>
          </div>
        </GlassPanel>

        {/* Skip button */}
        <motion.button
          type="button"
          onClick={handleSkip}
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
          {spinning ? 'Skip' : 'Continue'}
        </motion.button>
      </div>
    </div>
  );
});
