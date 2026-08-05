import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueueStore, type QueueItem } from '../../store/queue/queueStore';
import { useQueueSync } from '../../store/queue/useQueueSync';

function ParticipantRow({ item }: { item: QueueItem }) {
  const { cancelQueue, skipQueue } = useQueueStore();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        item.status === 'current'
          ? 'border-amber-400/30 bg-amber-400/5'
          : item.status === 'waiting'
            ? 'border-white/10 bg-white/[0.02]'
            : item.status === 'finished'
              ? 'border-emerald-400/20 bg-emerald-400/5'
              : 'border-red-400/10 bg-red-400/5'
      }`}
    >
      {/* Number */}
      <span
        className={`w-16 text-lg font-black ${
          item.status === 'current'
            ? 'text-amber-300'
            : item.status === 'finished'
              ? 'text-emerald-400'
              : item.status === 'cancelled' || item.status === 'skipped'
                ? 'text-white/20 line-through'
                : 'text-white/60'
        }`}
      >
        {item.number}
      </span>

      {/* Name + Company */}
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
        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
          PRIORITY
        </span>
      )}

      {/* Status */}
      <span
        className={`w-20 text-center text-[10px] font-bold tracking-wider uppercase ${
          item.status === 'current'
            ? 'text-amber-400'
            : item.status === 'finished'
              ? 'text-emerald-400'
              : item.status === 'cancelled'
                ? 'text-red-400'
                : item.status === 'skipped'
                  ? 'text-white/30'
                  : 'text-white/30'
        }`}
      >
        {item.status}
      </span>

      {/* Actions */}
      <div className="flex gap-1">
        {item.status === 'waiting' && (
          <>
            <button
              onClick={() => skipQueue(item.id)}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white/40 transition-colors hover:border-amber-400/30 hover:text-amber-300"
            >
              Skip
            </button>
            <button
              onClick={() => cancelQueue(item.id)}
              className="rounded-lg border border-red-400/20 px-2.5 py-1.5 text-[10px] font-bold text-red-300 transition-colors hover:border-red-400/40 hover:text-red-200"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function OperatorPanel() {
  const {
    items,
    currentQueue,
    waitingQueue,
    finishedQueue,
    addParticipant,
    addPriority,
    nextQueue,
    resetQueue,
    estimatedWaitPerItem,
    setEstimatedWait,
    prefix,
    setPrefix,
  } = useQueueStore();

  // Keep the queue cache in sync with the backend via REST + Socket.IO.
  useQueueSync();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    company: '',
    email: '',
  });
  const [isPriority, setIsPriority] = useState(false);

  const handleAdd = async () => {
    if (!formData.fullName.trim() || !formData.company.trim()) return;

    const payload = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      company: formData.company.trim(),
      email: formData.email.trim(),
    };

    try {
      if (isPriority) {
        await addPriority(payload);
      } else {
        await addParticipant(payload);
      }
    } catch {
      // Registration/queue errors are surfaced via the store sync state.
      return;
    }

    setFormData({ fullName: '', phone: '', company: '', email: '' });
    setIsPriority(false);
    setShowAddForm(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] p-6">
      {/* Header */}
      <motion.div
        className="mb-6 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-black tracking-wider text-white">Operator Panel</h1>
          <p className="text-sm text-white/30">Queue management control center</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-sm font-bold text-slate-900 shadow-lg shadow-amber-400/20 transition-all hover:shadow-amber-400/40"
          >
            {showAddForm ? 'Close' : '+ Add Participant'}
          </button>
          <button
            onClick={nextQueue}
            disabled={!currentQueue && waitingQueue.length === 0}
            className="rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-bold text-slate-900 shadow-lg shadow-emerald-400/20 transition-all hover:shadow-emerald-400/40 disabled:opacity-30"
          >
            Next Queue
          </button>
          <button
            onClick={resetQueue}
            className="rounded-xl border border-red-400/30 px-4 py-2 text-sm font-bold text-red-300 transition-all hover:border-red-400/50"
          >
            Reset
          </button>
        </div>
      </motion.div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.fullName}
                  onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-amber-400/30"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-amber-400/30"
                />
                <input
                  type="text"
                  placeholder="Company *"
                  value={formData.company}
                  onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-amber-400/30"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-amber-400/30"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPriority}
                    onChange={(e) => setIsPriority(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className={`h-4 w-4 rounded border transition-all ${
                      isPriority
                        ? 'border-amber-400 bg-amber-400'
                        : 'border-white/20 bg-white/[0.03]'
                    }`}
                  >
                    {isPriority && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#020617"
                        strokeWidth="3"
                        className="h-4 w-4"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-bold tracking-wider text-amber-300 uppercase">
                    Priority
                  </span>
                </label>
                <button
                  onClick={handleAdd}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-2 text-sm font-bold text-slate-900"
                >
                  Add to Queue
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <motion.div
        className="mb-6 grid grid-cols-5 gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
          <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase">Total</p>
          <p className="text-xl font-black text-white">{items.length}</p>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-center">
          <p className="text-[10px] font-bold tracking-wider text-amber-400/60 uppercase">
            Current
          </p>
          <p className="text-xl font-black text-amber-300">{currentQueue ? 1 : 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
          <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase">Waiting</p>
          <p className="text-xl font-black text-white">{waitingQueue.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-center">
          <p className="text-[10px] font-bold tracking-wider text-emerald-400/60 uppercase">
            Finished
          </p>
          <p className="text-xl font-black text-emerald-400">{finishedQueue.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
          <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase">Est. Wait</p>
          <p className="text-xl font-black text-white">
            {waitingQueue.length * estimatedWaitPerItem}min
          </p>
        </div>
      </motion.div>

      {/* Settings */}
      <motion.div
        className="mb-6 flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold tracking-wider text-white/30 uppercase">
            Prefix:
          </label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            maxLength={2}
            className="w-12 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-center text-sm font-bold text-white outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold tracking-wider text-white/30 uppercase">
            Wait/Item:
          </label>
          <input
            type="number"
            value={estimatedWaitPerItem}
            onChange={(e) => setEstimatedWait(Number(e.target.value))}
            min={1}
            max={30}
            className="w-16 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-center text-sm font-bold text-white outline-none"
          />
          <span className="text-xs text-white/20">min</span>
        </div>
      </motion.div>

      {/* Queue List */}
      <motion.div
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">
            All Participants
          </h2>
          <span className="text-xs text-white/20">{items.length} total</span>
        </div>
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.p
                className="py-12 text-center text-sm text-white/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No participants yet. Add one to get started.
              </motion.p>
            ) : (
              items.map((item) => <ParticipantRow key={item.id} item={item} />)
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
