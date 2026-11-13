/**
 * ThemeSettings — per-event look & sound of the Spin Nama screen:
 * logo (upload or link), event label, spin sound and win sound (upload or
 * link, with a test button), and a switch for sound on the Monitor.
 * Every change is saved to the Monitor state right away, so all screens update.
 */

import { useRef, useState } from 'react';
import {
  HiOutlineArrowUpTray,
  HiOutlineLink,
  HiOutlinePhoto,
  HiOutlinePlay,
  HiOutlineArrowUturnLeft,
  HiOutlineMusicalNote,
} from 'react-icons/hi2';
import { monitorApi, type MonitorTheme } from '@api/monitor';
import { previewDefault, previewSound } from './spinSound';
import defaultLogo from '@assets/images/lucky-draw-logo.png';

interface Props {
  theme: MonitorTheme;
  onChange: (theme: MonitorTheme) => void;
}

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-dark-surface border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm';
const btnCls =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-dark-border text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

const LIMITS = {
  logo: { bytes: 2 * 1024 * 1024, accept: 'image/png,image/jpeg,image/webp,image/gif', label: 'maks 2 MB' },
  sound: {
    bytes: 5 * 1024 * 1024,
    accept: 'audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/mp4,audio/x-m4a,audio/aac,.mp3,.wav,.ogg,.m4a,.aac',
    label: 'maks 5 MB',
  },
};

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Gagal membaca file'));
    r.readAsDataURL(file);
  });
}

function fileLabel(url: string | null): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname.split('/').pop() || u.host);
  } catch {
    return url;
  }
}

type Field = 'logoUrl' | 'spinSoundUrl' | 'winSoundUrl';

function patchOf(field: Field, value: string | null): Partial<MonitorTheme> {
  const p: Partial<MonitorTheme> = {};
  p[field] = value;
  return p;
}

export function ThemeSettings({ theme, onChange }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<Field, string>>({
    logoUrl: '',
    spinSoundUrl: '',
    winSoundUrl: '',
  });
  const [openLink, setOpenLink] = useState<Field | null>(null);
  const [label, setLabel] = useState(theme.eventLabel ?? '');
  const fileRefs = useRef<Record<Field, HTMLInputElement | null>>({
    logoUrl: null,
    spinSoundUrl: null,
    winSoundUrl: null,
  });

  const save = async (patch: Partial<MonitorTheme>, what: string) => {
    setBusy(what);
    setError(null);
    try {
      const r = await monitorApi.update({ theme: patch });
      onChange({ ...theme, ...(r.data.theme ?? patch) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setBusy(null);
    }
  };

  const upload = async (field: Field, file: File) => {
    const kind = field === 'logoUrl' ? 'logo' : 'sound';
    const lim = LIMITS[kind];
    if (file.size > lim.bytes) {
      setError(`File terlalu besar (${lim.label})`);
      return;
    }
    setBusy(field);
    setError(null);
    try {
      const dataUrl = await readAsDataUrl(file);
      const up = await monitorApi.uploadAsset(kind, dataUrl, file.name);
      const patch = patchOf(field, up.data.url);
      const r = await monitorApi.update({ theme: patch });
      onChange({ ...theme, ...(r.data.theme ?? patch) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload gagal');
    } finally {
      setBusy(null);
    }
  };

  const applyLink = async (field: Field) => {
    const url = links[field].trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setError('Link harus diawali http:// atau https://');
      return;
    }
    await save(patchOf(field, url), field);
    setLinks((l) => ({ ...l, [field]: '' }));
    setOpenLink(null);
  };

  const sourceButtons = (field: Field) => {
    const kind = field === 'logoUrl' ? 'logo' : 'sound';
    return (
      <div className="flex flex-wrap gap-2">
        <button
          className={btnCls}
          disabled={!!busy}
          onClick={() => fileRefs.current[field]?.click()}
        >
          <HiOutlineArrowUpTray className="w-4 h-4" />
          {busy === field ? 'Mengunggah…' : 'Upload'}
        </button>
        <input
          ref={(el) => {
            fileRefs.current[field] = el;
          }}
          type="file"
          accept={LIMITS[kind].accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void upload(field, f);
          }}
        />
        <button
          className={btnCls}
          disabled={!!busy}
          onClick={() => setOpenLink(openLink === field ? null : field)}
        >
          <HiOutlineLink className="w-4 h-4" />
          Sisipkan link
        </button>
        {theme[field] && (
          <button
            className={btnCls}
            disabled={!!busy}
            onClick={() => void save(patchOf(field, null), field)}
            title="Kembali ke bawaan"
          >
            <HiOutlineArrowUturnLeft className="w-4 h-4" />
            Bawaan
          </button>
        )}
      </div>
    );
  };

  const linkInput = (field: Field, placeholder: string) =>
    openLink === field && (
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={links[field]}
          onChange={(e) => setLinks((l) => ({ ...l, [field]: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && void applyLink(field)}
          placeholder={placeholder}
          autoFocus
        />
        <button
          className="px-3 rounded-lg bg-primary-500/20 text-primary-300 text-sm hover:bg-primary-500/30 disabled:opacity-40"
          disabled={!links[field].trim() || !!busy}
          onClick={() => void applyLink(field)}
        >
          Pakai
        </button>
      </div>
    );

  const soundRow = (field: 'spinSoundUrl' | 'winSoundUrl', title: string, def: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-white flex items-center gap-1.5">
            <HiOutlineMusicalNote className="w-4 h-4 text-amber-300" />
            {title}
          </p>
          <p className="text-xs text-dark-text-tertiary truncate" title={theme[field] ?? ''}>
            {theme[field] ? fileLabel(theme[field]) : def}
          </p>
        </div>
        <button
          className={btnCls}
          onClick={() => {
            const url = theme[field];
            if (url) previewSound(url);
            else void previewDefault(field === 'spinSoundUrl' ? 'spin' : 'win');
          }}
        >
          <HiOutlinePlay className="w-4 h-4" />
          Tes
        </button>
      </div>
      {sourceButtons(field)}
      {linkInput(field, 'https://…/suara.mp3')}
    </div>
  );

  return (
    <div className="space-y-5 rounded-xl border border-dark-border bg-dark-surface-secondary p-5">
      <div>
        <h2 className="text-sm font-semibold text-white">Tampilan & suara layar Spin</h2>
        <p className="text-xs text-dark-text-tertiary mt-0.5">
          Disimpan langsung dan dipakai di semua layar Monitor. Ganti per event.
        </p>
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <p className="text-sm text-white flex items-center gap-1.5">
          <HiOutlinePhoto className="w-4 h-4 text-primary-400" />
          Logo kiri atas
        </p>
        <div className="flex items-center gap-3">
          <div className="h-16 w-40 rounded-lg border border-dark-border bg-[#0b1040] flex items-center justify-center p-2">
            <img
              src={theme.logoUrl || defaultLogo}
              alt="Logo"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                if (e.currentTarget.dataset.fallback) return;
                e.currentTarget.dataset.fallback = '1';
                e.currentTarget.src = defaultLogo;
                setError('Logo dari link tidak bisa dimuat, cek kembali link-nya');
              }}
            />
          </div>
          <p className="text-xs text-dark-text-tertiary">
            {theme.logoUrl ? fileLabel(theme.logoUrl) : 'Logo bawaan'}
            <br />
            PNG/JPG/WEBP/GIF, latar transparan paling bagus.
          </p>
        </div>
        {sourceButtons('logoUrl')}
        {linkInput('logoUrl', 'https://…/logo.png')}
      </div>

      {/* Label */}
      <label className="block space-y-1">
        <span className="text-xs text-dark-text-tertiary">Tulisan di samping logo</span>
        <div className="flex gap-2">
          <input
            className={inputCls}
            value={label}
            maxLength={60}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void save({ eventLabel: label }, 'label')}
            onBlur={() => {
              if ((theme.eventLabel ?? '') !== label.trim()) void save({ eventLabel: label }, 'label');
            }}
            placeholder="DRAW EVENT"
          />
        </div>
      </label>

      <div className="h-px bg-dark-border" />

      {soundRow('spinSoundUrl', 'Suara saat berputar', 'Bawaan: bunyi "tik" tiap nama lewat')}
      {soundRow('winSoundUrl', 'Suara saat menang', 'Bawaan: fanfare kemenangan')}

      <label className="flex items-center gap-2 text-sm text-dark-text-secondary">
        <input
          type="checkbox"
          checked={theme.soundEnabled}
          disabled={!!busy}
          onChange={(e) => void save({ soundEnabled: e.target.checked }, 'sound')}
          className="accent-primary-500"
        />
        Bunyikan suara di layar Monitor
      </label>

      {error && (
        <p className="text-sm text-danger-400 bg-danger-500/10 border border-danger-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

export default ThemeSettings;
