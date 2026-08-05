import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { colors, radius, shadows, transitions } from '@design-system/index';
import { GlassPanel } from '../components/GlassPanel';
import { useJourney } from '../JourneyContext';

/**
 * Scan screen for the participant journey.
 * Provides a camera placeholder, QR scanner container, manual code input,
 * and Continue / Cancel actions. Uses glass UI and design tokens.
 */
export const ScanScreen = memo(function ScanScreen() {
  const { goTo } = useJourney();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = useCallback(() => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Please enter or scan a code to continue.');
      return;
    }
    setError(null);
    goTo('registration');
  }, [code, goTo]);

  const handleCancel = useCallback(() => {
    setCode('');
    setError(null);
    goTo('landing');
  }, [goTo]);

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
          Scan QR Code
        </motion.h1>

        <motion.p
          className="mb-8 text-center text-sm font-light tracking-widest uppercase"
          style={{ color: colors.text.secondary }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.25)}
        >
          Point your camera at the booth QR
        </motion.p>

        <GlassPanel glow="blue" className="w-full p-8" delay={0.3}>
          <div className="flex flex-col items-center">
            {/* Camera placeholder / QR scanner container */}
            <motion.div
              className="relative mb-6 flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl border"
              style={{
                borderColor: colors.glass.lineStrong,
                background: colors.glass.light,
                boxShadow: shadows.glow.blue.sm,
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={transitions.spring(0.4)}
            >
              {/* Camera viewport frame */}
              <div
                className="absolute inset-6 rounded-xl border-2 border-dashed"
                style={{ borderColor: colors.glass.lineStrong }}
              />

              {/* Animated scan line */}
              <motion.div
                className="pointer-events-none absolute inset-x-8 h-0.5"
                style={{
                  background: colors.gradient.blueToGold,
                  boxShadow: shadows.glow.blue.md,
                }}
                animate={{ top: ['18%', '82%', '18%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              />

              {/* Corner highlights */}
              <div
                className="pointer-events-none absolute left-3 top-3 h-8 w-8 rounded-tl-lg border-l-2 border-t-2"
                style={{ borderColor: colors.gold.DEFAULT }}
              />
              <div
                className="pointer-events-none absolute right-3 top-3 h-8 w-8 rounded-tr-lg border-r-2 border-t-2"
                style={{ borderColor: colors.gold.DEFAULT }}
              />
              <div
                className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 rounded-bl-lg border-b-2 border-l-2"
                style={{ borderColor: colors.gold.DEFAULT }}
              />
              <div
                className="pointer-events-none absolute bottom-3 right-3 h-8 w-8 rounded-br-lg border-b-2 border-r-2"
                style={{ borderColor: colors.gold.DEFAULT }}
              />

              {/* Camera placeholder icon */}
              <div className="flex flex-col items-center gap-2">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.text.secondary}
                  strokeWidth="1.5"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span className="text-xs font-medium" style={{ color: colors.text.tertiary }}>
                  Camera placeholder
                </span>
              </div>
            </motion.div>

            {/* Manual code input */}
            <motion.div
              className="mb-6 w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transitions.luxury(0.5)}
            >
              <label
                className="mb-1.5 block text-xs font-bold tracking-wider uppercase"
                style={{ color: colors.text.secondary }}
              >
                Or enter code manually
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. BOOTH-1234"
                className="w-full rounded-2xl border bg-white/[0.03] px-5 py-4 text-base text-white placeholder-white/20 backdrop-blur-sm transition-all outline-none"
                style={{
                  borderColor: error ? 'rgba(248,113,113,0.5)' : colors.glass.lineStrong,
                  borderRadius: radius.md,
                }}
              />
              {error && (
                <motion.p
                  className="mt-1.5 text-xs font-medium"
                  style={{ color: colors.status.disconnected }}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </motion.div>

            {/* Continue button */}
            <motion.button
              type="button"
              onClick={handleContinue}
              className="relative mb-3 w-full overflow-hidden rounded-2xl py-4 text-lg font-bold"
              style={{
                background: colors.gradient.blueToGold,
                color: colors.text.inverse,
                borderRadius: radius.button,
                boxShadow: shadows.button.primary,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transitions.spring(0.6)}
              whileHover={{ scale: 1.02, boxShadow: shadows.button.primaryHover }}
              whileTap={{ scale: 0.98 }}
            >
              Continue
            </motion.button>

            {/* Cancel button */}
            <motion.button
              type="button"
              onClick={handleCancel}
              className="w-full rounded-2xl border py-3 text-sm font-bold"
              style={{
                borderColor: colors.glass.lineStrong,
                color: colors.text.secondary,
                borderRadius: radius.button,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transitions.luxury(0.7)}
              whileHover={{ background: colors.glass.light }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
});
