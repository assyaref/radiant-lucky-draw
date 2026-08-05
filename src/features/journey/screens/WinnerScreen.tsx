import { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { colors, radius, shadows, transitions, loopDurations } from '@design-system/index';
import { GlassPanel } from '../components/GlassPanel';
import { useJourney } from '../JourneyContext';

const CONFETTI_COLORS = ['#fbbf24', '#60a5fa', '#f472b6', '#34d399', '#a78bfa', '#f97316'];

/**
 * WinnerScreen
 *
 * Luxury celebration screen. Displays 🎉 Congratulations, the prize image,
 * prize name, prize category, and prize value with confetti animation,
 * gold glow, and an animated card reveal. Reuses the existing draw result.
 */
export const WinnerScreen = memo(function WinnerScreen() {
  const { draw, goTo } = useJourney();

  const confetti = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 3,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
      })),
    [],
  );

  const handleContinue = useCallback(() => {
    goTo('claim');
  }, [goTo]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">
      {/* Gold glow backdrop */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: colors.gradient.goldGlow }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: loopDurations.glow, ease: 'easeInOut' }}
      />

      {/* Confetti animation */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c) => (
          <motion.span
            key={c.id}
            className="absolute rounded-sm"
            style={{
              left: `${c.x}%`,
              top: '-5%',
              width: c.size,
              height: c.size * 0.5,
              background: c.color,
              boxShadow: `0 0 8px ${c.color}80`,
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, Math.sin(c.id) * 40, 0],
              rotate: [0, c.rotate],
              opacity: [1, 1, 0.6],
            }}
            transition={{
              repeat: Infinity,
              duration: c.duration,
              delay: c.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Congratulations */}
        <motion.h1
          className="mb-2 text-center text-4xl font-black tracking-tight sm:text-5xl"
          style={{
            backgroundImage: colors.gradient.blueToGold,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={transitions.spring(0.1)}
        >
          🎉 Congratulations!
        </motion.h1>

        <motion.p
          className="mb-8 text-center text-sm font-light tracking-widest uppercase"
          style={{ color: colors.text.secondary }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.25)}
        >
          You won a prize
        </motion.p>

        {/* Animated prize card reveal */}
        <motion.div
          className="relative mb-8 w-full"
          initial={{ opacity: 0, y: 60, rotateX: 40 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={transitions.cinematic(0.3)}
          style={{ perspective: 1000 }}
        >
          <GlassPanel glow="gold" className="w-full p-8" delay={0.3}>
            {/* Pulsing gold ring */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{ border: `2px solid ${colors.gold.DEFAULT}` }}
              animate={{ scale: [1, 1.03, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: loopDurations.pulse, ease: 'easeInOut' }}
            />

            <div className="flex flex-col items-center">
              {/* Prize image */}
              <motion.div
                className="mb-6 flex h-40 w-40 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: colors.glass.lineStrong,
                  background: colors.glass.light,
                  boxShadow: shadows.winner,
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: loopDurations.breathe,
                  ease: 'easeInOut',
                }}
              >
                {draw?.prizeImage ? (
                  <img
                    src={draw.prizeImage}
                    alt={draw.prizeName}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-6xl">🏆</span>
                )}
              </motion.div>

              {/* Prize name */}
              <motion.h2
                className="mb-2 text-center text-2xl font-black tracking-tight"
                style={{ color: colors.text.gold }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transitions.luxury(0.5)}
              >
                {draw?.prizeName ?? 'Grand Prize'}
              </motion.h2>

              {/* Prize category */}
              <motion.p
                className="mb-4 text-center text-xs font-bold tracking-widest uppercase"
                style={{ color: colors.text.secondary }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={transitions.luxury(0.6)}
              >
                {draw?.celebrationLevel === 'epic' ? 'Grand Prize' : 'Prize'}
              </motion.p>

              {/* Prize value */}
              <motion.div
                className="rounded-full border px-5 py-2"
                style={{
                  borderColor: colors.glass.lineStrong,
                  background: colors.glass.light,
                  boxShadow: shadows.glow.gold.sm,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={transitions.spring(0.7)}
              >
                <span className="text-xl font-black" style={{ color: colors.text.gold }}>
                  {draw?.prizeValue ?? '$5,000'}
                </span>
              </motion.div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Winner name */}
        <motion.p
          className="mb-8 text-center text-sm font-medium"
          style={{ color: colors.text.secondary }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transitions.luxury(0.8)}
        >
          Winner: <span style={{ color: colors.text.gold }}>{draw?.winnerName ?? '—'}</span>
        </motion.p>

        {/* Continue button */}
        <motion.button
          type="button"
          onClick={handleContinue}
          className="relative w-full overflow-hidden rounded-2xl py-4 text-lg font-bold"
          style={{
            background: colors.gradient.blueToGold,
            color: colors.text.inverse,
            borderRadius: radius.button,
            boxShadow: shadows.button.gold,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.spring(0.9)}
          whileHover={{ scale: 1.02, boxShadow: shadows.button.goldHover }}
          whileTap={{ scale: 0.98 }}
        >
          Continue
        </motion.button>
      </div>
    </div>
  );
});
