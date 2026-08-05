// ============================================================
// Sponsors Page
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';

const mockSponsors = [
  {
    id: '1',
    name: 'TechCorp',
    tier: 'platinum' as const,
    website: 'https://techcorp.com',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: '2',
    name: 'MegaStore',
    tier: 'gold' as const,
    website: 'https://megastore.com',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: '3',
    name: 'FreshBrands',
    tier: 'silver' as const,
    website: 'https://freshbrands.com',
    isActive: true,
    sortOrder: 3,
  },
  {
    id: '4',
    name: 'LocalBiz',
    tier: 'standard' as const,
    website: 'https://localbiz.com',
    isActive: false,
    sortOrder: 4,
  },
  {
    id: '5',
    name: 'GlobalTech',
    tier: 'platinum' as const,
    website: 'https://globaltech.com',
    isActive: true,
    sortOrder: 5,
  },
  {
    id: '6',
    name: 'QuickShop',
    tier: 'gold' as const,
    website: 'https://quickshop.com',
    isActive: true,
    sortOrder: 6,
  },
];

const tierColors: Record<string, string> = {
  platinum: 'bg-secondary-500/20 text-secondary-400',
  gold: 'bg-warning-500/20 text-warning-400',
  silver: 'bg-dark-text-tertiary/20 text-dark-text-tertiary',
  standard: 'bg-primary-500/20 text-primary-400',
};

export default function SponsorsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = mockSponsors.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sponsors</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{filtered.length} sponsors</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm">
          <HiOutlinePlus className="w-4 h-4" />
          Add Sponsor
        </button>
      </div>

      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search sponsors..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-dark-border bg-dark-surface-secondary p-5 hover:border-dark-border/80 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-dark-surface-tertiary flex items-center justify-center text-xl font-bold text-white">
                {s.name[0]}
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${tierColors[s.tier]}`}
              >
                {s.tier}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white">{s.name}</h3>
            <p className="text-xs text-dark-text-tertiary mt-1 truncate">{s.website}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-border/50">
              <span
                className={`text-xs font-medium ${s.isActive ? 'text-success-400' : 'text-danger-400'}`}
              >
                {s.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-dark-text-tertiary">Order: {s.sortOrder}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between">
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
  );
}
