import { memo, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { colors, radius, shadows, transitions, loopDurations } from '@design-system/index';
import { GlassPanel } from '../components/GlassPanel';
import { useJourney } from '../JourneyContext';
import { useQueueStore } from '../../../store/queue/queueStore';
import { useQueueSync } from '../../../store/queue/useQueueSync';
import { useSocketConnection } from '../../../services/socket/hooks';

/**
 * QueueScreen
 *
 * Premium queue waiting screen. Displays the participant's queue number,
 * estimated wait, people ahead, and the currently serving number.
 *
 * Reuses the existing queue store, sync hook, and socket connection hook.
 * No queue logic is duplicated here.
 */
export const QueueScreen = memo(function QueueScreen() {
  const { queue, goTo } = useJourney();

  // Reuse existing queue store + realtime sync (no duplicated logic).
  useQueueSync();
  const currentQueue = useQueueStore((s) => s.currentQueue);
  const waitingQueue = useQueueStore((s) => s.waitingQueue);
  const totalWaiting = useQueueStore((s) => s.totalWaiting);

  // Connection indicator from the existing socket hook.
  const { isConnected, status } = useSocketConnection();

  // Realtime countdown (seconds remaining based on estimated wait).
  const [secondsLeft, setSecondsLeft] = useState(() => (queue?.estimatedWait ?? 0) * 60);

  useEffect(() => {
    const target = (queue?.estimatedWait ?? 0) * 60;
    setSecondsLeft(target);
  }, [queue?.estimatedWait]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = useCallback((totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  // People ahead = participant's position in the waiting queue.
  const peopleAhead = Math.max(0, waitingQueue.length - 1);

  // Queue progress: how far along the participant is toward the front.
  const progress = totalWaiting > 0 ? Math.min(1, (totalWaiting - peopleAhead) / totalWaiting) : 0;

  const currentServing = currentQueue?.number ?? queue?.currentQueue?.toString() ?? '—';

  const handleReady = useCallback(() => {
    goTo('ready');
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
          In Queue
        </motion.h1>

        <motion.p
          className="mb-8 text-center text-sm font-light tracking-widest uppercase"
          style={{ color: colors.text.secondary }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.25)}
        >
          Please wait for your turn
        </motion.p>

        {/* Connection indicator */}
        <motion.div
          className="mb-6 flex items-center gap-2 rounded-full border px-4 py-1.5"
          style={{
            borderColor: colors.glass.lineStrong,
            background: colors.glass.light,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.3)}
        >
          <motion.span
            className="h-2 w-2 rounded-full"
            style={{
              background: isConnected ? colors.status.online : colors.status.warning,
              boxShadow: isConnected ? shadows.glow.blue.sm : undefined,
            }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          />
          <span
            className="text-xs font-semibold tracking-wider uppercase"
            style={{ color: colors.text.secondary }}
          >
            {isConnected ? 'Connected' : status === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
          </span>
        </motion.div>

        {/* Queue Number hero card */}
        <GlassPanel glow="gold" className="mb-4 w-full p-6" delay={0.35}>
          <div className="flex flex-col items-center">
            <span
              className="mb-1 text-xs font-bold tracking-widest uppercase"
              style={{ color: colors.text.secondary }}
            >
              Your Queue Number
            </span>
            <motion.span
              className="text-6xl font-black tracking-tight"
              style={{
                backgroundImage: colors.gradient.blueToGold,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={transitions.spring(0.4)}
            >
              {queue?.queueNumber ?? '—'}
            </motion.span>
          </div>
        </GlassPanel>

        {/* Animated queue progress */}
        <div className="mb-4 w-full">
          <div
            className="relative h-2 w-full overflow-hidden rounded-full"
            style={{ background: colors.glass.line }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: colors.gradient.blueToGold, boxShadow: shadows.glow.blue.sm }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress * 100}%` }}
              transition={transitions.luxury()}
            />
          </div>
          <div
            className="mt-1.5 flex justify-between text-[0.65rem] font-semibold tracking-wider uppercase"
            style={{ color: colors.text.tertiary }}
          >
            <span>Back of queue</span>
            <span>Front of queue</span>
          </div>
        </div>

        {/* Stats glass cards */}
        <div className="mb-4 grid w-full grid-cols-2 gap-3">
          <GlassPanel glow="blue" className="p-4" delay={0.45}>
            <div className="flex flex-col items-center">
              <span
                className="mb-1 text-[0.65rem] font-bold tracking-widest uppercase"
                style={{ color: colors.text.secondary }}
              >
                Estimated Wait
              </span>
              <span className="text-2xl font-black" style={{ color: colors.text.primary }}>
                {formatTime(secondsLeft)}
              </span>
            </div>
          </GlassPanel>

          <GlassPanel glow="blue" className="p-4" delay={0.5}>
            <div className="flex flex-col items-center">
              <span
                className="mb-1 text-[0.65rem] font-bold tracking-widest uppercase"
                style={{ color: colors.text.secondary }}
              >
                People Ahead
              </span>
              <span className="text-2xl font-black" style={{ color: colors.text.primary }}>
                {peopleAhead}
              </span>
            </div>
          </GlassPanel>
        </div>

        {/* Current serving card */}
        <GlassPanel glow="blue" className="mb-8 w-full p-4" delay={0.55}>
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: colors.text.secondary }}
            >
              Current Serving
            </span>
            <motion.span
              className="text-xl font-black"
              style={{ color: colors.text.gold }}
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: loopDurations.pulse, ease: 'easeInOut' }}
            >
              {currentServing}
            </motion.span>
          </div>
        </GlassPanel>

        {/* Ready button (enabled when participant reaches front) */}
        <motion.button
          type="button"
          onClick={handleReady}
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
          I'm Ready
        </motion.button>
      </div>
    </div>
  );
});
