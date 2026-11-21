/**
 * NameSpinStage — the Spin Nama scene.
 *
 * Layout (like the event mock-up): header with the event logo + label, LIVE
 * badge and full-screen button; the gold-rimmed wheel on the left; the winner
 * card (crown, prize, "Selamat kepada", winner name, name count) on the right,
 * with "Putar Lagi" / "Bagikan" buttons when the operator is driving it.
 * Used full-screen on the Monitor and as the preview on the operator page.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineArrowPath,
  HiOutlineArrowsPointingIn,
  HiOutlineArrowsPointingOut,
  HiOutlineCalendarDays,
  HiOutlineShare,
  HiOutlineSpeakerWave,
  HiOutlineUsers,
} from 'react-icons/hi2';
import { NameSpinWheel } from './NameSpinWheel';
import { useSpinSound } from './spinSound';
import { MonitorImage } from '@pages/monitor/MonitorImage';
import { normalizeImageUrl } from '@/utils';
import type { NameSpinResult } from '@api/nameSpin';
import type { MonitorTheme } from '@api/monitor';
import defaultLogo from '@assets/images/lucky-draw-logo.png';

interface Props {
  /** Idle wheel (from the Monitor state or the operator's list). */
  segments: string[];
  totalNames: number;
  title?: string | null;
  prizeName?: string | null;
  prizeImageUrl?: string | null;
  /** Active/last spin; while set its segments are shown. */
  spin?: NameSpinResult | null;
  theme?: Partial<MonitorTheme> | null;
  /** Play sounds on this screen. */
  sound?: boolean;
  /** Shows the "Putar Lagi" button (operator). */
  onSpinAgain?: () => void;
  spinDisabled?: boolean;
  /** 'screen' fills a monitor; 'embed' fits inside a page. */
  variant?: 'screen' | 'embed';
  onRevealed?: (spinId: string) => void;
}

/* ── Decorations ─────────────────────────────────────────────────── */

const CONFETTI_COLORS = ['#fbbf24', '#38bdf8', '#818cf8', '#a855f7', '#22d3ee', '#f59e0b', '#60a5fa'];

function seeded(i: number): number {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => {
        // Keep them around the edges and between wheel and card, not over text.
        const x = seeded(i) * 100;
        const y = 12 + seeded(i + 100) * 80;
        return {
          id: i,
          left: x,
          top: y,
          w: 6 + seeded(i + 200) * 8,
          h: 3 + seeded(i + 300) * 4,
          rot: seeded(i + 400) * 360,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          delay: seeded(i + 500) * 6,
          dur: 5 + seeded(i + 600) * 6,
        };
      }),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-[2px] ns-confetti"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.w,
            height: p.h,
            background: p.color,
            opacity: 0.75,
            ['--r' as string]: `${p.rot}deg`,
            boxShadow: `0 0 6px ${p.color}66`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

function Crown({ lit }: { lit: boolean }) {
  return (
    <div className="relative flex items-end justify-center" aria-hidden="true">
      <svg viewBox="0 0 200 70" className="absolute -top-3 w-[190%] max-w-none opacity-90">
        {[
          [20, 40, 7],
          [42, 18, 5],
          [160, 20, 6],
          [182, 44, 5],
          [100, 4, 3],
        ].map(([x, y, s], i) => (
          <path
            key={i}
            d={`M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`}
            fill="#fde68a"
            className={lit ? 'ns-twinkle' : ''}
            style={{ animationDelay: `${i * 0.35}s` }}
          />
        ))}
        <path d="M30 62 Q100 40 170 62" stroke="url(#crown-arc)" strokeWidth="1.5" fill="none" />
        <defs>
          <linearGradient id="crown-arc" x1="0" x2="1">
            <stop offset="0" stopColor="#fbbf24" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fbbf24" />
            <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <svg
        viewBox="0 0 64 44"
        className="relative w-20 md:w-24"
        style={{
          filter: lit
            ? 'drop-shadow(0 0 14px rgba(251,191,36,0.9))'
            : 'drop-shadow(0 0 6px rgba(251,191,36,0.35))',
          opacity: lit ? 1 : 0.6,
        }}
      >
        <defs>
          <linearGradient id="crown-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3b0" />
            <stop offset="0.45" stopColor="#fbbf24" />
            <stop offset="1" stopColor="#c2410c" />
          </linearGradient>
        </defs>
        <path
          d="M6 14 L18 26 L32 6 L46 26 L58 14 L54 36 H10 Z"
          fill="url(#crown-gold)"
          stroke="#92400e"
          strokeWidth="1"
        />
        <rect x="9" y="36" width="46" height="6" rx="2" fill="url(#crown-gold)" />
        <circle cx="6" cy="13" r="3.5" fill="#fde68a" />
        <circle cx="32" cy="5" r="3.5" fill="#fde68a" />
        <circle cx="58" cy="13" r="3.5" fill="#fde68a" />
      </svg>
    </div>
  );
}

/* ── Scene ───────────────────────────────────────────────────────── */

export function NameSpinStage({
  segments,
  totalNames,
  title,
  prizeName,
  prizeImageUrl,
  spin,
  theme,
  sound = true,
  onSpinAgain,
  spinDisabled,
  variant = 'screen',
  onRevealed,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [pointerName, setPointerName] = useState<string | null>(null);
  const [compact, setCompact] = useState(variant === 'embed');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  const soundOn = sound && (theme?.soundEnabled ?? true);
  const audio = useSpinSound({
    enabled: soundOn,
    spinUrl: theme?.spinSoundUrl,
    winUrl: theme?.winSoundUrl,
  });

  // Layout follows the space we actually get, not the window.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCompact(el.clientWidth < 880));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => setLogoFailed(false), [theme?.logoUrl]);

  // A new spin hides the previous winner and starts the spin sound.
  useEffect(() => {
    if (!spin) return;
    if (spin.spinId !== revealedId) setRevealedId(null);
    const elapsed = spin.startedAt ? Date.now() - Date.parse(spin.startedAt) : 0;
    if (!(elapsed > spin.durationMs - 500)) audio.spinStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spin?.spinId]);

  const revealed = !!spin && revealedId === spin.spinId;
  const spinning = !!spin && !revealed;
  const wheelSegments = spin ? spin.segments : segments;
  const shownTitle = spin ? spin.title : title;
  const shownPrize = spin ? spin.prizeName : prizeName;
  const shownPrizeImg = spin ? spin.prizeImageUrl : prizeImageUrl;
  const prizeImg = shownPrizeImg ? normalizeImageUrl(shownPrizeImg) : null;
  const count = spin ? spin.totalNames : totalNames;
  const logo = theme?.logoUrl && !logoFailed ? theme.logoUrl : defaultLogo;
  const label = theme?.eventLabel?.trim() || 'Draw Event';
  const screen = variant === 'screen';

  const toggleFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => undefined);
  };

  const share = async () => {
    if (!spin || !revealed) return;
    const text = `🎉 Selamat kepada ${spin.winnerName}${spin.prizeName ? ` — pemenang ${spin.prizeName}` : ''}${
      spin.title ? ` (${spin.title})` : ''
    }!`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard?.writeText(text);
      setShareNote('Teks pemenang disalin');
    } catch {
      /* cancelled */
    }
    window.setTimeout(() => setShareNote(null), 2500);
  };

  const nameSize = (name: string) => {
    const l = name.length;
    if (compact) return l > 22 ? 'text-3xl' : l > 12 ? 'text-4xl' : 'text-5xl';
    return l > 22 ? 'text-5xl xl:text-6xl' : l > 12 ? 'text-6xl xl:text-7xl' : 'text-7xl xl:text-8xl';
  };

  return (
    <div
      ref={rootRef}
      className={`ns-scene relative w-full h-full overflow-hidden text-white ${
        screen ? '' : 'rounded-2xl min-h-[560px]'
      }`}
      style={{
        fontFamily: 'Poppins, Inter, system-ui, sans-serif',
        background:
          'radial-gradient(ellipse 60% 70% at 28% 55%, rgba(99,102,241,0.30), transparent 70%),' +
          'radial-gradient(ellipse 45% 40% at 88% 8%, rgba(59,130,246,0.28), transparent 70%),' +
          'radial-gradient(ellipse 50% 45% at 85% 95%, rgba(124,58,237,0.25), transparent 70%),' +
          'linear-gradient(160deg,#0c1446 0%,#080d33 45%,#0b1040 100%)',
      }}
    >
      <style>{`
        @keyframes ns-float { 0%,100% { transform: translateY(0) rotate(var(--r,0deg)); } 50% { transform: translateY(-14px) rotate(calc(var(--r,0deg) + 40deg)); } }
        .ns-confetti { animation-name: ns-float; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
        @keyframes ns-twinkle { 0%,100% { opacity: .35; transform: scale(.85); } 50% { opacity: 1; transform: scale(1.1); } }
        .ns-twinkle { animation: ns-twinkle 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes ns-shine { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
      `}</style>

      {/* Background waves */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 w-full h-[28%]"
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ns-wave" x1="0" x2="1">
            <stop offset="0" stopColor="#4338ca" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#6d28d9" stopOpacity="0.35" />
            <stop offset="1" stopColor="#1d4ed8" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path d="M0 190 C320 120 560 260 860 200 C1120 150 1280 210 1440 170 V300 H0 Z" fill="url(#ns-wave)" />
        <path d="M0 240 C300 200 620 290 940 250 C1180 220 1320 260 1440 240 V300 H0 Z" fill="#0b1040" opacity="0.85" />
      </svg>
      <svg
        className="pointer-events-none absolute top-0 right-0 w-[55%] h-[30%]"
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M120 0 C260 90 520 40 800 120 V0 Z" fill="#1e3a8a" opacity="0.28" />
      </svg>

      <Confetti />

      {/* Header */}
      <header
        className={`relative z-10 flex items-center justify-between ${
          compact ? 'px-4 pt-4' : 'px-8 xl:px-12 pt-6 xl:pt-8'
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={logo}
            alt="Logo event"
            onError={() => setLogoFailed(true)}
            className={`${compact ? 'h-9 max-w-[140px]' : 'h-12 xl:h-14 max-w-[220px]'} w-auto object-contain drop-shadow-[0_0_14px_rgba(139,92,246,0.45)]`}
          />
          <span className="h-8 w-px bg-white/20 shrink-0" />
          <span className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center shrink-0">
              <HiOutlineCalendarDays className="w-4 h-4 text-white/70" />
            </span>
            <span className="text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-white/70 truncate">
              {label}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {soundOn && audio.locked && (
            <button
              onClick={() => void audio.unlock()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-400/15 text-amber-200 border border-amber-300/30 hover:bg-amber-400/25"
              title="Browser memblokir suara sampai layar diklik sekali"
            >
              <HiOutlineSpeakerWave className="w-4 h-4" />
              Aktifkan suara
            </button>
          )}
          <span className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-sm font-bold tracking-wider shadow-[0_0_18px_rgba(16,185,129,0.25)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/15"
            title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
          >
            {isFullscreen ? (
              <HiOutlineArrowsPointingIn className="w-5 h-5" />
            ) : (
              <HiOutlineArrowsPointingOut className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Body */}
      <div
        className={`relative z-10 flex ${
          compact
            ? 'flex-col items-center gap-14 px-4 pb-6 pt-4'
            : 'flex-row items-center justify-center gap-[4vw] px-8 xl:px-12'
        }`}
        style={compact ? undefined : { height: 'calc(100% - 96px)' }}
      >
        {/* Wheel */}
        <div className="relative shrink-0">
          <div
            className={compact ? 'w-[min(86vw,440px)]' : 'w-[min(76vh,50vw)]'}
            style={{ filter: 'drop-shadow(0 0 50px rgba(99,102,241,0.35))' }}
          >
            <NameSpinWheel
              segments={wheelSegments}
              spin={spin ?? null}
              highlight={revealed && spin ? spin.winnerSegment : null}
              onTick={audio.tick}
              onPointerSegment={(i) => setPointerName(wheelSegments[i] ?? null)}
              onSpinEnd={(id) => {
                setRevealedId(id);
                audio.spinEnd();
                onRevealed?.(id);
              }}
            />
          </div>
          {/* Floor glow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-1/2 h-6 rounded-[50%] bg-amber-400/40 blur-xl" />
        </div>

        {/* Card + actions */}
        <div className={`flex flex-col gap-6 ${compact ? 'w-full max-w-md' : 'w-[min(36vw,540px)]'}`}>
          <div
            className="relative rounded-[28px] border border-indigo-300/25 px-6 pb-7 pt-12 text-center backdrop-blur-md"
            style={{
              background:
                'linear-gradient(180deg, rgba(79,70,229,0.22) 0%, rgba(30,27,75,0.55) 55%, rgba(15,23,72,0.65) 100%)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 40px rgba(99,102,241,0.18), 0 20px 60px rgba(2,6,23,0.55)',
            }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 -top-11 md:-top-14">
              <Crown lit={revealed} />
            </div>

            {shownTitle && (
              <p className="text-[11px] md:text-xs font-semibold tracking-[0.3em] uppercase text-white/45 mb-1 truncate">
                {shownTitle}
              </p>
            )}

            {prizeImg && (
              <div className="mx-auto mb-2 w-20 h-20 rounded-2xl overflow-hidden border border-amber-300/30 bg-white/[0.05]">
                <MonitorImage
                  src={prizeImg}
                  alt={shownPrize ?? 'Hadiah'}
                  className="w-full h-full object-contain p-1.5"
                  displaySize={80}
                />
              </div>
            )}

            <p
              className={`font-extrabold text-white leading-tight break-words ${
                compact ? 'text-2xl' : 'text-3xl xl:text-4xl'
              }`}
            >
              {shownPrize || (revealed ? 'Pemenang' : 'Spin Nama')}
            </p>

            <AnimatePresence mode="wait">
              {revealed && spin ? (
                <motion.div
                  key={`win-${spin.spinId}`}
                  initial={{ opacity: 0, scale: 0.8, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                >
                  <p className="mt-3 text-amber-300 font-bold tracking-[0.4em] uppercase text-sm md:text-base">
                    Selamat kepada
                  </p>
                  <p
                    className={`mt-1 font-black leading-[1.05] tracking-tight break-words ${nameSize(spin.winnerName)}`}
                    style={{
                      backgroundImage:
                        'linear-gradient(100deg,#fff7c2 0%,#fcd34d 30%,#f59e0b 55%,#fde68a 75%,#fbbf24 100%)',
                      backgroundSize: '200% 100%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 4px 18px rgba(245,158,11,0.45))',
                      animation: 'ns-shine 4s linear infinite',
                    }}
                  >
                    {spin.winnerName}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={spin ? `spinning-${spin.spinId}` : 'idle'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="mt-3 text-amber-300/80 font-bold tracking-[0.4em] uppercase text-sm md:text-base">
                    {spinning ? 'Mengundi…' : count > 0 ? 'Siap diundi' : 'Menunggu daftar nama'}
                  </p>
                  <p
                    className={`mt-1 font-black leading-[1.05] tracking-tight truncate text-white/30 ${
                      compact ? 'text-4xl' : 'text-6xl xl:text-7xl'
                    }`}
                  >
                    {spinning ? (pointerName ?? '…') : '?'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mx-auto mt-4 h-[3px] w-4/5 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_14px_rgba(251,191,36,0.8)]" />

            <span className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-sm text-white/75">
              <HiOutlineUsers className="w-4 h-4" />
              {count} nama
            </span>
          </div>

          {onSpinAgain && (
            <div className="flex gap-4">
              <button
                onClick={onSpinAgain}
                disabled={spinDisabled}
                className="flex-1 flex items-center justify-center gap-3 rounded-full py-4 text-lg font-bold text-[#1f1300] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition"
                style={{
                  background: 'linear-gradient(180deg,#fde68a 0%,#fbbf24 45%,#f59e0b 100%)',
                  boxShadow: '0 10px 30px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.6)',
                }}
              >
                <HiOutlineArrowPath className={`w-6 h-6 ${spinning ? 'animate-spin' : ''}`} />
                {spinning ? 'Mengundi…' : spin ? 'Putar Lagi' : 'Putar'}
              </button>
              <button
                onClick={() => void share()}
                disabled={!revealed}
                className="flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white border border-amber-300/40 bg-indigo-950/60 hover:bg-indigo-900/70 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <HiOutlineShare className="w-5 h-5" />
                Bagikan
              </button>
            </div>
          )}
          {shareNote && <p className="text-center text-xs text-emerald-300">{shareNote}</p>}
        </div>
      </div>
    </div>
  );
}

export default NameSpinStage;
