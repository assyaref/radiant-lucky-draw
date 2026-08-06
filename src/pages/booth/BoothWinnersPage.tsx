// ============================================================
// Booth Winners Page (Admin)
//
// Displays all lucky draw winners with:
//   - Face photo
//   - Name
//   - PT / Company
//   - Prize
//   - Win date
//   - Claim status (with toggle to mark claimed)
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineArrowPath } from 'react-icons/hi2';
import { boothApi, type Winner } from '@/api/booth';

const claimStatusColors: Record<string, string> = {
  unclaimed: 'bg-warning-500/20 text-warning-400',
  claimed: 'bg-success-500/20 text-success-400',
};

export default function BoothWinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [claimFilter, setClaimFilter] = useState<string>('');
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await boothApi.listWinners({
        page,
        limit: pageSize,
        claimStatus: claimFilter || undefined,
      });
      setWinners(res.data ?? []);
      setTotal(res.meta?.total ?? res.data?.length ?? 0);
    } catch (err: any) {
      setError(err?.message ?? 'Gagal memuat data pemenang');
    } finally {
      setLoading(false);
    }
  }, [page, claimFilter]);

  useEffect(() => {
    let cancelled = false;

    boothApi
      .listWinners({
        page,
        limit: pageSize,
        claimStatus: claimFilter || undefined,
      })
      .then((res) => {
        if (!cancelled) {
          setWinners(res.data ?? []);
          setTotal(res.meta?.total ?? res.data?.length ?? 0);
          setError('');
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message ?? 'Gagal memuat data pemenang');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, claimFilter]);

  const handleToggleClaim = useCallback(async (winner: Winner) => {
    const next = winner.claimStatus === 'claimed' ? 'unclaimed' : 'claimed';
    try {
      await boothApi.updateClaimStatus(winner.id, next);
      setWinners((prev) => prev.map((w) => (w.id === winner.id ? { ...w, claimStatus: next } : w)));
    } catch (err: any) {
      setError(err?.message ?? 'Gagal mengubah status klaim');
    }
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pemenang</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{total} total pemenang</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm"
        >
          <HiOutlineArrowPath className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['', 'unclaimed', 'claimed'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setClaimFilter(status);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
              claimFilter === status
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/20'
                : 'bg-dark-surface-secondary text-dark-text-tertiary hover:text-white border border-dark-border'
            }`}
          >
            {status === '' ? 'Semua' : status === 'unclaimed' ? 'Belum Klaim' : 'Sudah Klaim'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-500/20 border border-danger-500/30 text-danger-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Foto
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Nama
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  PT / Perusahaan
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Hadiah
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Tanggal Menang
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Status Klaim
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-dark-text-tertiary text-sm"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : winners.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-dark-text-tertiary text-sm"
                  >
                    Belum ada pemenang
                  </td>
                </tr>
              ) : (
                winners.map((w, i) => (
                  <motion.tr
                    key={w.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-dark-surface-tertiary/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {w.participantPhotoUrl ? (
                        <img
                          src={w.participantPhotoUrl}
                          alt={w.participantName}
                          className="w-10 h-10 rounded-full object-cover border border-dark-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-dark-surface-tertiary flex items-center justify-center text-dark-text-tertiary text-xs">
                          {w.participantName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {w.participantName}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-text-secondary">
                      {w.participantCompany || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {w.prizeImageUrl && (
                          <img
                            src={w.prizeImageUrl}
                            alt={w.prizeName}
                            className="w-8 h-8 rounded object-cover border border-dark-border"
                          />
                        )}
                        <span className="text-sm text-white">{w.prizeName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-text-tertiary">
                      {new Date(w.announcedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleClaim(w)}
                        className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${claimStatusColors[w.claimStatus]}`}
                      >
                        {w.claimStatus === 'claimed' ? 'Sudah Klaim' : 'Belum Klaim'}
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
