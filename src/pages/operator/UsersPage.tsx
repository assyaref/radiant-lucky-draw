// ============================================================
// Users Page
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

const mockUsers = [
  { id: '1', name: 'Admin User', email: 'admin@radiant.com', role: 'admin' as const, status: 'active' as const, lastLogin: new Date().toISOString() },
  { id: '2', name: 'Operator One', email: 'op1@radiant.com', role: 'operator' as const, status: 'active' as const, lastLogin: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', name: 'Operator Two', email: 'op2@radiant.com', role: 'operator' as const, status: 'active' as const, lastLogin: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', name: 'Viewer One', email: 'viewer@radiant.com', role: 'viewer' as const, status: 'inactive' as const, lastLogin: new Date(Date.now() - 604800000).toISOString() },
  { id: '5', name: 'Suspended User', email: 'suspended@radiant.com', role: 'operator' as const, status: 'suspended' as const, lastLogin: new Date(Date.now() - 2592000000).toISOString() },
];

const roleColors: Record<string, string> = {
  admin: 'bg-danger-500/20 text-danger-400',
  operator: 'bg-primary-500/20 text-primary-400',
  viewer: 'bg-dark-text-tertiary/20 text-dark-text-tertiary',
};

const statusColors: Record<string, string> = {
  active: 'bg-success-500/20 text-success-400',
  inactive: 'bg-warning-500/20 text-warning-400',
  suspended: 'bg-danger-500/20 text-danger-400',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = mockUsers.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{filtered.length} users</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm">
          <HiOutlinePlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users..." className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm" />
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              {paginated.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="hover:bg-dark-surface-tertiary/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-xs font-bold text-white">
                        {u.name[0]}
                      </div>
                      <span className="text-sm text-white font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-text-secondary">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleColors[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[u.status]}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-text-tertiary">{new Date(u.lastLogin).toLocaleDateString()}</td>
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
