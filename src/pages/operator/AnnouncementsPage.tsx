// ============================================================
// Announcements Page
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';

const mockAnnouncements = [
  {
    id: '1',
    title: 'System Maintenance',
    message: 'Scheduled maintenance tonight at 2 AM. System will be offline for 30 minutes.',
    type: 'warning' as const,
    priority: 2,
    isActive: true,
    createdBy: 'Admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Grand Prize Update',
    message: 'The grand prize has been upgraded to include a luxury vacation package!',
    type: 'success' as const,
    priority: 1,
    isActive: true,
    createdBy: 'Admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Emergency Shutdown',
    message: 'Emergency maintenance due to database issue. Please stand by.',
    type: 'emergency' as const,
    priority: 3,
    isActive: false,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'New Feature Release',
    message: 'Real-time queue tracking is now available on the dashboard.',
    type: 'info' as const,
    priority: 1,
    isActive: true,
    createdBy: 'Admin',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const typeColors: Record<string, string> = {
  info: 'bg-primary-500/20 text-primary-400',
  warning: 'bg-warning-500/20 text-warning-400',
  success: 'bg-success-500/20 text-success-400',
  emergency: 'bg-danger-500/20 text-danger-400',
};

export default function AnnouncementsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = mockAnnouncements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.message.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Announcements</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{filtered.length} announcements</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm">
          <HiOutlinePlus className="w-4 h-4" />
          New Announcement
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
          placeholder="Search announcements..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
        />
      </div>

      <div className="space-y-3">
        {paginated.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-dark-border bg-dark-surface-secondary p-5"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[a.type]}`}
                >
                  {a.type}
                </span>
                <h3 className="text-sm font-semibold text-white">{a.title}</h3>
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${a.isActive ? 'bg-success-500/20 text-success-400' : 'bg-danger-500/20 text-danger-400'}`}
              >
                {a.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-dark-text-secondary ml-1">{a.message}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-dark-text-tertiary">
              <span>Priority: {a.priority}</span>
              <span>·</span>
              <span>By: {a.createdBy}</span>
              <span>·</span>
              <span>{new Date(a.createdAt).toLocaleDateString()}</span>
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
