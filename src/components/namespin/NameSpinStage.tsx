/**
 * NameSpinStage — the Spin Nama scene with Dual-Layer Wheel.
 *
 * Layout: header with event logo + label, LIVE badge and fullscreen button;
 * the dual-layer wheel (outer=names, inner=prizes) as the main visual focus;
 * winner card on the right with crown, prize, "Selamat kepada", winner name.
 * Used full-screen on the Monitor and as the preview on the operator page.
 *
 * Display modes:
 * - 'single': Original single wheel spin mode (name only)
 * - 'dual': NEW Dual-layer wheel - outer ring = participants, inner ring = prizes
 */

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineArrowPath,
  HiOutlineArrowsPointingIn,
  HiOutlineArrowsPointingOut,
  HiOutlineCalendarDays,
  HiOutlineShare,
  HiOutlineSpeakerWave,
  HiOutlineUsers,
  HiOutlineGift,
} from 'react-icons/hi2';
import { NameSpinWheel } from './NameSpinWheel';
import { useSpinSound } from './spinSound';
import { MonitorImage } from '@pages/monitor/MonitorImage';
import type { NameSpinResult } from '@api/nameSpin';
import type { MonitorTheme } from '@api/monitor';
import defaultLogo from '@assets/images/lucky-draw-logo.png';

interface Props {
  segments: string[];
  prizeSegments?: string[];
  totalNames: number;
  totalPrizes?: number;
  title?: string | null;
  prizeName?: string | null;
  prizeImageUrl?: string | null;
  spin?: NameSpinResult | null;
  theme?: Partial<MonitorTheme> | null;
  sound?: boolean;
  onSpinAgain?: () => void;
  spinDisabled?: boolean;
  variant?: 'screen' | 'embed';
  onRevealed?: (spinId: string) => void;
  displayMode?: 'single' | 'dual';
}

const CONFETTI_COLORS = [
  '#fbbf24', '#38bdf8', '#818cf8', '#a855f7',
  '#22d3ee', '#f59e0b', '#60a5fa', '#ec4899', '#10b981',
];

function seeded(i: number): number {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => {
        const x = seeded(i) * 100;
        const y = 12 + seeded(i + 100) * 80;
        return {
          id: i,
          left: x,
          top: y,
          w: 6 + seeded(i + 200) * 12,
          h: 3 + seeded(i + 300) * 6,
          rot: seeded(i + 400) * 360,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          delay: seeded(i + 500) * 8,
          dur: 6 + seeded(i + 600) * 8,
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
            opacity: 0.85,
            ['--r' as string]: `${p.rot}deg`,
            boxShadow: `0 0 10px ${p.color}aa`,
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
      <svg viewBox="0 0 200 70" className="absolute -top-3 w-[190%] max-w-none opacity-95">
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
        <path d="M30 62 Q100 40 170 62" stroke="url(#crown-arc)" strokeWidth="2" fill="none" />
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
        className="relative w-24 md:w-28"
        style={{
          filter: lit
            ? 'drop-shadow(0 0 24px rgba(251,191,36,1))'
            : 'drop-shadow(0 0 8px rgba(251,191,36,0.4))',
          opacity: lit ? 1 : 0.7,
        }}
      >
        <defs>
          <linearGradient id="crown-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="30%" stopColor="#fcd34d" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <path
          d="M4 22 L12 8 L20 18 L32 2 L44 18 L52 8 L60 22 L56 38 L8 38 Z"
          fill="url(#crown-gold)"
          stroke="#fcd34d"
          strokeWidth="1"
        />
        <circle cx="32" cy="14" r="4" fill="#fff" className={lit ? 'ns-twinkle' : ''} style={{ animationDelay: '0.1s' }} />
      </svg>
    </div>
  );
}

function GlowOrb({ delay, color, size }: { delay: number; color: string; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full blur-3xl"
      style={{
        width: size,
        height: size,
        background: color,
        opacity: 0.3,
      }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.2, 0.5, 0.2],
      }}
      transition={{
        duration: 4 + delay,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: delay,
      }}
    />
  );
}

function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        x: (i * 37) % 100,
        y: (i * 61) % 100,
        size: 2 + ((i * 17) % 5),
        duration: 4 + ((i * 13) % 9),
        delay: (i * 7) % 6,
        opacity: 0.03 + ((i * 11) % 8) / 100,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
          }}
          animate={{ y: [0, -30, 0], opacity: [p.opacity, p.opacity * 2, p.opacity] }}
          transition={{ repeat: Infinity, duration: p.duration, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export function NameSpinStage({
  segments,
  prizeSegments = [],
  title,
  prizeName,
  prizeImageUrl,
  spin,
  theme,
  sound = true,
  onSpinAgain,
  spinDisabled = false,
  variant = 'screen',
  onRevealed,
  displayMode = 'single',
}: Props) {
  const compact = variant === 'embed';
  const screen = variant === 'screen';
  const rootRef = useRef<HTMLDivElement>(null);
  const wheelSegments = useMemo(() => (segments.length > 0 ? segments : ['Nama 1', 'Nama 2', 'Nama 3']), [segments]);
  const wheelPrizeSegments = useMemo(() => (prizeSegments.length > 0 ? prizeSegments : ['Hadiah 1', 'Hadiah 2', 'Hadiah 3']), [prizeSegments]);
  const count = wheelSegments.length;
  const prizeCount = wheelPrizeSegments.length;
  const logo = theme?.logoUrl || defaultLogo;
  const label = title || 'SPIN NAMA';
  const shownTitle = displayMode === 'dual' ? 'SPIN NAMA & HADIAH' : label;
  const shownPrize = displayMode === 'dual' ? (spin?.prizeName || prizeName) : prizeName;
  const prizeImg = prizeImageUrl || (spin?.prizeImageUrl ?? null);

  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [pointerName, setPointerName] = useState<string | null>(null);
  const [pointerPrize, setPointerPrize] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const audio = useSpinSound({ enabled: sound });
  const spinning = !!spin && revealedId === null;
  const revealed = !!spin && spin.spinId === revealedId;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const share = () => {
    const text = displayMode === 'dual'
      ? `🎉 Selamat kepada ${spin?.winnerName} yang memenangkan ${spin?.prizeName}! 🎁`
      : `🎉 Selamat kepada ${spin?.winnerName}! 🎉`;
    navigator.clipboard?.writeText(text).then(() => {
      setShareNote('Teks hasil disalin ke papan klip!');
      setTimeout(() => setShareNote(null), 2500);
    });
  };

  const nameSize = (name: string) => {
    const len = name.length;
    if (len > 25) return 'text-2xl md:text-3xl';
    if (len > 18) return 'text-3xl md:text-4xl';
    if (len > 12) return 'text-4xl md:text-5xl';
    return 'text-5xl md:text-6xl';
  };

  const renderDualWheel = () => (
    <div className="relative shrink-0">
      <div
        className={compact ? 'w-[min(90vw,500px)]' : 'w-[min(70vh,50vw)]'}
        style={{ filter: 'drop-shadow(0 0 80px rgba(168,85,247,0.4)) drop-shadow(0 0 40px rgba(251,191,36,0.3))' }}
      >
        <NameSpinWheel
          segments={wheelSegments}
          prizeSegments={wheelPrizeSegments}
          spin={spin ?? null}
          highlight={revealed && spin ? spin.winnerSegment : null}
          prizeHighlight={revealed && spin && displayMode === 'dual' ? spin.prizeSegment ?? null : null}
          variant="dual"
          onTick={audio.tick}
          onPrizeTick={audio.tick}
          onPointerSegment={(i) => setPointerName(wheelSegments[i] ?? null)}
          onPrizePointerSegment={(i) => setPointerPrize(wheelPrizeSegments[i] ?? null)}
          onSpinEnd={(id) => {
            setRevealedId(id);
            audio.spinEnd();
            onRevealed?.(id);
          }}
        />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 w-4/5 h-10 rounded-full bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-amber-500/40 blur-2xl" />
    </div>
  );

  const renderSingleWheel = () => (
    <div className="relative shrink-0">
      <div
        className={compact ? 'w-[min(80vw,400px)]' : 'w-[min(55vh,38vw)]'}
        style={{ filter: 'drop-shadow(0 0 50px rgba(251,191,36,0.45))' }}
      >
        <NameSpinWheel
          segments={wheelSegments}
          spin={spin ?? null}
          highlight={revealed && spin ? spin.winnerSegment : null}
          variant="name"
          onTick={audio.tick}
          onPointerSegment={(i) => setPointerName(wheelSegments[i] ?? null)}
          onSpinEnd={(id) => {
            setRevealedId(id);
            audio.spinEnd();
            onRevealed?.(id);
          }}
        />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-3/4 h-6 rounded-full bg-amber-400/30 blur-xl" />
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={`ns-scene relative w-full h-full overflow-hidden text-white ${
        screen ? '' : 'rounded-2xl min-h-[650px]'
      }`}
      style={{
        fontFamily: 'Poppins, Inter, system-ui, sans-serif',
        background:
          'radial-gradient(ellipse 80% 90% at 25% 40%, rgba(30,58,138,0.45), transparent 70%),' +
          'radial-gradient(ellipse 60% 70% at 85% 15%, rgba(124,58,237,0.35), transparent 70%),' +
          'radial-gradient(ellipse 50% 60% at 15% 85%, rgba(6,182,212,0.25), transparent 70%),' +
          'radial-gradient(ellipse 40% 50% at 80% 80%, rgba(168,85,247,0.2), transparent 65%),' +
          'linear-gradient(180deg, #0c0a1e 0%, #0f172a 30%, #1e1b4b 60%, #0c0a1e 100%)',
      }}
    >
      <style>{`
        @keyframes ns-float { 0%,100% { transform: translateY(0) rotate(var(--r,0deg)); } 50% { transform: translateY(-20px) rotate(calc(var(--r,0deg) + 50deg)); } }
        .ns-confetti { animation-name: ns-float; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
        @keyframes ns-twinkle { 0%,100% { opacity: .4; transform: scale(.8); } 50% { opacity: 1; transform: scale(1.2); } }
        .ns-twinkle { animation: ns-twinkle 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes ns-shine { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes ns-pulse-glow { 0%,100% { box-shadow: 0 0 30px rgba(168,85,247,0.3); } 50% { box-shadow: 0 0 60px rgba(168,85,247,0.6); } }
        @keyframes ns-ring-pulse { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
      `}</style>

      <GlowOrb delay={0} color="rgba(30,58,138,0.5)" size={400} />
      <GlowOrb delay={1.5} color="rgba(124,58,237,0.4)" size={320} />
      <GlowOrb delay={3} color="rgba(6,182,212,0.35)" size={350} />
      <GlowOrb delay={4.5} color="rgba(168,85,247,0.3)" size={280} />

      <ParticleField />

      <svg
        className="pointer-events-none absolute bottom-0 left-0 w-full h-[28%]"
        viewBox="0 0 1440 280"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ns-wave" x1="0" x2="1">
            <stop offset="0" stopColor="#1e3a8a" stopOpacity="0.6" />
            <stop offset="0.5" stopColor="#7c3aed" stopOpacity="0.4" />
            <stop offset="1" stopColor="#06b6d4" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path d="M0 160 C350 80 600 260 900 170 C1150 110 1300 200 1440 140 V280 H0 Z" fill="url(#ns-wave)" />
        <path d="M0 220 C320 160 650 280 950 220 C1200 180 1350 240 1440 220 V280 H0 Z" fill="#0c0a1e" opacity="0.95" />
      </svg>
      <svg
        className="pointer-events-none absolute top-0 right-0 w-[55%] h-[35%]"
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M100 0 C280 80 550 40 800 120 V0 Z" fill="#1e3a8a" opacity="0.4" />
      </svg>

      <Confetti />

      <header
        className={`relative z-20 flex items-center justify-between ${
          compact ? 'px-4 pt-4' : 'px-8 xl:px-14 pt-6 xl:pt-10'
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={logo}
            alt="Logo event"
            className={`${compact ? 'h-10 max-w-[150px]' : 'h-14 xl:h-16 max-w-[240px]'} w-auto object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.6)]`}
          />
          <span className="h-10 w-px bg-white/25 shrink-0" />
          <span className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <HiOutlineCalendarDays className="w-5 h-5 text-blue-200" />
            </span>
            <span className="text-sm md:text-base font-bold tracking-[0.35em] uppercase text-white/85 truncate">
              {shownTitle}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {sound && audio.locked && (
            <button
              onClick={() => void audio.unlock()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 border border-amber-300/30 hover:from-amber-500/30 hover:to-orange-500/30 backdrop-blur-sm"
              title="Browser memblokir suara sampai layar diklik sekali"
            >
              <HiOutlineSpeakerWave className="w-5 h-5" />
              Aktifkan suara
            </button>
          )}
          <span className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500/15 to-green-500/15 text-emerald-300 text-sm font-bold tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.35)] backdrop-blur-sm">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
          <button
            onClick={toggleFullscreen}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 flex items-center justify-center text-white/85 hover:bg-white/20 transition-all backdrop-blur-sm"
            title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
          >
            {isFullscreen ? (
              <HiOutlineArrowsPointingIn className="w-6 h-6" />
            ) : (
              <HiOutlineArrowsPointingOut className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      <div
        className={`relative z-10 flex ${
          compact
            ? 'flex-col items-center gap-10 px-4 pb-6 pt-4'
            : 'flex-row items-center justify-center gap-[4vw] px-8 xl:px-14'
        }`}
        style={compact ? undefined : { height: 'calc(100% - 130px)' }}
      >
        {displayMode === 'dual' ? renderDualWheel() : renderSingleWheel()}

        <div className={`flex flex-col gap-8 ${compact ? 'w-full max-w-md' : 'w-[min(36vw,560px)]'}`}>
          <div
            className="relative rounded-[32px] border border-purple-300/30 px-8 pb-10 pt-14 text-center backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/2"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <Crown lit={revealed} />
            </div>

            {shownTitle && (
              <p className="text-[11px] md:text-xs font-bold tracking-[0.35em] uppercase text-white/50 mb-2 truncate">
                {shownTitle}
              </p>
            )}

            {prizeImg && (
              <div className="mx-auto mb-4 w-24 h-24 rounded-2xl overflow-hidden border border-amber-300/40 bg-gradient-to-br from-white/10 to-white/5 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                <MonitorImage
                  src={prizeImg}
                  alt={shownPrize ?? 'Hadiah'}
                  className="w-full h-full object-contain p-2"
                  displaySize={96}
                />
              </div>
            )}

            <p
              className={`font-extrabold text-white leading-tight break-words ${
                compact ? 'text-2xl' : 'text-3xl xl:text-5xl'
              }`}
            >
              {displayMode === 'dual' ? 'HASIL UNDIAN' : (shownPrize || (revealed ? 'PEMENANG' : 'SPIN NAMA'))}
            </p>

            <AnimatePresence mode="wait">
              {revealed && spin ? (
                <motion.div
                  key={`win-${spin.spinId}`}
                  initial={{ opacity: 0, scale: 0.7, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                >
                  <p className="mt-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 font-bold tracking-[0.45em] uppercase text-base md:text-lg">
                    {displayMode === 'dual' ? '🎉 PEMENANG & HADIAH 🎉' : '✨ SELAMAT KEPADA ✨'}
                  </p>
                  <p
                    className={`mt-2 font-black leading-[1.05] tracking-tight break-words ${nameSize(spin.winnerName)}`}
                    style={{
                      backgroundImage:
                        'linear-gradient(120deg,#fff9e6 0%,#fde68a 25%,#fbbf24 50%,#f59e0b 75%,#fde68a 100%)',
                      backgroundSize: '200% 100%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 6px 25px rgba(245,158,11,0.55))',
                      animation: 'ns-shine 3s linear infinite',
                    }}
                  >
                    {spin.winnerName}
                  </p>
                  {displayMode === 'dual' && spin.prizeName && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 backdrop-blur-sm"
                    >
                      <span className="text-3xl">🎁</span>
                      <p className="text-xl md:text-2xl font-bold text-amber-300">
                        {spin.prizeName}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={spin ? `spinning-${spin.spinId}` : 'idle'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="mt-4 text-white/70 font-bold tracking-[0.45em] uppercase text-base md:text-lg">
                    {spinning ? '🎯 MENGUNDI…' : count > 0 ? '🎯 SIAP DIUNDI' : '🎯 MENUNGGU DAFTAR NAMA'}
                  </p>
                  <p
                    className={`mt-2 font-black leading-[1.05] tracking-tight truncate text-white/35 ${
                      compact ? 'text-5xl' : 'text-7xl xl:text-8xl'
                    }`}
                  >
                    {spinning
                      ? displayMode === 'dual'
                        ? `${pointerName ?? '…'} + ${pointerPrize ?? '…'}`
                        : pointerName ?? '…'
                      : '?'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mx-auto mt-6 h-[4px] w-4/5 rounded-full bg-gradient-to-r from-transparent via-purple-400 via-amber-400 to-transparent shadow-[0_0_20px_rgba(168,85,247,0.6)]" />

            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-white/10 to-white/5 border border-white/15 text-sm text-white/85 backdrop-blur-sm">
                <HiOutlineUsers className="w-5 h-5 text-purple-300" />
                {count} peserta
              </span>
              {displayMode === 'dual' && prizeCount > 0 && (
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-400/25 text-sm text-amber-200 backdrop-blur-sm">
                  <HiOutlineGift className="w-5 h-5 text-amber-300" />
                  {prizeCount} unit hadiah
                </span>
              )}
            </div>
          </div>

          {onSpinAgain && (
            <div className="flex gap-4">
              <button
                onClick={onSpinAgain}
                disabled={spinDisabled}
                className="flex-1 flex items-center justify-center gap-3 rounded-full py-5 text-xl font-black text-[#1f1300] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:scale-[1.02] transition-all"
                style={{
                  background: 'linear-gradient(180deg,#fef3c7 0%,#fcd34d 35%,#f59e0b 70%,#d97706 100%)',
                  boxShadow: '0 15px 40px rgba(245,158,11,0.45), inset 0 2px 0 rgba(255,255,255,0.7)',
                }}
              >
                <HiOutlineArrowPath className="w-7 h-7" />
                PUTAR LAGI
              </button>
              {revealed && (
                <button
                  onClick={share}
                  className="w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-white/15 to-white/8 border border-white/20 text-white hover:bg-white/25 hover:scale-105 transition-all backdrop-blur-sm"
                  title="Bagikan hasil"
                >
                  <HiOutlineShare className="w-7 h-7" />
                </button>
              )}
            </div>
          )}

          {shareNote && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-base text-emerald-300 font-bold animate-pulse"
            >
              ✅ {shareNote}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}

export default NameSpinStage;