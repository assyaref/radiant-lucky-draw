// ============================================================
// Audit Logs Page
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMagnifyingGlass, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

const mockLogs = Array.from({ length: 20 }, (_, i) => ({
  id: `LOG-${String(i + 1).padStart(4, '0')}`,
  userName: ['Admin User', 'Operator One', 'Operator Two', 'System'][Math.floor(Math.random() * 4)],
  action: ['login', 'logout', 'draw_start', 'draw_complete', 'update', 'create', 'delete'][Math.floor(Math.random() * 7)],
  entity: ['user', 'draw', 'prize', 'participant', 'settings'][Math.floor(Math.random() * 5)],
  ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
}));

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = mockLogs.filter((l) =>
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entity.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-sm text-dark-text-tertiary mt-1">{filtered.length} log entries</p>
      </div>

      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search logs..." className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm" />
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">IP Address</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              {paginated.map((log, i) => (
                <motion.tr key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-dark-surface-tertiary/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-dark-text-secondary font-mono">{log.id}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{log.userName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-500/20 text-primary-400">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-text-secondary">{log.entity}</td>
                  <td className="px-4 py-3 text-sm text-dark-text-tertiary font-mono">{log.ipAddress}</td>
                  <td className="px-4 py-3 text-sm text-dark-text-tertiary">{new Date(log.createdAt).toLocaleString()}</td>
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
