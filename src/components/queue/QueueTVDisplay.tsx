import { useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueueStore, type QueueItem } from '../../store/queue/queueStore';
import { useQueueSync } from '../../store/queue/useQueueSync';

function QueueCard({ item }: { item: QueueItem }) {
  const statusColors: Record<string, string> = {
    current: 'border-amber-400 bg-amber-400/10 shadow-amber-400/20',
    waiting: 'border-white/10 bg-white/[0.03]',
    finished: 'border-emerald-400/30 bg-emerald-400/5',
    cancelled: 'border-red-400/20 bg-red-400/5',
    skipped: 'border-gray-400/20 bg-gray-400/5',
  };

  const statusLabels: Record<string, string> = {
    current: 'NOW SERVING',
    waiting: 'WAITING',
    finished: 'FINISHED',
    cancelled: 'CANCELLED',
    skipped: 'SKIPPED',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-sm transition-all ${
        statusColors[item.status] || 'border-white/10'
      } ${item.isPriority ? 'ring-1 ring-amber-400/30' : ''}`}
    >
      {/* Queue Number */}
      <div className="flex-shrink-0">
        <motion.span
          className={`text-2xl font-black tracking-tight ${
            item.status === 'current'
              ? 'text-amber-300'
              : item.status === 'finished'
                ? 'text-emerald-400'
                : item.status === 'cancelled' || item.status === 'skipped'
                  ? 'text-white/20 line-through'
                  : 'text-white/60'
          }`}
          animate={item.status === 'current' ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {item.number}
        </motion.span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={`truncate text-sm font-bold ${
            item.status === 'current' ? 'text-white' : 'text-white/70'
          }`}
        >
          {item.fullName}
        </p>
        <p className="truncate text-xs text-white/30">{item.company}</p>
      </div>

      {/* Priority badge */}
      {item.isPriority && (
        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 uppercase">
          Priority
        </span>
      )}

      {/* Status */}
      <span
        className={`text-[10px] font-bold tracking-wider uppercase ${
          item.status === 'current'
            ? 'text-amber-400'
            : item.status === 'finished'
              ? 'text-emerald-400'
              : item.status === 'cancelled' || item.status === 'skipped'
                ? 'text-white/20'
                : 'text-white/30'
        }`}
      >
        {statusLabels[item.status]}
      </span>
    </motion.div>
  );
}

function CurrentQueueDisplay({ item }: { item: QueueItem | null }) {
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8">
        <p className="text-lg font-light text-white/20">No active queue</p>
        <p className="text-xs text-white/10">Waiting for participants...</p>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 via-amber-400/5 to-transparent p-8 shadow-lg shadow-amber-400/10"
    >
      {/* Animated background pulse */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/20 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10">
        <p className="mb-2 text-center text-xs font-bold tracking-[0.2em] text-amber-400/60 uppercase">
          Now Serving
        </p>
        <motion.p
          className="text-center text-6xl font-black tracking-tight"
          key={item.number}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 12 }}
          style={{
            backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {item.number}
        </motion.p>
        <p className="mt-2 text-center text-lg font-bold text-white/70">{item.fullName}</p>
        <p className="text-center text-sm text-white/30">{item.company}</p>
      </div>
    </motion.div>
  );
}

export function QueueTVDisplay() {
  const { currentQueue, waitingQueue, finishedQueue, estimatedWaitPerItem } = useQueueStore();
  // Returns false during SSR and true on the client to avoid hydration mismatches.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Keep the queue cache in sync with the backend via REST + Socket.IO.
  useQueueSync();

  if (!mounted) return null;

  const estimatedWait = waitingQueue.length * estimatedWaitPerItem;

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] p-6">
      {/* Header */}
      <motion.div
        className="mb-6 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-black tracking-wider text-white">Queue Status</h1>
          <p className="text-sm text-white/30">Live queue management system</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase">
              Est. Wait
            </p>
            <p className="text-lg font-black text-amber-300">{estimatedWait} min</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase">In Queue</p>
            <p className="text-lg font-black text-white">{waitingQueue.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Main grid: Current + Waiting + Finished */}
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_1.5fr_1fr]">
        {/* Current Queue */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="mb-3 text-xs font-bold tracking-[0.2em] text-amber-400/60 uppercase">
            Current
          </h2>
          <CurrentQueueDisplay item={currentQueue} />
        </motion.div>

        {/* Waiting Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">
              Waiting Queue
            </h2>
            <span className="text-xs text-white/20">{waitingQueue.length} participants</span>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            <AnimatePresence mode="popLayout">
              {waitingQueue.length === 0 ? (
                <motion.p
                  className="py-8 text-center text-sm text-white/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  No participants in queue
                </motion.p>
              ) : (
                waitingQueue.map((item) => <QueueCard key={item.id} item={item} />)
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Finished Queue */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-[0.2em] text-emerald-400/60 uppercase">
              Finished
            </h2>
            <span className="text-xs text-white/20">{finishedQueue.length} completed</span>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            <AnimatePresence mode="popLayout">
              {finishedQueue.length === 0 ? (
                <motion.p
                  className="py-8 text-center text-sm text-white/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  No completed queues yet
                </motion.p>
              ) : (
                finishedQueue
                  .slice(-10)
                  .reverse()
                  .map((item) => <QueueCard key={item.id} item={item} />)
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
