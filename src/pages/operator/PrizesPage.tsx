// ============================================================
// Prizes Page (Admin)
//
// Full CRUD management for prizes. All prizes are sourced from
// the Prize table via the backend API (no hardcoded data).
//   - Add prize
//   - Edit prize
//   - Delete prize
//   - Upload prize photo
//   - Set stock (quantity)
//   - Set probability
//   - Active / Inactive toggle
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePencil,
  HiOutlineTrash,
  HiXMark,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

import { prizeApi, type Prize } from '@/api/prize';
import { normalizeImageUrl } from '@/utils';

const tierColors: Record<string, string> = {
  grand: 'bg-warning-500/20 text-warning-400',
  gold: 'bg-warning-500/20 text-warning-400',
  silver: 'bg-dark-text-tertiary/20 text-dark-text-tertiary',
  bronze: 'bg-accent-500/20 text-accent-400',
  platinum: 'bg-secondary-500/20 text-secondary-400',
  diamond: 'bg-primary-500/20 text-primary-400',
  doorprize: 'bg-success-500/20 text-success-400',
};

const tierOptions = ['doorprize', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'grand'] as const;

interface PrizeFormState {
  name: string;
  description: string;
  value: string;
  quantity: string;
  probability: string;
  tier: (typeof tierOptions)[number];
  imageUrl: string;
  sponsor: string;
}

const emptyForm: PrizeFormState = {
  name: '',
  description: '',
  value: '0',
  quantity: '1',
  probability: '0',
  tier: 'bronze',
  imageUrl: '',
  sponsor: '',
};

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PrizeFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Prize | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await prizeApi.list({ page, limit: pageSize, search: search || undefined });
      setPrizes(res.data ?? []);
      setTotal(res.meta?.total ?? res.data?.length ?? 0);
    } catch (err: any) {
      setError(err?.message ?? 'Gagal memuat data hadiah');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await prizeApi.list({ page, limit: pageSize, search: search || undefined });
        if (!mounted) return;
        setPrizes(res.data ?? []);
        setTotal(res.meta?.total ?? res.data?.length ?? 0);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? 'Gagal memuat data hadiah');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (prize: Prize) => {
    setEditingId(prize.id);
    setForm({
      name: prize.name,
      description: prize.description ?? '',
      value: String(prize.value ?? 0),
      quantity: String(prize.quantity ?? 1),
      probability: String(prize.probability ?? 0),
      tier: (tierOptions as readonly string[]).includes(prize.tier)
        ? (prize.tier as (typeof tierOptions)[number])
        : 'bronze',
      imageUrl: prize.imageUrl ?? '',
      sponsor: prize.sponsor ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setError('');
      try {
        const payload = {
          name: form.name.trim(),
          description: form.description.trim(),
          value: Number(form.value) || 0,
          quantity: Math.max(1, Number(form.quantity) || 1),
          probability: Math.max(0, Number(form.probability) || 0),
          tier: form.tier,
          imageUrl: form.imageUrl.trim() || undefined,
          sponsor: form.sponsor.trim() || undefined,
        };
        if (editingId) {
          await prizeApi.update(editingId, payload);
        } else {
          await prizeApi.create(payload);
        }
        setModalOpen(false);
        load();
      } catch (err: any) {
        setError(err?.message ?? 'Gagal menyimpan hadiah');
      } finally {
        setSaving(false);
      }
    },
    [form, editingId, load],
  );

  const handleToggleActive = useCallback(async (prize: Prize) => {
    try {
      await prizeApi.update(prize.id, { isActive: !prize.isActive });
      setPrizes((prev) =>
        prev.map((p) => (p.id === prize.id ? { ...p, isActive: !p.isActive } : p)),
      );
    } catch (err: any) {
      setError(err?.message ?? 'Gagal mengubah status hadiah');
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await prizeApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      setError(err?.message ?? 'Gagal menghapus hadiah');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hadiah</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">{total} total hadiah</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm"
          >
            <HiOutlineArrowPath className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-400 transition-colors text-sm font-medium"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Tambah Hadiah
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari nama hadiah..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-500/20 border border-danger-500/30 text-danger-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Foto
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Nama
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Tier
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Stok
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Probability
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-dark-text-tertiary text-sm"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : prizes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-dark-text-tertiary text-sm"
                  >
                    Belum ada hadiah. Klik "Tambah Hadiah" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                prizes.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-dark-surface-tertiary/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {p.imageUrl ? (
                        <img
                          src={normalizeImageUrl(p.imageUrl)}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-dark-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-dark-surface-tertiary flex items-center justify-center text-dark-text-tertiary text-lg">
                          🎁
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white font-medium">{p.name}</p>
                      {p.sponsor && <p className="text-xs text-dark-text-tertiary">{p.sponsor}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${tierColors[p.tier] ?? 'bg-dark-text-tertiary/20 text-dark-text-tertiary'}`}
                      >
                        {p.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-text-secondary">
                      {p.remaining} / {p.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-text-secondary">{p.probability}%</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
                          p.isActive
                            ? 'bg-success-500/20 text-success-400 hover:bg-success-500/30'
                            : 'bg-danger-500/20 text-danger-400 hover:bg-danger-500/30'
                        }`}
                      >
                        {p.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-primary-400 hover:bg-dark-surface-tertiary transition-colors"
                          title="Edit"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-danger-400 hover:bg-dark-surface-tertiary transition-colors"
                          title="Hapus"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
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

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-dark-border bg-dark-surface-secondary p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  {editingId ? 'Edit Hadiah' : 'Tambah Hadiah'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary transition-colors"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Nama Hadiah <span className="text-danger-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Contoh: Samsung Galaxy S25"
                    className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Deskripsi
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Deskripsi hadiah"
                    className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                      Jumlah Stok <span className="text-danger-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                      Probability (%) <span className="text-danger-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={form.probability}
                      onChange={(e) => setForm({ ...form, probability: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                      Nilai
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                      Tier
                    </label>
                    <select
                      value={form.tier}
                      onChange={(e) =>
                        setForm({ ...form, tier: e.target.value as (typeof tierOptions)[number] })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white outline-none focus:border-primary-500/50 transition-colors text-sm"
                    >
                      {tierOptions.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Foto Hadiah (URL)
                  </label>
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://... atau data:image/..."
                    className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                    Sponsor
                  </label>
                  <input
                    type="text"
                    value={form.sponsor}
                    onChange={(e) => setForm({ ...form, sponsor: e.target.value })}
                    placeholder="Nama sponsor (opsional)"
                    className="w-full px-3 py-2 rounded-lg bg-dark-surface-tertiary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-dark-surface-tertiary text-dark-text-secondary hover:text-white transition-colors text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-400 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Hadiah'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-dark-border bg-dark-surface-secondary p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-white mb-2">Hapus Hadiah</h2>
              <p className="text-sm text-dark-text-secondary mb-6">
                Apakah Anda yakin ingin menghapus hadiah{' '}
                <span className="text-white font-medium">{deleteTarget.name}</span>? Tindakan ini
                tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-lg bg-dark-surface-tertiary text-dark-text-secondary hover:text-white transition-colors text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2 rounded-lg bg-danger-500 text-white hover:bg-danger-400 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
