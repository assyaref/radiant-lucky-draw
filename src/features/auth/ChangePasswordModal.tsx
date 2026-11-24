/**
 * ChangePasswordModal — self-service password change for the logged-in user.
 * The server revokes all sessions afterwards, so the caller logs out.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineXMark } from 'react-icons/hi2';

import { userApi } from '@api/user';
import { ApiClientError } from '@api/client';

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm';

export function ChangePasswordModal({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: () => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) {
      return setError('Password baru minimal 8 karakter dan berisi huruf serta angka');
    }
    if (next !== confirm) return setError('Konfirmasi password tidak sama');
    setBusy(true);
    try {
      await userApi.changeOwnPassword(current, next);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiClientError || err instanceof Error ? err.message : 'Terjadi kesalahan');
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Ganti Password"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-sm rounded-xl border border-dark-border bg-dark-surface-secondary shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border">
          <h2 className="text-base font-semibold text-white">Ganti Password</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-xs text-dark-text-tertiary">Password lama</span>
            <input
              className={inputCls}
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-dark-text-tertiary">Password baru</span>
            <input
              className={inputCls}
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-dark-text-tertiary">Ulangi password baru</span>
            <input
              className={inputCls}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </label>
          <p className="text-xs text-dark-text-tertiary">
            Setelah diganti, Anda akan dikeluarkan dari semua perangkat dan perlu login ulang.
          </p>
          {error && (
            <p className="text-sm text-danger-400 bg-danger-500/10 border border-danger-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 disabled:opacity-50"
            >
              {busy ? 'Menyimpan…' : 'Ganti Password'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
