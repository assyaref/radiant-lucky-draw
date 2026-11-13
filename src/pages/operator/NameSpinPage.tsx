// ============================================================
// Spin Nama — undian cepat dari daftar nama yang diinput operator.
// Pemenang dipilih server lalu ditayangkan juga di layar Monitor.
// Hasil TIDAK disimpan ke database (tanpa catatan pemenang / stok).
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HiOutlineSparkles, HiOutlineTrash, HiOutlineClipboard } from 'react-icons/hi2';

import { nameSpinApi, cleanNames, type NameSpinResult } from '@api/nameSpin';
import { prizeApi, type Prize } from '@api/prize';
import { ApiClientError } from '@api/client';
import { NameSpinReel } from '@components/namespin/NameSpinReel';

const STORAGE_KEY = 'radiant:namespin:v1';

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
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { text: '', removeWinner: true, title: '', history: [], ...JSON.parse(raw) };
  } catch {
    /* storage unavailable */
  }
  return { text: '', removeWinner: true, title: '', history: [] };
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

export default function NameSpinPage() {
  const initial = useMemo(load, []);
  const [text, setText] = useState(initial.text);
  const [removeWinner, setRemoveWinner] = useState(initial.removeWinner);
  const [title, setTitle] = useState(initial.title);
  const [history, setHistory] = useState<HistoryItem[]>(initial.history);

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizeChoice, setPrizeChoice] = useState<string>(''); // '' none | 'custom' | prize id
  const [customPrize, setCustomPrize] = useState('');

  const [spin, setSpin] = useState<NameSpinResult | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const names = useMemo(() => cleanNames(text), [text]);
  const rawCount = useMemo(() => text.split(/\r?\n|;|\t/).filter((l) => l.trim()).length, [text]);

  useEffect(() => {
    save({ text, removeWinner, title, history });
  }, [text, removeWinner, title, history]);

  useEffect(() => {
    prizeApi
      .list({ page: 1, limit: 100 })
      .then((r) => setPrizes(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPrizes([]));
  }, []);

  const doSpin = async () => {
    setError(null);
    if (names.length < 2) return setError('Masukkan minimal 2 nama yang berbeda');
    setSpinning(true);
    try {
      const res = await nameSpinApi.spin({
        names,
        prizeId: prizeChoice && prizeChoice !== 'custom' ? prizeChoice : undefined,
        prizeName: prizeChoice === 'custom' ? customPrize.trim() || undefined : undefined,
        title: title.trim() || undefined,
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
  }, [spin, removeWinner]);

  const copyHistory = () => {
    const lines = history
      .slice()
      .reverse()
      .map((h, i) => `${i + 1}. ${h.winnerName}${h.prizeName ? ` — ${h.prizeName}` : ''}`);
    void navigator.clipboard?.writeText(lines.join('\n'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Spin Nama</h1>
        <p className="text-sm text-dark-text-tertiary mt-1">
          Undian cepat dari daftar nama. Animasi tampil juga di layar Monitor. Hasil tidak disimpan
          sebagai pemenang dan tidak mengurangi stok hadiah.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* ── Input ── */}
        <div className="space-y-4 rounded-xl border border-dark-border bg-dark-surface-secondary p-5">
          <label className="block space-y-1">
            <span className="flex justify-between text-xs text-dark-text-tertiary">
              <span>Daftar nama (satu per baris)</span>
              <span>
                {names.length} nama
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
              Bisa tempel langsung dari kolom Excel / Google Sheets.
            </span>
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-dark-text-tertiary">Judul (opsional)</span>
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
            <span className="text-xs text-dark-text-tertiary">Hadiah</span>
            <select
              className={inputCls}
              value={prizeChoice}
              onChange={(e) => setPrizeChoice(e.target.value)}
              disabled={spinning}
            >
              <option value="">— Tanpa hadiah —</option>
              {prizes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="custom">Ketik nama hadiah…</option>
            </select>
          </label>
          {prizeChoice === 'custom' && (
            <input
              className={inputCls}
              value={customPrize}
              onChange={(e) => setCustomPrize(e.target.value)}
              placeholder="Nama hadiah"
              maxLength={200}
              disabled={spinning}
            />
          )}

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
            disabled={spinning || names.length < 2}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-black disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
          >
            <HiOutlineSparkles className="w-5 h-5" />
            {spinning ? 'Mengundi…' : 'SPIN'}
          </button>
        </div>

        {/* ── Stage + history ── */}
        <div className="space-y-6">
          <div className="rounded-xl border border-dark-border bg-[#020617] p-6 min-h-[420px] flex items-center justify-center">
            {spin ? (
              <NameSpinReel
                key={spin.spinId}
                spinId={spin.spinId}
                reel={spin.reel}
                winnerName={spin.winnerName}
                durationMs={spin.durationMs}
                prizeName={spin.prizeName}
                prizeImageUrl={spin.prizeImageUrl}
                title={spin.title}
                totalNames={spin.totalNames}
                size="md"
                onRevealed={onRevealed}
              />
            ) : (
              <p className="text-dark-text-tertiary text-sm text-center">
                Masukkan nama-nama lalu tekan <b>SPIN</b>.
                <br />
                Buka <span className="font-mono">/monitor</span> di layar TV untuk menayangkannya.
              </p>
            )}
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
