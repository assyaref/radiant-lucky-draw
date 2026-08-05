import { memo, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, radius, shadows, transitions, loopDurations } from '@design-system/index';
import { GlassPanel } from '../components/GlassPanel';
import { useJourney } from '../JourneyContext';

/**
 * ValidationScreen
 *
 * Validates the participant using the existing registration service
 * (via JourneyContext.validateParticipant). Shows an animated loading
 * state, then an animated success or failure result with Continue / Retry.
 *
 * Reuses the premium glass UI, design tokens, and Framer Motion.
 */
export const ValidationScreen = memo(function ValidationScreen() {
  const { participant, validation, validateParticipant, goTo } = useJourney();
  const [attempt, setAttempt] = useState(0);

  // Run validation on mount and whenever the user retries.
  useEffect(() => {
    if (participant) {
      void validateParticipant(participant);
    }
  }, [participant, validateParticipant, attempt]);

  const handleRetry = useCallback(() => {
    setAttempt((a) => a + 1);
  }, []);

  const handleContinue = useCallback(() => {
    goTo('queue');
  }, [goTo]);

  const isChecking = validation.status === 'checking';
  const isPassed = validation.status === 'passed';
  const isFailed = validation.status === 'failed';

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
          Validation
        </motion.h1>

        <motion.p
          className="mb-8 text-center text-sm font-light tracking-widest uppercase"
          style={{ color: colors.text.secondary }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.25)}
        >
          Verifying your participation
        </motion.p>

        <GlassPanel glow="blue" className="w-full p-8" delay={0.3}>
          <div className="flex flex-col items-center">
            <AnimatePresence mode="wait">
              {isChecking && (
                <motion.div
                  key="checking"
                  className="flex w-full flex-col items-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={transitions.luxury()}
                >
                  {/* Loading spinner */}
                  <motion.div
                    className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2"
                    style={{ borderColor: colors.glass.lineStrong }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  >
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        borderTop: `3px solid ${colors.gold.DEFAULT}`,
                        borderRight: `3px solid transparent`,
                        borderBottom: `3px solid transparent`,
                        borderLeft: `3px solid transparent`,
                      }}
                    />
                    <motion.div
                      className="h-3 w-3 rounded-full"
                      style={{ background: colors.gold.DEFAULT, boxShadow: shadows.glow.gold.md }}
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: loopDurations.pulse,
                        ease: 'easeInOut',
                      }}
                    />
                  </motion.div>

                  <motion.p
                    className="mb-2 text-lg font-bold"
                    style={{ color: colors.text.primary }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                  >
                    Validating…
                  </motion.p>
                  <p
                    className="text-center text-sm font-light"
                    style={{ color: colors.text.secondary }}
                  >
                    Checking your details against the registry
                  </p>
                </motion.div>
              )}

              {isPassed && (
                <motion.div
                  key="passed"
                  className="flex w-full flex-col items-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={transitions.spring(0.1)}
                >
                  {/* Animated success check */}
                  <motion.div
                    className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full"
                    style={{
                      background: 'rgba(52, 211, 153, 0.12)',
                      border: `2px solid ${colors.status.online}`,
                      boxShadow: '0 0 40px rgba(52, 211, 153, 0.35)',
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={transitions.spring(0.2)}
                  >
                    <motion.svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={colors.status.online}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: 0.3, ease: 'easeInOut' }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </motion.svg>
                  </motion.div>

                  <motion.p
                    className="mb-1 text-2xl font-black"
                    style={{ color: colors.status.online }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transitions.luxury(0.4)}
                  >
                    Valid Participant
                  </motion.p>
                  <motion.p
                    className="mb-8 text-center text-sm font-light"
                    style={{ color: colors.text.secondary }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transitions.luxury(0.5)}
                  >
                    You are eligible to join the draw
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
                </motion.div>
              )}

              {isFailed && (
                <motion.div
                  key="failed"
                  className="flex w-full flex-col items-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={transitions.spring(0.1)}
                >
                  {/* Animated failure cross */}
                  <motion.div
                    className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full"
                    style={{
                      background: 'rgba(248, 113, 113, 0.12)',
                      border: `2px solid ${colors.status.disconnected}`,
                      boxShadow: '0 0 40px rgba(248, 113, 113, 0.35)',
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={transitions.spring(0.2)}
                  >
                    <motion.svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={colors.status.disconnected}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.3, ease: 'easeInOut' }}
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </motion.svg>
                  </motion.div>

                  <motion.p
                    className="mb-1 text-2xl font-black"
                    style={{ color: colors.status.disconnected }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transitions.luxury(0.4)}
                  >
                    Invalid Participant
                  </motion.p>
                  <motion.p
                    className="mb-8 text-center text-sm font-light"
                    style={{ color: colors.text.secondary }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transitions.luxury(0.5)}
                  >
                    {validation.message || 'Your details could not be verified.'}
                  </motion.p>

                  {/* Retry button */}
                  <motion.button
                    type="button"
                    onClick={handleRetry}
                    className="relative w-full overflow-hidden rounded-2xl py-4 text-lg font-bold"
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
                    Retry
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
});
