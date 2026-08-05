import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { colors, radius, shadows, transitions } from '@design-system/index';
import { GlassPanel } from '../components/GlassPanel';
import { useJourney } from '../JourneyContext';

/**
 * ClaimScreen
 *
 * Glass premium UI. Displays winner information, QR claim code, claim
 * number, instructions, and claim status. Provides Play Again (restart
 * journey without refreshing) and Finish buttons.
 */
export const ClaimScreen = memo(function ClaimScreen() {
  const { draw, claim, participant, resetJourney } = useJourney();

  const handlePlayAgain = useCallback(() => {
    resetJourney();
  }, [resetJourney]);

  const handleFinish = useCallback(() => {
    resetJourney();
  }, [resetJourney]);

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
          Claim Your Prize
        </motion.h1>

        <motion.p
          className="mb-8 text-center text-sm font-light tracking-widest uppercase"
          style={{ color: colors.text.secondary }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.25)}
        >
          Present this code at the prize counter
        </motion.p>

        {/* Winner information */}
        <GlassPanel glow="blue" className="mb-4 w-full p-5" delay={0.3}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: colors.text.secondary }}
              >
                Winner
              </span>
              <span className="text-base font-black" style={{ color: colors.text.gold }}>
                {draw?.winnerName ?? participant?.fullName ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: colors.text.secondary }}
              >
                Prize
              </span>
              <span className="text-base font-black" style={{ color: colors.text.primary }}>
                {draw?.prizeName ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: colors.text.secondary }}
              >
                Value
              </span>
              <span className="text-base font-black" style={{ color: colors.text.gold }}>
                {draw?.prizeValue ?? '—'}
              </span>
            </div>
          </div>
        </GlassPanel>

        {/* QR Claim Code */}
        <GlassPanel glow="gold" className="mb-4 w-full p-6" delay={0.4}>
          <div className="flex flex-col items-center">
            <span
              className="mb-4 text-xs font-bold tracking-widest uppercase"
              style={{ color: colors.text.secondary }}
            >
              QR Claim Code
            </span>

            {/* QR code placeholder */}
            <motion.div
              className="relative mb-4 flex h-40 w-40 items-center justify-center rounded-2xl border"
              style={{
                borderColor: colors.glass.lineStrong,
                background: colors.glass.light,
                boxShadow: shadows.glow.gold.sm,
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
                  boxShadow: shadows.glow.gold.sm,
                }}
                animate={{ top: ['12%', '88%', '12%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              />
              {/* QR placeholder */}
              <div className="flex flex-col items-center gap-2">
                <svg
                  width="72"
                  height="72"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.text.gold}
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
                  {claim?.qrCode ?? 'CLAIM-CODE'}
                </span>
              </div>
            </motion.div>

            {/* Claim number */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: colors.text.secondary }}
              >
                Claim Number
              </span>
              <span className="text-lg font-black" style={{ color: colors.text.gold }}>
                {claim?.claimCode ?? '—'}
              </span>
            </div>
          </div>
        </GlassPanel>

        {/* Instructions */}
        <GlassPanel glow="blue" className="mb-4 w-full p-5" delay={0.5}>
          <span
            className="mb-3 block text-xs font-bold tracking-widest uppercase"
            style={{ color: colors.text.secondary }}
          >
            Instructions
          </span>
          <ul className="flex flex-col gap-2">
            {(
              claim?.instructions ?? [
                'Show this QR code at the prize counter.',
                'Present a valid ID for verification.',
                'Collect your prize within 30 days.',
              ]
            ).map((instruction, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-xs font-black" style={{ color: colors.text.gold }}>
                  {i + 1}.
                </span>
                <span className="text-sm" style={{ color: colors.text.secondary }}>
                  {instruction}
                </span>
              </li>
            ))}
          </ul>
        </GlassPanel>

        {/* Claim status */}
        <GlassPanel glow="gold" className="mb-8 w-full p-4" delay={0.6}>
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: colors.text.secondary }}
            >
              Claim Status
            </span>
            <motion.span
              className="flex items-center gap-2 text-sm font-black"
              style={{ color: colors.status.online }}
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: colors.status.online, boxShadow: shadows.glow.blue.sm }}
              />
              Ready to Claim
            </motion.span>
          </div>
        </GlassPanel>

        {/* Buttons */}
        <div className="flex w-full gap-3">
          <motion.button
            type="button"
            onClick={handlePlayAgain}
            className="relative flex-1 overflow-hidden rounded-2xl py-4 text-base font-bold"
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
            Play Again
          </motion.button>

          <motion.button
            type="button"
            onClick={handleFinish}
            className="relative flex-1 overflow-hidden rounded-2xl border py-4 text-base font-bold"
            style={{
              borderColor: colors.glass.lineStrong,
              background: colors.glass.light,
              color: colors.text.primary,
              borderRadius: radius.button,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.spring(0.8)}
            whileHover={{ scale: 1.02, background: colors.glass.lighter }}
            whileTap={{ scale: 0.98 }}
          >
            Finish
          </motion.button>
        </div>
      </div>
    </div>
  );
});
