// ============================================================
// Queue Page
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import { queueApi, type QueueEntry } from '@api/queue';

const statusColors: Record<string, string> = {
  waiting: 'bg-warning-500/20 text-warning-400',
  called: 'bg-primary-500/20 text-primary-400',
  completed: 'bg-success-500/20 text-success-400',
  cancelled: 'bg-dark-surface-tertiary text-dark-text-tertiary',
  skipped: 'bg-dark-surface-tertiary text-dark-text-tertiary',
};

const REFRESH_MS = 15_000;

export default function QueuePage() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = useCallback(async () => {
    try {
      const res = await queueApi.getOperatorState();
      const state = res.data;
      // Newest first so the table shows the live end of the queue.
      setEntries([...(state?.entries ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setEstimatedWait(state?.estimatedWait ?? 0);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat antrean');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const callNext = async () => {
    setBusy(true);
    try {
      await queueApi.callNext();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memanggil antrean berikutnya');
    } finally {
      setBusy(false);
      void load();
    }
  };

  const term = search.toLowerCase();
  const filtered = entries.filter(
    (e) => e.participantName.toLowerCase().includes(term) || e.queueNumber.toLowerCase().includes(term),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const waitingCount = entries.filter((e) => e.status === 'waiting').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Queue</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">
            {waitingCount} menunggu · {entries.length} total
            {estimatedWait > 0 ? ` · estimasi ${estimatedWait} menit` : ''}
          </p>
        </div>
        <button
          onClick={callNext}
          disabled={busy || waitingCount === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <HiOutlineArrowPath className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          Panggil Berikutnya
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search queue..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
        />
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Queue #
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Participant
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-dark-text-tertiary">
                    {loading ? 'Memuat antrean…' : 'Belum ada antrean.'}
                  </td>
                </tr>
              )}
              {paginated.map((q, i) => (
                <motion.tr
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-dark-surface-tertiary/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-dark-text-secondary font-mono">{q.queueNumber}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{q.participantName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[q.status] ?? statusColors.cancelled}`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-text-tertiary">
                    {new Date(q.createdAt).toLocaleTimeString('id-ID')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
          <p className="text-sm text-dark-text-tertiary">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm transition-colors ${p === page ? 'bg-primary-500/20 text-primary-400' : 'text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
