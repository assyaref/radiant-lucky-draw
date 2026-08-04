/**
 * LiveEventEngine - Event Sequence Overlay
 * Renders the live event draw sequence:
 * countdown -> machineSpin -> winner -> celebration
 * Interrupts idle when a participant starts.
 */
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveEventEngine } from './LiveEventEngine';
import { CINEMATIC_EASE } from './transitionManager';

const CONFETTI_COLORS = ['#fbbf24', '#60a5fa', '#f472b6', '#34d399', '#a78bfa', '#f97316'];

export const EventSequenceOverlay = memo(function EventSequenceOverlay() {
  const { state, eventStep, winner } = useLiveEventEngine();
  const isActive = state === 'event';

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Cinematic backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
            animate={{ opacity: [0.6, 0.8, 0.6] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />

          <AnimatePresence mode="wait">
            {eventStep === 'countdown' && (
              <motion.div
                key="countdown"
                className="relative z-10 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.5, ease: CINEMATIC_EASE }}
              >
                <motion.p
                  className="mb-4 text-3xl font-bold tracking-[0.3em] text-amber-400/90"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  LIVE DRAW
                </motion.p>
                <motion.div
                  className="text-9xl font-black text-white"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  3
                </motion.div>
                <motion.p
                  className="mt-4 text-xl font-medium tracking-wider text-white/50"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  Get Ready...
                </motion.p>
              </motion.div>
            )}

            {eventStep === 'machineSpin' && (
              <motion.div
                key="spin"
                className="relative z-10 text-center"
                initial={{ opacity: 0, rotate: -10 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="text-9xl"
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                >
                  🎰
                </motion.div>
                <motion.p
                  className="mt-4 text-4xl font-black tracking-wider text-white/90"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  DRAWING...
                </motion.p>
              </motion.div>
            )}

            {eventStep === 'winner' && winner && (
              <motion.div
                key="winner"
                className="relative z-10 text-center"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              >
                <motion.p
                  className="mb-2 text-2xl font-bold tracking-[0.3em] text-amber-400/90"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  🎉 CONGRATULATIONS 🎉
                </motion.p>
                <motion.div
                  className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full border-2 border-amber-400/60 bg-gradient-to-br from-blue-500/20 to-amber-500/20"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <span className="text-6xl">{winner.icon}</span>
                </motion.div>
                <motion.h3
                  className="mb-1 text-6xl font-black tracking-wide text-white"
                  style={{ textShadow: `0 0 40px ${winner.color}66` }}
                >
                  {winner.name}
                </motion.h3>
                <motion.p
                  className="text-3xl font-medium text-amber-300/90"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  Won the {winner.prize}!
                </motion.p>
              </motion.div>
            )}

            {eventStep === 'celebration' && winner && (
              <motion.div
                key="celebration"
                className="relative z-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Confetti */}
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-2 w-2 rounded-sm"
                    style={{
                      backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                      left: `${Math.random() * 100}%`,
                      top: '-5%',
                    }}
                    animate={{
                      y: ['0vh', '110vh'],
                      x: [0, Math.random() > 0.5 ? 60 : -60],
                      rotate: [0, 360],
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3 + Math.random() * 2,
                      delay: i * 0.1,
                      ease: 'easeIn',
                    }}
                  />
                ))}

                {/* Fireworks bursts */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={`fw-${i}`}
                    className="absolute h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: CONFETTI_COLORS[(i + 2) % CONFETTI_COLORS.length],
                      left: `${15 + i * 25}%`,
                      top: `${15 + (i % 2) * 20}%`,
                      boxShadow: '0 0 20px currentColor',
                    }}
                    animate={{ scale: [0, 8, 0], opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.5, ease: 'easeOut' }}
                  />
                ))}

                <motion.div
                  className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full border-2 border-amber-400/60 bg-gradient-to-br from-blue-500/20 to-amber-500/20"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <span className="text-7xl">{winner.icon}</span>
                </motion.div>
                <motion.h3
                  className="mb-2 text-7xl font-black tracking-wide text-white"
                  style={{ textShadow: `0 0 50px ${winner.color}88` }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {winner.name}
                </motion.h3>
                <motion.p
                  className="text-4xl font-bold text-amber-300"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {winner.prize}
                </motion.p>
                <motion.p
                  className="mt-4 text-xl font-medium tracking-wider text-white/50"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  Congratulations! You are our lucky winner!
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
