// ============================================================
// Audit Logs Page — live data from GET /api/audit-logs
// ============================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import api from '@api/client';

interface AuditLogRow {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string;
  createdAt: string;
  user: { id: string; username: string; email: string; role: string } | null;
}

interface Paginated<T> {
  data: T[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

const PAGE_SIZE = 25;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get<Paginated<AuditLogRow>>(`/audit-logs?page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => {
        if (!alive) return;
        setLogs(res.data ?? []);
        setTotal(res.meta?.total ?? res.data?.length ?? 0);
        setError(null);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'Gagal memuat audit log');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page]);

  const term = search.toLowerCase();
  const filtered = logs.filter(
    (l) =>
      (l.user?.username ?? 'system').toLowerCase().includes(term) ||
      l.action.toLowerCase().includes(term) ||
      l.entity.toLowerCase().includes(term),
  );
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-sm text-dark-text-tertiary mt-1">{total} catatan</p>
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
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari di halaman ini (user, aksi, entitas)…"
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
        />
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                {['User', 'Aksi', 'Entitas', 'IP Address', 'Waktu'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-dark-text-tertiary">
                    {loading ? 'Memuat audit log…' : 'Belum ada catatan.'}
                  </td>
                </tr>
              )}
              {filtered.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 10) * 0.03 }}
                  className="hover:bg-dark-surface-tertiary/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white font-medium">
                    {log.user?.username ?? 'System'}
                    {log.user?.role && (
                      <span className="ml-2 text-xs text-dark-text-tertiary">{log.user.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-500/20 text-primary-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-text-secondary">{log.entity}</td>
                  <td className="px-4 py-3 text-sm text-dark-text-tertiary font-mono">
                    {log.ipAddress || '–'}
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-text-tertiary">
                    {new Date(log.createdAt).toLocaleString('id-ID')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
          <p className="text-sm text-dark-text-tertiary">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
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
