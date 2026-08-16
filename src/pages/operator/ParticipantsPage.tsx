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
  HiOutlineArrowDownTray,
  HiXMark,
} from 'react-icons/hi2';
import { boothApi, type BoothParticipant } from '@/api/booth';
import {
  formatWhatsApp,
  toWhatsAppLink,
  buildCsv,
  downloadCsvFile,
  normalizeImageUrl,
} from '@/utils';

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
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [exporting, setExporting] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string } | null>(null);
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewPhoto(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleDelete = async (force: boolean = false) => {
    const targetId = force ? forceDeleteId : deleteId;
    if (!targetId) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await boothApi.deleteParticipant(targetId, force);
      setParticipants((prev) => prev.filter((p) => p.id !== targetId));
      setTotal((t) => t - 1);
      showToast('Participant deleted successfully');
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
      // Only clear forceDeleteId on force-delete completion (success or error)
      if (force) {
        setForceDeleteId(null);
      }
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast(message);
    setToastType(type);
    window.setTimeout(() => setToast(''), type === 'error' ? 5000 : 3000);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await boothApi.listAllParticipants();
      const rows = res.data ?? [];
      const now = new Date();
      const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-');

      const csv = buildCsv([
        ['No', 'Name', 'Company', 'WhatsApp', 'Status', 'Photo', 'Registered At'],
        ...rows.map((p, i) => [
          i + 1,
          p.name,
          p.company,
          p.phone ?? '',
          p.status ?? '',
          p.photoUrl ?? '',
          p.registeredAt.slice(0, 10),
        ]),
      ]);

      downloadCsvFile(`participants-${date}.csv`, csv);
      showToast(`Exported ${rows.length} participants`);
    } catch (err: any) {
      showToast(err?.message ?? 'Failed to export participants', 'error');
    } finally {
      setExporting(false);
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
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-sm ${
              toastType === 'error'
                ? 'bg-red-500/20 border-red-500/30 text-red-400'
                : 'bg-success-500/20 border-success-500/30 text-success-400'
            }`}
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

      <AnimatePresence>
        {previewPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setPreviewPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl"
            >
              <button
                onClick={() => setPreviewPhoto(null)}
                aria-label="Close preview"
                className="absolute -top-10 right-0 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <HiXMark className="w-6 h-6" />
              </button>
              <img
                src={normalizeImageUrl(previewPhoto.url)}
                alt={previewPhoto.name}
                className="w-full max-h-[80vh] object-contain rounded-2xl border border-white/10 bg-black"
              />
              <p className="mt-3 text-center text-sm text-white/70">{previewPhoto.name}</p>
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
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiOutlineArrowDownTray className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export'}
        </button>
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
                  WhatsApp
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
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-dark-text-tertiary"
                  >
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-red-400">
                    {error}
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
                    <td className="px-4 py-3 text-sm text-dark-text-secondary">
                      {p.phone ? (
                        <a
                          href={toWhatsAppLink(p.phone) ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:underline"
                        >
                          {formatWhatsApp(p.phone)}
                        </a>
                      ) : (
                        <span className="text-dark-text-tertiary">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[p.status || 'registered'] || statusColors.registered}`}
                      >
                        {p.status || 'registered'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.photoUrl ? (
                        <button
                          onClick={() => setPreviewPhoto({ url: p.photoUrl ?? '', name: p.name })}
                          className="group relative w-10 h-10 rounded-full overflow-hidden border border-dark-border hover:border-primary-500/60 transition-colors"
                          title={`View ${p.name}'s photo`}
                        >
                          <img
                            src={normalizeImageUrl(p.photoUrl)}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <span className="text-dark-text-tertiary text-sm">{'\u2014'}</span>
                      )}
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
