// ============================================================
// Booth Participants Page (Admin)
//
// Displays all registered booth participants with:
//   - Face photo
//   - Name
//   - PT / Company
//   - WhatsApp number
//   - Registration date
//   - Prize
//   - Claim status
//   - Search, filter, pagination
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

import { boothApi, type BoothParticipant } from '@/api/booth';

const claimStatusColors: Record<string, string> = {
  unclaimed: 'bg-warning-500/20 text-warning-400',
  claimed: 'bg-success-500/20 text-success-400',
};

export default function BoothParticipantsPage() {
  const [participants, setParticipants] = useState<BoothParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await boothApi.listParticipants({
        page,
        limit: pageSize,
        search: search || undefined,
      });
      setParticipants(res.data ?? []);
      setTotal(res.meta?.total ?? res.data?.length ?? 0);
    } catch (err: any) {
      setError(err?.message ?? 'Gagal memuat data peserta');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    let cancelled = false;

    boothApi
      .listParticipants({
        page,
        limit: pageSize,
        search: search || undefined,
      })
      .then((res) => {
        if (!cancelled) {
          setParticipants(res.data ?? []);
          setTotal(res.meta?.total ?? res.data?.length ?? 0);
          setError('');
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message ?? 'Gagal memuat data peserta');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Peserta</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{total} total peserta</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm"
        >
          <HiOutlineArrowPath className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari nama, perusahaan, atau WhatsApp..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
        />
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
                  WhatsApp
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Tanggal Registrasi
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
              ) : participants.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-dark-text-tertiary text-sm"
                  >
                    Belum ada peserta
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
                    <td className="px-4 py-3">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.name}
                          className="w-10 h-10 rounded-full object-cover border border-dark-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-dark-surface-tertiary flex items-center justify-center text-dark-text-tertiary text-xs">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-dark-text-secondary">{p.company}</td>
                    <td className="px-4 py-3 text-sm text-dark-text-secondary">
                      {p.whatsapp || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-text-tertiary">
                      {new Date(p.registeredAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${claimStatusColors[p.hasPhoto ? 'claimed' : 'unclaimed']}`}
                      >
                        {p.hasPhoto ? 'Foto Tersimpan' : 'Belum Foto'}
                      </span>
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
