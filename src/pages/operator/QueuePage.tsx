// ============================================================
// Queue Page
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMagnifyingGlass, HiOutlineArrowPath, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

const mockQueue = Array.from({ length: 20 }, (_, i) => ({
  id: `Q${String(i + 1).padStart(3, '0')}`,
  participantName: `Participant ${i + 1}`,
  ticketNumber: `TKT-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
  status: i < 5 ? 'waiting' : i < 12 ? 'in-progress' : 'completed',
  joinedAt: new Date(Date.now() - i * 300000).toISOString(),
  estimatedWait: `${Math.floor(Math.random() * 15) + 1} min`,
}));

const statusColors: Record<string, string> = {
  waiting: 'bg-warning-500/20 text-warning-400',
  'in-progress': 'bg-primary-500/20 text-primary-400',
  completed: 'bg-success-500/20 text-success-400',
};

export default function QueuePage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = mockQueue.filter(
    (q) => q.participantName.toLowerCase().includes(search.toLowerCase()) || q.ticketNumber.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Queue</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{filtered.length} entries in queue</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm">
          <HiOutlineArrowPath className="w-4 h-4" />
          Advance Queue
        </button>
      </div>

      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search queue..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
        />
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Queue #</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Participant</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Ticket</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Est. Wait</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              {paginated.map((q, i) => (
                <motion.tr
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-dark-surface-tertiary/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-dark-text-secondary font-mono">{q.id}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{q.participantName}</td>
                  <td className="px-4 py-3 text-sm text-dark-text-secondary font-mono">{q.ticketNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[q.status]}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-text-secondary">{q.estimatedWait}</td>
                  <td className="px-4 py-3 text-sm text-dark-text-tertiary">
                    {new Date(q.joinedAt).toLocaleTimeString()}
                  </td>
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
