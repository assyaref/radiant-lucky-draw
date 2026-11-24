// ============================================================
// Lucky Draw Page
// ============================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import api from '@api/client';

interface DrawRow {
  id: string;
  name: string;
  prizeName: string;
  status: string;
  participantIds?: string[];
  winnerName?: string;
  completedAt?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-dark-text-tertiary/20 text-dark-text-tertiary',
  countdown: 'bg-success-500/20 text-success-400',
  spinning: 'bg-success-500/20 text-success-400',
  revealed: 'bg-success-500/20 text-success-400',
  completed: 'bg-primary-500/20 text-primary-400',
  cancelled: 'bg-danger-500/20 text-danger-400',
};

export default function DrawsPage() {
  const [draws, setDraws] = useState<DrawRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let alive = true;
    api
      .get<{ data: DrawRow[] }>('/draws?page=1&limit=200')
      .then((res) => {
        if (alive) setDraws(res.data ?? []);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'Gagal memuat riwayat undian');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const term = search.toLowerCase();
  const filtered = draws.filter(
    (d) =>
      (d.name ?? '').toLowerCase().includes(term) ||
      (d.prizeName ?? '').toLowerCase().includes(term) ||
      (d.winnerName ?? '').toLowerCase().includes(term),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lucky Draw</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{filtered.length} undian</p>
        </div>
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
          placeholder="Search draws..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
        />
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Undian
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Hadiah
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Peserta
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Pemenang
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Waktu
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-dark-text-tertiary">
                    {loading ? 'Memuat riwayat undian…' : 'Belum ada undian.'}
                  </td>
                </tr>
              )}
              {paginated.map((d, i) => (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-dark-surface-tertiary/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-white font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-sm text-dark-text-secondary">{d.prizeName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[d.status] ?? statusColors.pending}`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-text-secondary">{d.participantIds?.length ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-dark-text-secondary">{d.winnerName ?? '–'}</td>
                  <td className="px-4 py-3 text-sm text-dark-text-tertiary">
                    {new Date(d.completedAt ?? d.createdAt).toLocaleString('id-ID')}
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
