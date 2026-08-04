// ============================================================
// Lucky Draw Page
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

const mockDraws = Array.from({ length: 15 }, (_, i) => ({
  id: `DRW-${String(i + 1).padStart(3, '0')}`,
  title: ['Grand Prize Draw', 'Consolation Draw', 'Special Lucky Draw', 'Mega Jackpot', 'Daily Draw'][Math.floor(Math.random() * 5)],
  status: ['draft', 'active', 'completed', 'cancelled'][Math.floor(Math.random() * 4)] as 'draft' | 'active' | 'completed' | 'cancelled',
  participants: Math.floor(Math.random() * 200) + 50,
  winnerCount: Math.floor(Math.random() * 5) + 1,
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 14).toISOString(),
}));

const statusColors: Record<string, string> = {
  draft: 'bg-dark-text-tertiary/20 text-dark-text-tertiary',
  active: 'bg-success-500/20 text-success-400',
  completed: 'bg-primary-500/20 text-primary-400',
  cancelled: 'bg-danger-500/20 text-danger-400',
};

export default function DrawsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = mockDraws.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lucky Draw</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{filtered.length} draws</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm">
          <HiOutlinePlus className="w-4 h-4" />
          New Draw
        </button>
      </div>

      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search draws..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
        />
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Participants</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Winners</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              {paginated.map((d, i) => (
                <motion.tr key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-dark-surface-tertiary/50 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm text-dark-text-secondary font-mono">{d.id}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{d.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[d.status]}`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-text-secondary">{d.participants}</td>
                  <td className="px-4 py-3 text-sm text-dark-text-secondary">{d.winnerCount}</td>
                  <td className="px-4 py-3 text-sm text-dark-text-tertiary">{new Date(d.createdAt).toLocaleDateString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
          <p className="text-sm text-dark-text-tertiary">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm transition-colors ${p === page ? 'bg-primary-500/20 text-primary-400' : 'text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
