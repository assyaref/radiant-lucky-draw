// ============================================================
// Spin — Dual-Layer Wheel (Nama Peserta + Hadiah)
// Operator page with tabbed config for Participants & Prizes
// Real-time sync to Monitor, stock management, winner history
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineSparkles,
  HiOutlineTrash,
  HiOutlineClipboard,
  HiOutlineTv,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineUsers,
  HiOutlineGift,
} from 'react-icons/hi2';

import { nameSpinApi, cleanNames, type NameSpinResult, type DisplayMode } from '@api/nameSpin';
import { prizeApi, type Prize, type CreatePrizePayload, type UpdatePrizePayload } from '@api/prize';
import { ApiClientError } from '@api/client';
import { NameSpinStage } from '@components/namespin/NameSpinStage';
import { type PrizeSegment } from '@components/namespin/NameSpinWheel';
import {
  monitorApi,
  sampleForWheel,
  DEFAULT_THEME,
  type MonitorMode,
  type MonitorTheme,
} from '@api/monitor';
import { ThemeSettings } from '@components/namespin/ThemeSettings';

const STORAGE_KEY = 'radiant:namespin:v2';

interface HistoryItem {
  spinId: string;
  winnerName: string;
  prizeName: string | null;
  title: string | null;
  at: string;
}

interface Saved {
  text: string;
  removeWinner: boolean;
  title: string;
  history: HistoryItem[];
  localSound: boolean;
  displayMode: DisplayMode;
  // Prize config is now managed via Prize API, not localStorage
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return {
        text: '',
        removeWinner: true,
        title: '',
        history: [],
        localSound: false,
        displayMode: 'single' as DisplayMode,
        ...JSON.parse(raw),
      };
    }
  } catch {
    /* storage unavailable */
  }
  return { text: '', removeWinner: true, title: '', history: [], localSound: false, displayMode: 'single' as DisplayMode };
}

function save(v: Saved): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
}

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm';

interface PrizeFormData {
  name: string;
  description: string;
  value: number;
  currency: string;
  quantity: number;
  imageUrl: string;
  sponsor: string;
  tier: 'doorprize' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'grand';
  probability: number;
  isActive: boolean;
}

const DEFAULT_PRIZE_FORM: PrizeFormData = {
  name: '',
  description: '',
  value: 0,
  currency: 'IDR',
  quantity: 1,
  imageUrl: '',
  sponsor: '',
  tier: 'doorprize',
  probability: 10,
  isActive: true,
};

export default function NameSpinPage() {
  const initial = useMemo(load, []);
  const [text, setText] = useState(initial.text);
  const [removeWinner, setRemoveWinner] = useState(initial.removeWinner);
  const [title, setTitle] = useState(initial.title);
  const [history, setHistory] = useState<HistoryItem[]>(initial.history);
  const [localSound, setLocalSound] = useState(initial.localSound);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(initial.displayMode);
  const [theme, setTheme] = useState<MonitorTheme>(DEFAULT_THEME);

  // Prize management state
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [activeTab, setActiveTab] = useState<'participants' | 'prizes'>('participants');
  const [prizeForm, setPrizeForm] = useState<PrizeFormData>(DEFAULT_PRIZE_FORM);
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);
  const [prizeError, setPrizeError] = useState<string | null>(null);
  const [showPrizeForm, setShowPrizeForm] = useState(false);

  // Spin state
  const [spin, setSpin] = useState<NameSpinResult | null>(null);
  const [monitorMode, setMonitorMode] = useState<MonitorMode | null>(null);
  const [modeBusy, setModeBusy] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const names = useMemo(() => cleanNames(text), [text]);
  const rawCount = useMemo(() => text.split(/\r?\n|;|\t/).filter((l) => l.trim()).length, [text]);

  const idleSegments = useMemo(() => sampleForWheel(names), [names]);
  const idlePrizeSegments = useMemo(() => {
    const segments: PrizeSegment[] = [];
    prizes.forEach((p) => {
      const units = Math.min(p.remaining, 60);
      for (let i = 0; i < units; i++) {
        segments.push({
          id: `${p.id}:${i}`,
          name: p.name,
          icon: TIER_ICONS[p.tier] ?? '🎁',
        });
      }
    });
    return sampleForWheel(segments);
  }, [prizes]);

  // Persist UI preferences
  useEffect(() => {
    save({ text, removeWinner, title, history, localSound, displayMode });
  }, [text, removeWinner, title, history, localSound, displayMode]);

  // Load prizes on mount
  useEffect(() => {
    prizeApi
      .list({ page: 1, limit: 100 })
      .then((r) => setPrizes(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPrizes([]));
  }, []);

  // Current Monitor mode
  useEffect(() => {
    monitorApi
      .get()
      .then((r) => {
        setMonitorMode(r.data.mode);
        setTheme({ ...DEFAULT_THEME, ...(r.data.theme ?? {}) });
      })
      .catch(() => setMonitorMode(null));
  }, []);

  const wheelPayload = useCallback(
    () => ({
      names,
      totalNames: names.length,
      title: title.trim() || null,
      prizeSegments:
        displayMode === 'dual' ? idlePrizeSegments.map((segment) => segment.name) : undefined,
      totalPrizes:
        displayMode === 'dual' ? prizes.reduce((sum, p) => sum + p.remaining, 0) : undefined,
      displayMode,
    }),
    [names, title, displayMode, idlePrizeSegments, prizes],
  );

  // Sync wheel to Monitor when in namespin mode
  useEffect(() => {
    if (monitorMode !== 'namespin' || spinning) return;
    const t = setTimeout(() => {
      monitorApi
        .update({ wheel: wheelPayload() })
        .then(() => setSyncNote(`Monitor diperbarui ${new Date().toLocaleTimeString('id-ID')}`))
        .catch(() => setSyncNote('Gagal memperbarui Monitor'));
    }, 800);
    return () => clearTimeout(t);
  }, [monitorMode, spinning, wheelPayload]);

  const switchMonitor = async (mode: MonitorMode) => {
    setModeBusy(true);
    setError(null);
    try {
      const r = await monitorApi.update(
        mode === 'namespin' ? { mode, wheel: wheelPayload() } : { mode },
      );
      setMonitorMode(r.data.mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengganti tampilan Monitor');
    } finally {
      setModeBusy(false);
    }
  };

  // Show spin + winner for duration + hold, then back to idle wheel
  useEffect(() => {
    if (!spin) return;
    const t = setTimeout(() => setSpin(null), spin.durationMs + spin.revealHoldMs);
    return () => clearTimeout(t);
  }, [spin]);

  const doSpin = async () => {
    if (spinning) return;
    setError(null);
    if (names.length < 2) return setError('Masukkan minimal 2 nama yang berbeda');

    if (displayMode === 'dual') {
      const totalStock = prizes.reduce((sum, p) => sum + p.remaining, 0);
      if (totalStock < 1) return setError('Tidak ada stok hadiah tersisa untuk mode dual');
    }

    setSpinning(true);
    try {
      const res = await nameSpinApi.spin({
        names,
        title: title.trim() || undefined,
        displayMode,
        randomPrize: true,
      });
      setSpin(res.data);
    } catch (err) {
      setError(err instanceof ApiClientError || err instanceof Error ? err.message : 'Spin gagal');
      setSpinning(false);
    }
  };

  const onRevealed = useCallback(() => {
    setSpinning(false);
    if (!spin) return;
    const current = spin;
    setHistory((h) =>
      h.some((x) => x.spinId === current.spinId)
        ? h
        : [
            {
              spinId: current.spinId,
              winnerName: current.winnerName,
              prizeName: current.prizeName,
              title: current.title,
              at: new Date().toISOString(),
            },
            ...h,
          ].slice(0, 200),
    );
    if (removeWinner) {
      const key = current.winnerName.toLocaleLowerCase('id-ID');
      setText((t) =>
        t
          .split(/\r?\n/)
          .filter((line) => line.replace(/\s+/g, ' ').trim().toLocaleLowerCase('id-ID') !== key)
          .join('\n'),
      );
    }
    // Refresh prizes after spin to get updated stock
    prizeApi
      .list({ page: 1, limit: 100 })
      .then((r) => setPrizes(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, [spin, removeWinner]);

  const copyHistory = () => {
    const lines = history
      .slice()
      .reverse()
      .map((h, i) => `${i + 1}. ${h.winnerName}${h.prizeName ? ` — ${h.prizeName}` : ''}`);
    void navigator.clipboard?.writeText(lines.join('\n'));
  };

  const openMonitor = () => {
    const monitorUrl = `${window.location.origin}/monitor`;
    const monitorWindow = window.open(
      monitorUrl,
      'RadiantMonitor',
      'width=1920,height=1080,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,scrollbars=no',
    );
    if (monitorWindow) {
      monitorWindow.focus();
    }
  };

  // Prize management functions
  const handlePrizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrizeError(null);
    try {
      if (editingPrizeId) {
        const payload: UpdatePrizePayload = {
          name: prizeForm.name,
          description: prizeForm.description,
          value: prizeForm.value,
          currency: prizeForm.currency,
          quantity: prizeForm.quantity,
          imageUrl: prizeForm.imageUrl || undefined,
          sponsor: prizeForm.sponsor || undefined,
          tier: prizeForm.tier,
          probability: prizeForm.probability,
          isActive: prizeForm.isActive,
        };
        await prizeApi.update(editingPrizeId, payload);
      } else {
        const payload: CreatePrizePayload = {
          name: prizeForm.name,
          description: prizeForm.description,
          value: prizeForm.value,
          currency: prizeForm.currency,
          quantity: prizeForm.quantity,
          imageUrl: prizeForm.imageUrl || undefined,
          sponsor: prizeForm.sponsor || undefined,
          tier: prizeForm.tier,
          probability: prizeForm.probability,
        };
        await prizeApi.create(payload);
      }
      setShowPrizeForm(false);
      setEditingPrizeId(null);
      setPrizeForm(DEFAULT_PRIZE_FORM);
      // Refresh list
      const r = await prizeApi.list({ page: 1, limit: 100 });
      setPrizes(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      setPrizeError(err instanceof Error ? err.message : 'Gagal menyimpan hadiah');
    }
  };

  const handleEditPrize = (prize: Prize) => {
    setEditingPrizeId(prize.id);
    setPrizeForm({
      name: prize.name,
      description: prize.description ?? '',
      value: prize.value,
      currency: prize.currency,
      quantity: prize.quantity,
      imageUrl: prize.imageUrl ?? '',
      sponsor: prize.sponsor ?? '',
      tier: prize.tier as PrizeFormData['tier'],
      probability: prize.probability,
      isActive: prize.isActive,
    });
    setShowPrizeForm(true);
  };

  const handleDeletePrize = async (id: string) => {
    if (!window.confirm('Hapus hadiah ini? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      await prizeApi.remove(id);
      setPrizes((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setPrizeError(err instanceof Error ? err.message : 'Gagal menghapus hadiah');
    }
  };

  const handleNewPrize = () => {
    setEditingPrizeId(null);
    setPrizeForm(DEFAULT_PRIZE_FORM);
    setShowPrizeForm(true);
  };

  const cancelPrizeForm = () => {
    setShowPrizeForm(false);
    setEditingPrizeId(null);
    setPrizeForm(DEFAULT_PRIZE_FORM);
    setPrizeError(null);
  };

  const TIER_LABELS: Record<string, string> = {
    grand: 'Grand Prize',
    diamond: 'Diamond',
    platinum: 'Platinum',
    gold: 'Gold',
    silver: 'Silver',
    bronze: 'Bronze',
    doorprize: 'Doorprize',
  };

  const TIER_COLORS: Record<string, string> = {
    grand: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    diamond: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    platinum: 'bg-gradient-to-r from-slate-400 to-slate-600',
    gold: 'bg-gradient-to-r from-amber-400 to-yellow-400',
    silver: 'bg-gradient-to-r from-gray-300 to-gray-500',
    bronze: 'bg-gradient-to-r from-orange-500 to-amber-700',
    doorprize: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  };

  const TIER_ICONS: Record<string, string> = {
    grand: '🏆',
    diamond: '💎',
    platinum: '🥈',
    gold: '🥇',
    silver: '🥉',
    bronze: '🎖️',
    doorprize: '🎁',
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Spin</h1>
        <p className="text-sm text-dark-text-tertiary mt-1">
          Dual-Layer Wheel: Outer ring = Nama Peserta, Inner ring = Hadiah (per unit stok).
          Keduanya berputar bersamaan. Pemenang & hadiah terpilih otomatis, stok berkurang, riwayat tersimpan.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dark-border bg-dark-surface-secondary px-4 py-3">
        <HiOutlineTv className="w-5 h-5 text-dark-text-tertiary" />
        <span className="text-sm text-dark-text-secondary">Tampilan Monitor:</span>
        <div className="inline-flex rounded-lg border border-dark-border p-0.5">
          {(
            [
              ['event', 'Event (Lucky Draw Booth)'],
              ['namespin', 'Spin (Dual-Layer Wheel)'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => void switchMonitor(mode)}
              disabled={modeBusy || monitorMode === mode}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                monitorMode === mode
                  ? 'bg-primary-500/20 text-primary-300'
                  : 'text-dark-text-tertiary hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={openMonitor}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-primary-500/10 text-primary-300 hover:bg-primary-500/20 transition-colors border border-primary-500/20"
        >
          <HiOutlineTv className="w-4 h-4" />
          Open Monitor
        </button>
        <span className="text-xs text-dark-text-tertiary">
          {monitorMode === 'namespin'
            ? (syncNote ?? 'Daftar nama & hadiah di bawah tampil sebagai Dual-Layer Wheel di Monitor.')
            : 'Saat SPIN ditekan, Dual-Layer Wheel muncul sebagai layar penuh di Monitor.'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* ── Left Panel: Config ── */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="rounded-xl border border-dark-border bg-dark-surface-secondary p-1">
            <div className="flex" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'participants'}
                onClick={() => setActiveTab('participants')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'participants'
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-sm'
                    : 'text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary'
                }`}
              >
                <HiOutlineUsers className="w-5 h-5" />
                Peserta
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-500/20 text-primary-400">
                  {names.length}
                </span>
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'prizes'}
                onClick={() => setActiveTab('prizes')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'prizes'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary'
                }`}
              >
                <HiOutlineGift className="w-5 h-5" />
                Hadiah
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400">
                  {prizes.reduce((sum, p) => sum + p.remaining, 0)} unit
                </span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-4 rounded-xl border border-dark-border bg-dark-surface-secondary p-5">
            {activeTab === 'participants' && (
              <div className="space-y-4">
                <label className="block space-y-1">
                  <span className="flex justify-between text-xs text-dark-text-tertiary">
                    <span>Daftar nama peserta (satu per baris)</span>
                    <span>
                      {names.length} nama aktif
                      {rawCount > names.length ? ` · ${rawCount - names.length} duplikat diabaikan` : ''}
                    </span>
                  </span>
                  <textarea
                    className={`${inputCls} h-64 font-mono leading-relaxed`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={'Budi Santoso\nSiti Aminah\nAndi Wijaya\n…'}
                    disabled={spinning}
                  />
                  <span className="text-xs text-dark-text-tertiary">
                    Bisa tempel langsung dari kolom Excel / Google Sheets. Duplikat (case-insensitive) diabaikan otomatis.
                  </span>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-dark-text-tertiary">Judul undian (opsional)</span>
                  <input
                    className={inputCls}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="mis. Doorprize Sesi 1"
                    maxLength={120}
                    disabled={spinning}
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-dark-text-tertiary">Mode Tampilan Roda</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-dark-text-secondary cursor-pointer">
                      <input
                        type="radio"
                        name="displayMode"
                        checked={displayMode === 'single'}
                        onChange={() => setDisplayMode('single')}
                        className="accent-primary-500"
                        disabled={spinning}
                      />
                      Roda Tunggal (Spin Nama Saja)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-dark-text-secondary cursor-pointer">
                      <input
                        type="radio"
                        name="displayMode"
                        checked={displayMode === 'dual'}
                        onChange={() => setDisplayMode('dual')}
                        className="accent-primary-500"
                        disabled={spinning}
                      />
                      Dual-Layer Wheel (Spin Nama + Hadiah Bersamaan)
                    </label>
                  </div>
                </label>

                <label className="flex items-center gap-2 text-sm text-dark-text-secondary">
                  <input
                    type="checkbox"
                    checked={removeWinner}
                    onChange={(e) => setRemoveWinner(e.target.checked)}
                    className="accent-primary-500"
                  />
                  Keluarkan nama pemenang dari daftar setelah spin
                </label>

                {error && (
                  <p className="text-sm text-danger-400 bg-danger-500/10 border border-danger-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  onClick={() => void doSpin()}
                  disabled={spinning || names.length < 2 || (displayMode === 'dual' && prizes.reduce((s, p) => s + p.remaining, 0) < 1)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-lg font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-black disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition shadow-lg shadow-amber-500/30"
                >
                  <HiOutlineSparkles className="w-6 h-6" />
                  {spinning ? 'Mengundi…' : 'SPIN'}
                </button>
              </div>
            )}

            {activeTab === 'prizes' && (
              <div className="space-y-4">
                {/* Prize Form */}
                {showPrizeForm && (
                  <motion.form
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handlePrizeSubmit}
                    className="space-y-4 p-4 rounded-xl bg-dark-surface border border-primary-500/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {editingPrizeId ? 'Edit Hadiah' : 'Tambah Hadiah Baru'}
                      </h3>
                      <button
                        type="button"
                        onClick={cancelPrizeForm}
                        className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary"
                      >
                        <HiOutlineXMark className="w-5 h-5" />
                      </button>
                    </div>

                    {prizeError && (
                      <p className="text-sm text-danger-400 bg-danger-500/10 border border-danger-500/20 rounded-lg px-3 py-2">
                        {prizeError}
                      </p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-1">
                        <span className="text-xs text-dark-text-tertiary">Nama Hadiah *</span>
                        <input
                          className={inputCls}
                          value={prizeForm.name}
                          onChange={(e) => setPrizeForm({ ...prizeForm, name: e.target.value })}
                          placeholder="mis. Tumbler Premium"
                          required
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs text-dark-text-tertiary">Tier *</span>
                        <select
                          className={inputCls}
                          value={prizeForm.tier}
                          onChange={(e) => setPrizeForm({ ...prizeForm, tier: e.target.value as PrizeFormData['tier'] })}
                        >
                          <option value="grand">Grand Prize</option>
                          <option value="diamond">Diamond</option>
                          <option value="platinum">Platinum</option>
                          <option value="gold">Gold</option>
                          <option value="silver">Silver</option>
                          <option value="bronze">Bronze</option>
                          <option value="doorprize">Doorprize</option>
                        </select>
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs text-dark-text-tertiary">Stok (Quantity) *</span>
                        <input
                          type="number"
                          min="1"
                          className={inputCls}
                          value={prizeForm.quantity}
                          onChange={(e) => setPrizeForm({ ...prizeForm, quantity: parseInt(e.target.value) || 1 })}
                          required
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs text-dark-text-tertiary">Probabilitas (%)</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className={inputCls}
                          value={prizeForm.probability}
                          onChange={(e) => setPrizeForm({ ...prizeForm, probability: parseInt(e.target.value) || 10 })}
                        />
                      </label>
                      <label className="block space-y-1 sm:col-span-2">
                        <span className="text-xs text-dark-text-tertiary">Deskripsi</span>
                        <textarea
                          className={`${inputCls} h-20`}
                          value={prizeForm.description}
                          onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })}
                          placeholder="Deskripsi singkat hadiah..."
                        />
                      </label>
                      <label className="block space-y-1 sm:col-span-2">
                        <span className="text-xs text-dark-text-tertiary">URL Gambar (opsional)</span>
                        <input
                          className={inputCls}
                          value={prizeForm.imageUrl}
                          onChange={(e) => setPrizeForm({ ...prizeForm, imageUrl: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs text-dark-text-tertiary">Nilai</span>
                        <input
                          type="number"
                          min="0"
                          className={inputCls}
                          value={prizeForm.value}
                          onChange={(e) => setPrizeForm({ ...prizeForm, value: parseInt(e.target.value) || 0 })}
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs text-dark-text-tertiary">Mata Uang</span>
                        <input
                          className={inputCls}
                          value={prizeForm.currency}
                          onChange={(e) => setPrizeForm({ ...prizeForm, currency: e.target.value.toUpperCase() })}
                          maxLength={3}
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs text-dark-text-tertiary">Sponsor (opsional)</span>
                        <input
                          className={inputCls}
                          value={prizeForm.sponsor}
                          onChange={(e) => setPrizeForm({ ...prizeForm, sponsor: e.target.value })}
                          placeholder="Nama sponsor"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-dark-text-secondary sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={prizeForm.isActive}
                          onChange={(e) => setPrizeForm({ ...prizeForm, isActive: e.target.checked })}
                          className="accent-primary-500"
                        />
                        Aktif (masuk ke undian)
                      </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:brightness-110 transition"
                      >
                        <HiOutlineCheck className="w-5 h-5" />
                        {editingPrizeId ? 'Simpan Perubahan' : 'Tambah Hadiah'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelPrizeForm}
                        className="px-4 py-3 rounded-xl text-base font-medium text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary transition border border-dark-border"
                      >
                        Batal
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Add Prize Button (when form hidden) */}
                {!showPrizeForm && (
                  <button
                    onClick={handleNewPrize}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 hover:from-amber-500/30 hover:to-orange-500/30 transition border border-amber-500/30"
                  >
                    <HiOutlinePlus className="w-5 h-5" />
                    Tambah Hadiah Baru
                  </button>
                )}

                {/* Prize List */}
                <div className="rounded-xl border border-dark-border bg-dark-surface overflow-hidden">
                  <div className="px-4 py-3 border-b border-dark-border">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <HiOutlineGift className="w-4 h-4 text-amber-400" />
                      Daftar Hadiah ({prizes.length} item, {prizes.reduce((s, p) => s + p.remaining, 0)} unit stok)
                    </h3>
                  </div>
                  {prizes.length === 0 ? (
                    <div className="p-8 text-center text-dark-text-tertiary">
                      <HiOutlineGift className="w-12 h-12 mx-auto mb-2 text-dark-text-tertiary/30" />
                      <p>Belum ada hadiah. Klik "Tambah Hadiah Baru" untuk memulai.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-dark-border/50 max-h-[400px] overflow-y-auto">
                      {prizes.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-dark-surface-tertiary/50 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <HiOutlineGift className="w-6 h-6 text-white/30" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium truncate">{p.name}</p>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white ${TIER_COLORS[p.tier] ?? 'bg-gray-500'}`}
                              >
                                {TIER_LABELS[p.tier] ?? p.tier}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-dark-text-tertiary">
                              <span>Stok: <span className="text-white font-mono">{p.remaining}</span> / {p.quantity}</span>
                              <span>Prob: {p.probability}%</span>
                              {p.sponsor && <span>Sponsor: {p.sponsor}</span>}
                              {p.value > 0 && <span>Nilai: {formatCurrency(p.value, p.currency)}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditPrize(p)}
                              className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-primary-400 hover:bg-primary-500/10 transition"
                              title="Edit"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePrize(p.id)}
                              className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-danger-400 hover:bg-danger-500/10 transition"
                              title="Hapus"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <ThemeSettings theme={theme} onChange={setTheme} />
        </div>

        {/* ── Right Panel: Stage + History ── */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-dark-text-tertiary">Pratinjau — sama dengan layar Monitor</span>
              <label className="flex items-center gap-2 text-xs text-dark-text-secondary">
                <input
                  type="checkbox"
                  checked={localSound}
                  onChange={(e) => setLocalSound(e.target.checked)}
                  className="accent-primary-500"
                />
                Suara di perangkat ini
              </label>
            </div>
            <div className="rounded-2xl border border-dark-border overflow-hidden">
              <NameSpinStage
                segments={idleSegments}
                prizeSegments={idlePrizeSegments}
                totalNames={names.length}
                totalPrizes={prizes.reduce((s, p) => s + p.remaining, 0)}
                title={title.trim() || null}
                displayMode={displayMode}
                spin={spin}
                theme={theme}
                sound={localSound}
                variant="embed"
                onSpinAgain={() => void doSpin()}
                spinDisabled={spinning || names.length < 2 || (displayMode === 'dual' && prizes.reduce((s, p) => s + p.remaining, 0) < 1)}
                onRevealed={onRevealed}
              />
            </div>
          </div>

          <div className="rounded-xl border border-dark-border bg-dark-surface-secondary">
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
              <h2 className="text-sm font-semibold text-white">
                Riwayat spin <span className="text-dark-text-tertiary font-normal">(perangkat ini)</span>
              </h2>
              {history.length > 0 && (
                <div className="flex gap-1">
                  <button
                    onClick={copyHistory}
                    title="Salin daftar pemenang"
                    className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-white hover:bg-dark-surface-tertiary"
                  >
                    <HiOutlineClipboard className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setHistory([])}
                    title="Hapus riwayat"
                    className="p-1.5 rounded-lg text-dark-text-tertiary hover:text-danger-400 hover:bg-danger-500/10"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {history.length === 0 ? (
              <p className="px-4 py-6 text-sm text-dark-text-tertiary text-center">Belum ada spin.</p>
            ) : (
              <ol className="divide-y divide-dark-border/50 max-h-72 overflow-y-auto">
                {history.map((h, i) => (
                  <li key={h.spinId} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="w-6 text-dark-text-tertiary font-mono">{history.length - i}</span>
                    <span className="flex-1 text-white font-medium truncate">{h.winnerName}</span>
                    <span className="text-amber-300/80 truncate max-w-[40%]">
                      {h.prizeName ?? h.title ?? ''}
                    </span>
                    <span className="text-dark-text-tertiary text-xs">
                      {new Date(h.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}