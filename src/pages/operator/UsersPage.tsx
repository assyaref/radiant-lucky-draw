// ============================================================
// Users Page — manajemen akun staf (super admin, event manager,
// operator, registration staff, viewer)
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePencilSquare,
  HiOutlineKey,
  HiOutlineTrash,
  HiOutlineNoSymbol,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

import { userApi, type ManagedUser } from '@api/user';
import { ApiClientError } from '@api/client';
import { useAuth, ROLES, ROLE_LABELS, PERMISSIONS, type Role } from '@features/auth';

// ─── Helpers ─────────────────────────────────────────────────────────

const ROLE_OPTIONS: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.EVENT_MANAGER,
  ROLES.OPERATOR,
  ROLES.REGISTRATION_STAFF,
  ROLES.VIEWER,
];

const roleColors: Record<Role, string> = {
  super_admin: 'bg-danger-500/20 text-danger-400',
  event_manager: 'bg-secondary-500/20 text-secondary-400',
  operator: 'bg-primary-500/20 text-primary-400',
  registration_staff: 'bg-success-500/20 text-success-400',
  viewer: 'bg-dark-text-tertiary/20 text-dark-text-tertiary',
};

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm';

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan';
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => chars[b % chars.length]).join('');
  return `${body}${(bytes[0] % 10).toString()}`; // always contains a digit
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Belum pernah';
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Password minimal 8 karakter';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password harus mengandung huruf dan angka';
  return null;
}

// ─── Modal shell ─────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-md rounded-xl border border-dark-border bg-dark-surface-secondary shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function ModalActions({
  onCancel,
  submitLabel,
  busy,
  danger,
}: {
  onCancel: () => void;
  submitLabel: string;
  busy: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-lg text-sm text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary"
      >
        Batal
      </button>
      <button
        type="submit"
        disabled={busy}
        className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
          danger
            ? 'bg-danger-500/20 text-danger-300 hover:bg-danger-500/30'
            : 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30'
        }`}
      >
        {busy ? 'Menyimpan…' : submitLabel}
      </button>
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-sm text-danger-400 bg-danger-500/10 border border-danger-500/20 rounded-lg px-3 py-2">
      {message}
    </p>
  );
}

// ─── Create / edit user ──────────────────────────────────────────────

function UserFormModal({
  user,
  isSelf,
  canAssignSuperAdmin,
  onClose,
  onSaved,
}: {
  user: ManagedUser | null;
  isSelf: boolean;
  canAssignSuperAdmin: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isEdit = !!user;
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? ROLES.OPERATOR);
  const [password, setPassword] = useState(isEdit ? '' : generatePassword());
  const [showPassword, setShowPassword] = useState(!isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = ROLE_OPTIONS.filter((r) => canAssignSuperAdmin || r !== ROLES.SUPER_ADMIN || role === r);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isEdit) {
      const problem = passwordProblem(password);
      if (problem) return setError(problem);
    }
    setBusy(true);
    try {
      if (isEdit) {
        await userApi.update(user!.id, {
          username: username !== user!.username ? username : undefined,
          email: email !== user!.email ? email : undefined,
          role: role !== user!.role ? role : undefined,
        });
        onSaved(`Pengguna ${username} diperbarui`);
      } else {
        await userApi.create({ username, email, password, role });
        onSaved(`Pengguna ${username} dibuat. Bagikan password-nya secara aman.`);
      }
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs text-dark-text-tertiary">Username</span>
          <input
            className={inputCls}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={50}
            pattern="[a-zA-Z0-9._\-]+"
            title="Huruf, angka, titik, garis bawah, atau strip"
            autoFocus
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-dark-text-tertiary">Email</span>
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-dark-text-tertiary">Role</span>
          <select
            className={inputCls}
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={isSelf}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          {isSelf && (
            <span className="text-xs text-dark-text-tertiary">Role akun sendiri tidak bisa diubah.</span>
          )}
        </label>
        {!isEdit && (
          <label className="block space-y-1">
            <span className="text-xs text-dark-text-tertiary">Password awal</span>
            <div className="flex gap-2">
              <input
                className={`${inputCls} font-mono`}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => {
                  setPassword(generatePassword());
                  setShowPassword(true);
                }}
                title="Buat password acak"
                className="px-3 rounded-lg border border-dark-border text-dark-text-secondary hover:text-white"
              >
                <HiOutlineArrowPath className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-dark-text-tertiary">
              Minimal 8 karakter, berisi huruf dan angka.
            </span>
          </label>
        )}
        <FormError message={error} />
        <ModalActions onCancel={onClose} submitLabel={isEdit ? 'Simpan' : 'Buat Pengguna'} busy={busy} />
      </form>
    </Modal>
  );
}

// ─── Reset password ──────────────────────────────────────────────────

function ResetPasswordModal({
  user,
  onClose,
  onSaved,
}: {
  user: ManagedUser;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [password, setPassword] = useState(generatePassword());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    setBusy(true);
    try {
      await userApi.resetPassword(user.id, password);
      onSaved(`Password ${user.username} direset. Semua sesinya sudah dikeluarkan.`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={`Reset Password — ${user.username}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs text-dark-text-tertiary">Password baru</span>
          <div className="flex gap-2">
            <input
              className={`${inputCls} font-mono`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              title="Buat password acak"
              className="px-3 rounded-lg border border-dark-border text-dark-text-secondary hover:text-white"
            >
              <HiOutlineArrowPath className="w-4 h-4" />
            </button>
          </div>
        </label>
        <p className="text-xs text-dark-text-tertiary">
          Pengguna akan dikeluarkan dari semua perangkat dan harus login dengan password baru ini.
        </p>
        <FormError message={error} />
        <ModalActions onCancel={onClose} submitLabel="Reset Password" busy={busy} />
      </form>
    </Modal>
  );
}

// ─── Confirm (deactivate / delete) ───────────────────────────────────

function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await onConfirm();
          } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
          }
        }}
      >
        <p className="text-sm text-dark-text-secondary">{message}</p>
        <FormError message={error} />
        <ModalActions onCancel={onClose} submitLabel={confirmLabel} busy={busy} danger={danger} />
      </form>
    </Modal>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; user: ManagedUser }
  | { kind: 'reset'; user: ManagedUser }
  | { kind: 'toggle'; user: ManagedUser }
  | { kind: 'delete'; user: ManagedUser }
  | null;

export default function UsersPage() {
  const { user: me, hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.USER_WRITE);
  const canDelete = hasPermission(PERMISSIONS.USER_DELETE);
  const isSuperAdmin = me?.role === ROLES.SUPER_ADMIN;

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<'active' | 'inactive' | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await userApi.list({ page, limit: pageSize, search: debounced, role, status });
      setUsers(res.data ?? []);
      setTotal(res.meta?.total ?? res.data?.length ?? 0);
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, debounced, role, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const done = useCallback(
    (message: string) => {
      setDialog(null);
      setNotice(message);
      void load();
    },
    [load],
  );

  const canManage = useCallback(
    (u: ManagedUser) => canWrite && (u.role !== ROLES.SUPER_ADMIN || isSuperAdmin),
    [canWrite, isSuperAdmin],
  );

  const pages = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">
            {loading ? 'Memuat…' : `${total} pengguna`}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setDialog({ kind: 'create' })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Tambah Pengguna
          </button>
        )}
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="status"
            className="text-sm text-success-300 bg-success-500/10 border border-success-500/20 rounded-lg px-4 py-2"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari username atau email…"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as Role | '');
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-sm text-white"
          aria-label="Filter role"
        >
          <option value="">Semua role</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as 'active' | 'inactive' | '');
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-sm text-white"
          aria-label="Filter status"
        >
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                {['Pengguna', 'Email', 'Role', 'Status', 'Login Terakhir', ''].map((h) => (
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
              {loadError && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-danger-400">
                    {loadError}{' '}
                    <button onClick={() => void load()} className="underline text-primary-400">
                      Coba lagi
                    </button>
                  </td>
                </tr>
              )}
              {!loadError && !loading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-dark-text-tertiary">
                    Tidak ada pengguna yang cocok.
                  </td>
                </tr>
              )}
              {users.map((u, i) => {
                const isSelf = u.id === me?.id;
                const manage = canManage(u);
                return (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-dark-surface-tertiary/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                          {u.username[0]}
                        </div>
                        <span className="text-sm text-white font-medium">
                          {u.username}
                          {isSelf && <span className="ml-2 text-xs text-dark-text-tertiary">(Anda)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-text-secondary">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleColors[u.role]}`}>
                        {ROLE_LABELS[u.role] ?? u.roleLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          u.isActive
                            ? 'bg-success-500/20 text-success-400'
                            : 'bg-warning-500/20 text-warning-400'
                        }`}
                      >
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-text-tertiary">{formatDate(u.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      {(manage || (isSelf && canWrite)) && (
                        <div className="flex justify-end gap-1">
                          <IconButton label="Edit" onClick={() => setDialog({ kind: 'edit', user: u })}>
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            label="Reset password"
                            onClick={() => setDialog({ kind: 'reset', user: u })}
                          >
                            <HiOutlineKey className="w-4 h-4" />
                          </IconButton>
                          {!isSelf && manage && (
                            <IconButton
                              label={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                              onClick={() => setDialog({ kind: 'toggle', user: u })}
                            >
                              {u.isActive ? (
                                <HiOutlineNoSymbol className="w-4 h-4" />
                              ) : (
                                <HiOutlineCheckCircle className="w-4 h-4" />
                              )}
                            </IconButton>
                          )}
                          {!isSelf && manage && canDelete && (
                            <IconButton
                              label="Hapus"
                              danger
                              onClick={() => setDialog({ kind: 'delete', user: u })}
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </IconButton>
                          )}
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
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
              disabled={page === 1}
              aria-label="Halaman sebelumnya"
              className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            {pages.map((p) => (
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
              aria-label="Halaman berikutnya"
              className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {dialog?.kind === 'create' && (
          <UserFormModal
            user={null}
            isSelf={false}
            canAssignSuperAdmin={isSuperAdmin}
            onClose={() => setDialog(null)}
            onSaved={done}
          />
        )}
        {dialog?.kind === 'edit' && (
          <UserFormModal
            user={dialog.user}
            isSelf={dialog.user.id === me?.id}
            canAssignSuperAdmin={isSuperAdmin}
            onClose={() => setDialog(null)}
            onSaved={done}
          />
        )}
        {dialog?.kind === 'reset' && (
          <ResetPasswordModal user={dialog.user} onClose={() => setDialog(null)} onSaved={done} />
        )}
        {dialog?.kind === 'toggle' && (
          <ConfirmModal
            title={dialog.user.isActive ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
            message={
              dialog.user.isActive
                ? `${dialog.user.username} tidak akan bisa login dan akan dikeluarkan dari semua perangkat.`
                : `${dialog.user.username} akan bisa login kembali.`
            }
            confirmLabel={dialog.user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            danger={dialog.user.isActive}
            onClose={() => setDialog(null)}
            onConfirm={async () => {
              await userApi.update(dialog.user.id, { isActive: !dialog.user.isActive });
              done(
                `${dialog.user.username} ${dialog.user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`,
              );
            }}
          />
        )}
        {dialog?.kind === 'delete' && (
          <ConfirmModal
            title="Hapus Pengguna"
            message={`Akun ${dialog.user.username} (${dialog.user.email}) akan dihapus dan tidak bisa login lagi. Riwayat audit-nya tetap disimpan.`}
            confirmLabel="Hapus"
            danger
            onClose={() => setDialog(null)}
            onConfirm={async () => {
              await userApi.remove(dialog.user.id);
              done(`${dialog.user.username} dihapus`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-1.5 rounded-lg transition-colors ${
        danger
          ? 'text-dark-text-tertiary hover:text-danger-400 hover:bg-danger-500/10'
          : 'text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary'
      }`}
    >
      {children}
    </button>
  );
}
