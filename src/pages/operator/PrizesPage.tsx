// ============================================================
// Prizes Page
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

const mockPrizes = Array.from({ length: 18 }, (_, i) => ({
  id: `PRZ-${String(i + 1).padStart(3, '0')}`,
  name: ['Samsung Galaxy S25', 'Apple Watch Ultra', 'Dyson Airwrap', 'Sony WH-1000XM6', 'Nintendo Switch 2', 'AirPods Pro 3', 'iPad Air', 'MacBook Pro', 'PS5 Pro', 'DJI Mini 5'][Math.floor(Math.random() * 10)],
  tier: ['gold', 'silver', 'bronze', 'special'][Math.floor(Math.random() * 4)] as 'gold' | 'silver' | 'bronze' | 'special',
  quantity: Math.floor(Math.random() * 20) + 1,
  remaining: Math.floor(Math.random() * 15),
  status: Math.random() > 0.2 ? 'active' : 'inactive',
}));

const tierColors: Record<string, string> = {
  gold: 'bg-warning-500/20 text-warning-400',
  silver: 'bg-dark-text-tertiary/20 text-dark-text-tertiary',
  bronze: 'bg-accent-500/20 text-accent-400',
  special: 'bg-secondary-500/20 text-secondary-400',
};

export default function PrizesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = mockPrizes.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prizes</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{filtered.length} prizes</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm">
          <HiOutlinePlus className="w-4 h-4" />
          Add Prize
        </button>
      </div>

      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search prizes..." className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm" />
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Tier</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Quantity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Remaining</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              {paginated.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-dark-surface-tertiary/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-dark-text-secondary font-mono">{p.id}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tierColors[p.tier]}`}>{p.tier}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-text-secondary">{p.quantity}</td>
                  <td className="px-4 py-3 text-sm text-dark-text-secondary">{p.remaining}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${p.status === 'active' ? 'bg-success-500/20 text-success-400' : 'bg-danger-500/20 text-danger-400'}`}>
                      {p.status}
                    </span>
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
