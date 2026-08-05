import { memo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '@components/layout';
import { colors, radius, shadows, transitions } from '@design-system/index';
import { GlassPanel } from '../components/GlassPanel';
import { useJourney } from '../JourneyContext';

/**
 * Premium full-screen landing screen for the participant journey.
 * Features the animated background, glass card, logo, welcome title,
 * QR code area, and a "Scan QR to Start" call-to-action.
 */
export const LandingScreen = memo(function LandingScreen() {
  const { goTo } = useJourney();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">
      {/* Premium animated background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Company logo */}
        <motion.div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{
            background: colors.gradient.blueToGold,
            boxShadow: shadows.glow.blue.md,
          }}
          initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={transitions.spring(0.1)}
        >
          <span className="text-4xl font-black text-white">R</span>
        </motion.div>

        {/* Welcome title */}
        <motion.h1
          className="mb-2 text-center text-4xl font-black tracking-tight sm:text-5xl"
          style={{
            backgroundImage: colors.gradient.blueToGold,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.2)}
        >
          Welcome
        </motion.h1>

        <motion.p
          className="mb-8 text-center text-sm font-light tracking-widest uppercase"
          style={{ color: colors.text.secondary }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.35)}
        >
          Radiant Lucky Draw
        </motion.p>

        {/* Glass card with QR area */}
        <GlassPanel glow="blue" className="w-full p-8" delay={0.4}>
          <div className="flex flex-col items-center">
            {/* QR Code area */}
            <motion.div
              className="relative mb-6 flex h-44 w-44 items-center justify-center rounded-2xl border"
              style={{
                borderColor: colors.glass.lineStrong,
                background: colors.glass.light,
                boxShadow: shadows.glow.blue.sm,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={transitions.spring(0.5)}
            >
              {/* Animated scan line */}
              <motion.div
                className="pointer-events-none absolute inset-x-4 h-0.5"
                style={{
                  background: colors.gradient.blueToGold,
                  boxShadow: shadows.glow.blue.sm,
                }}
                animate={{ top: ['12%', '88%', '12%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              />
              {/* Corner highlights */}
              <div
                className="pointer-events-none absolute left-2 top-2 h-6 w-6 rounded-tl-lg border-l-2 border-t-2"
                style={{ borderColor: colors.gold.DEFAULT }}
              />
              <div
                className="pointer-events-none absolute right-2 top-2 h-6 w-6 rounded-tr-lg border-r-2 border-t-2"
                style={{ borderColor: colors.gold.DEFAULT }}
              />
              <div
                className="pointer-events-none absolute bottom-2 left-2 h-6 w-6 rounded-bl-lg border-b-2 border-l-2"
                style={{ borderColor: colors.gold.DEFAULT }}
              />
              <div
                className="pointer-events-none absolute bottom-2 right-2 h-6 w-6 rounded-br-lg border-b-2 border-r-2"
                style={{ borderColor: colors.gold.DEFAULT }}
              />
              {/* QR placeholder */}
              <div className="flex flex-col items-center gap-2">
                <svg
                  width="72"
                  height="72"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.text.secondary}
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M14 14h3v3h-3zM20 14h1M14 20h1M20 20h1" />
                </svg>
                <span
                  className="text-[0.6rem] font-bold tracking-widest uppercase"
                  style={{ color: colors.text.tertiary }}
                >
                  QR Code
                </span>
              </div>
            </motion.div>

            {/* Scan QR to Start */}
            <motion.p
              className="mb-6 text-center text-sm font-medium"
              style={{ color: colors.text.secondary }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transitions.luxury(0.6)}
            >
              Scan QR to Start
            </motion.p>

            {/* Start button */}
            <motion.button
              type="button"
              onClick={() => goTo('scan')}
              className="relative w-full overflow-hidden rounded-2xl py-4 text-lg font-bold"
              style={{
                background: colors.gradient.blueToGold,
                color: colors.text.inverse,
                borderRadius: radius.button,
                boxShadow: shadows.button.primary,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transitions.spring(0.7)}
              whileHover={{ scale: 1.02, boxShadow: shadows.button.primaryHover }}
              whileTap={{ scale: 0.98 }}
            >
              Start
            </motion.button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
});
