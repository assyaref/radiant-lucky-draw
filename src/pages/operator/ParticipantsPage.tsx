// ============================================================
// Participants Page
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineTrash,
  HiXMark,
} from 'react-icons/hi2';
import { boothApi, type BoothParticipant } from '@/api/booth';

const statusColors: Record<string, string> = {
  registered: 'bg-primary-500/20 text-primary-400',
  called: 'bg-warning-500/20 text-warning-400',
  completed: 'bg-success-500/20 text-success-400',
  cancelled: 'bg-dark-text-tertiary/20 text-dark-text-tertiary',
};

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<BoothParticipant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [forceDeleteId, setForceDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState('');
  const pageSize = 10;

  useEffect(() => {
    let cancelled = false;

    const fetchParticipants = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await boothApi.listParticipants({
          page,
          limit: pageSize,
          search: search || undefined,
        });
        if (!cancelled) {
          setParticipants(res.data || []);
          setTotal(res.meta?.total ?? 0);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load participants');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchParticipants();

    return () => {
      cancelled = true;
    };
  }, [page, search]);

  const handleDelete = async (force: boolean = false) => {
    const targetId = force ? forceDeleteId : deleteId;
    if (!targetId) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await boothApi.deleteParticipant(targetId, force);
      setParticipants((prev) => prev.filter((p) => p.id !== targetId));
      setTotal((t) => t - 1);
      setToast('Participant deleted successfully');
      setTimeout(() => setToast(''), 3000);
    } catch (err: any) {
      if (!force && err?.status === 403) {
        // Winner protection — ask for force delete confirmation
        setForceDeleteId(targetId);
        setDeleteId(null);
        setDeleting(false);
        return;
      }
      setDeleteError(err?.message ?? 'Failed to delete participant');
    } finally {
      setDeleting(false);
      setDeleteId(null);
      setForceDeleteId(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg bg-success-500/20 border border-success-500/30 text-success-400 text-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-surface-secondary border border-dark-border rounded-xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Delete Participant?</h3>
                <button
                  onClick={() => setDeleteId(null)}
                  className="p-1 rounded-lg text-dark-text-tertiary hover:text-white transition-colors"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-dark-text-secondary mb-6">
                This action cannot be undone. All related queue entries, draw records, and winner
                data will be permanently removed.
              </p>
              {deleteError && <p className="text-sm text-red-400 mb-4">{deleteError}</p>}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {forceDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setForceDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-surface-secondary border border-dark-border rounded-xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Force Delete Winner?</h3>
                <button
                  onClick={() => setForceDeleteId(null)}
                  className="p-1 rounded-lg text-dark-text-tertiary hover:text-white transition-colors"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-dark-text-secondary mb-2">
                This participant has already won a prize.
              </p>
              <p className="text-sm text-warning-400 mb-6">
                Forcing deletion will also remove their winner record. This cannot be undone.
              </p>
              {deleteError && <p className="text-sm text-red-400 mb-4">{deleteError}</p>}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setForceDeleteId(null)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(true)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting ? 'Deleting...' : 'Force Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Participants</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{total} total participants</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search participants..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
          />
        </div>
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Photo
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Registered
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-dark-text-tertiary"
                  >
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-red-400">
                    {error}
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-dark-text-tertiary"
                  >
                    No participants found.
                  </td>
                </tr>
              ) : (
                participants.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-dark-surface-tertiary/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-white font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-dark-text-secondary">
                      {p.company || '\u2014'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[p.status || 'registered'] || statusColors.registered}`}
                      >
                        {p.status || 'registered'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-text-tertiary">
                      {p.hasPhoto ? '📸' : '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-text-tertiary">
                      {new Date(p.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete participant"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
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
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${p === page ? 'bg-primary-500/20 text-primary-400' : 'text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
