/**
 * MonitorPage — Fullscreen 16:9 Premium Event Display
 * Radiant Group Lucky Draw Digital Booth
 * 1920×1080 target · Real-time synchronized via Socket.IO
 * State: IDLE → COUNTDOWN → SPINNING → REVEALED → COMPLETED → IDLE
 */
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket, useSocketEvent } from '@services/socket';
import { SOCKET_EVENTS } from '@services/socket';
import type { SocketEventName } from '@services/socket';
import { env } from '@config/env';
import { normalizeImageUrl } from '@/utils';

type DrawState = 'IDLE' | 'COUNTDOWN' | 'SPINNING' | 'REVEALED' | 'COMPLETED';
interface DrawData {
  state: DrawState;
  drawId: string | null;
  participantId: string | null;
  participantName: string | null;
  participantCompany: string | null;
  participantPhotoUrl: string | null;
  prizeId: string | null;
  prizeName: string | null;
  prizeTier: string | null;
  prizeImageUrl: string | null;
  remainingStock: number | null;
  startedAt: string | null;
}

const TIER: Record<string, { bg: string; text: string; glow: string }> = {
  grand: {
    bg: 'from-amber-500/20 to-yellow-500/10',
    text: 'text-amber-200',
    glow: 'rgba(251,191,36,0.35)',
  },
  gold: {
    bg: 'from-amber-500/20 to-amber-600/10',
    text: 'text-amber-300',
    glow: 'rgba(245,158,11,0.3)',
  },
  silver: {
    bg: 'from-slate-300/20 to-slate-400/10',
    text: 'text-slate-200',
    glow: 'rgba(148,163,184,0.25)',
  },
  bronze: {
    bg: 'from-orange-500/20 to-amber-700/10',
    text: 'text-orange-300',
    glow: 'rgba(251,146,60,0.25)',
  },
  doorprize: {
    bg: 'from-blue-500/20 to-cyan-500/10',
    text: 'text-blue-200',
    glow: 'rgba(96,165,250,0.25)',
  },
};
function tier(t: string | null | undefined) {
  return TIER[t?.toLowerCase() ?? ''] ?? TIER.bronze;
}

// ─── Animated Background Particles ──────────────────────────────────────

function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
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

// ─── IDLE Screen ─────────────────────────────────────────────────────────

function IdleScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.12, 0.25, 0.12] }}
        transition={{ repeat: Infinity, duration: 4 }}
      >
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.18)_0%,rgba(139,92,246,0.08)_35%,transparent_65%)]" />
      </motion.div>
      <motion.div
        className="z-10 flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
      >
        {/* Brand */}
        <div className="text-center">
          <p className="text-white/20 text-lg md:text-xl font-light tracking-[0.35em] uppercase">
            RADIANT GROUP
          </p>
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mt-2"
            style={{
              backgroundImage: 'linear-gradient(135deg,#3b82f6,#8b5cf6,#f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            LUCKY DRAW
          </h1>
          <p className="text-white/30 text-xl md:text-2xl font-light tracking-wider mt-1">
            DIGITAL BOOTH
          </p>
        </div>
        {/* CTA */}
        <motion.div
          className="rounded-full border border-primary-400/20 bg-primary-400/[0.04] px-12 py-5"
          animate={{
            scale: [1, 1.015, 1],
            borderColor: ['rgba(96,165,250,0.2)', 'rgba(139,92,246,0.3)', 'rgba(96,165,250,0.2)'],
          }}
          transition={{ repeat: Infinity, duration: 4 }}
        >
          <p className="text-white/60 text-2xl md:text-3xl font-light tracking-wider">
            SIAP UNTUK MENANG?
          </p>
        </motion.div>
        {/* Pulsing dots */}
        <div className="flex gap-4 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400"
              animate={{ opacity: [0.15, 1, 0.15], scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.5 }}
            />
          ))}
        </div>
        {/* Event tagline */}
        <p className="text-white/15 text-sm md:text-base font-light tracking-widest uppercase mt-4">
          🎰 LUCKY DRAW DIGITAL BOOTH
        </p>
      </motion.div>
    </div>
  );
}

// ─── COUNTDOWN Screen ────────────────────────────────────────────────────

function CountdownScreen({ count, showGo }: { count: number; showGo: boolean }) {
  const c = count > 0 ? count : 0;
  const color = c === 1 ? '#ef4444' : c === 2 ? '#f59e0b' : c === 3 ? '#3b82f6' : '#8b5cf6';
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.15, 0.45, 0.15] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
      >
        <div
          className="h-full w-full blur-3xl"
          style={{
            background: `radial-gradient(ellipse at center, ${color}44 0%, transparent 65%)`,
          }}
        />
      </motion.div>
      <AnimatePresence mode="wait">
        {showGo ? (
          <motion.div
            key="go"
            className="z-10 flex flex-col items-center"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 10 }}
          >
            <p
              className="text-[8rem] md:text-[11rem] lg:text-[14rem] font-black leading-none"
              style={{
                backgroundImage: 'linear-gradient(135deg, #f59e0b, #fbbf24, #fcd34d)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              GO!
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={c}
            className="z-10 flex flex-col items-center"
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <p
              className="text-[10rem] md:text-[14rem] lg:text-[18rem] font-black leading-none"
              style={{
                backgroundImage: `linear-gradient(135deg, ${color}, #fbbf24)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {c}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.p
        className="z-10 mt-6 text-xl md:text-2xl font-bold tracking-[0.3em] uppercase text-white/25"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {showGo ? "LET'S DRAW!" : 'GET READY'}
      </motion.p>
    </div>
  );
}

// ─── SPINNING Screen ──────────────────────────────────────────────────────

const SAMPLE_NAMES = [
  'SYARIF',
  'RUI',
  'BUDI',
  'SITI',
  'AHMAD',
  'DEWI',
  'RUDI',
  'FITRI',
  'HENDRA',
  'RATNA',
];

function SpinningScreen({ participantName }: { participantName?: string | null }) {
  const [nameIdx, setNameIdx] = useState(0);
  const [converge, setConverge] = useState(false);
  const [converged, setConverged] = useState(false);

  useEffect(() => {
    const slow = setTimeout(() => setConverge(true), 2000);
    const iv = setInterval(
      () => {
        if (converged) return;
        setNameIdx((i) => (i + 1) % SAMPLE_NAMES.length);
      },
      converge ? 200 : 80,
    );
    return () => {
      clearInterval(iv);
      clearTimeout(slow);
    };
  }, [converge, converged]);

  // Lock to server-authoritative participant name after ~3.5s
  useEffect(() => {
    if (!participantName) return;
    const lock = setTimeout(() => {
      setConverged(true);
    }, 3500);
    return () => clearTimeout(lock);
  }, [participantName]);

  const displayName = converged && participantName ? participantName : SAMPLE_NAMES[nameIdx];
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.2, 0.55, 0.2] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.3)_0%,rgba(59,130,246,0.15)_35%,transparent_65%)]" />
      </motion.div>
      {/* Rotating orb */}
      <motion.div
        className="relative z-10 mb-8"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
      >
        <div className="w-56 h-56 md:w-72 md:h-72 rounded-full bg-gradient-to-br from-primary-500/15 via-secondary-500/25 to-warning-400/15 border-2 border-white/10" />
        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-primary-400/10 to-secondary-400/10 border border-white/5" />
        <div className="absolute inset-16 rounded-full bg-gradient-to-br from-warning-400/15 to-primary-400/10" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                background: i % 2 === 0 ? '#60a5fa' : '#c084fc',
                boxShadow: `0 0 16px ${i % 2 === 0 ? '#60a5fa' : '#c084fc'}`,
                width: 14,
                height: 14,
                left: '50%',
                top: '50%',
                marginLeft: -7,
                marginTop: -7,
              }}
              animate={{ x: Math.cos(a) * 140, y: Math.sin(a) * 140 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />
          );
        })}
      </motion.div>
      {/* Scanning line */}
      <motion.div
        className="absolute left-[15%] right-[15%] h-0.5 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-sm z-10"
        animate={{ top: ['25%', '75%', '25%'] }}
        transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
      />
      {/* Name cycling */}
      <motion.div
        key={nameIdx}
        className="z-10 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.08 }}
      >
        <p className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white/80">
          {displayName}
        </p>
      </motion.div>
      <motion.p
        className="z-10 text-xl md:text-2xl font-bold tracking-[0.25em] text-white/40 uppercase"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
      >
        MEMUTAR UNDIAN
      </motion.p>
    </div>
  );
}

// ─── Gold Confetti (lightweight CSS) ──────────────────────────────────────

function GoldConfetti({ active }: { active: boolean }) {
  const flakes = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: (i * 37 + 11) % 100,
        delay: (i * 0.18) % 3,
        duration: 2.5 + ((i * 13) % 7) * 0.6,
        size: 6 + ((i * 17) % 10),
        rotation: (i * 73) % 360,
        drift: ((i % 2) * 2 - 1) * (20 + ((i * 23) % 40)),
        shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'rect' : 'diamond',
        color:
          i % 5 === 0
            ? '#fbbf24'
            : i % 5 === 1
              ? '#f59e0b'
              : i % 5 === 2
                ? '#fcd34d'
                : i % 5 === 3
                  ? '#eab308'
                  : '#fef3c7',
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20" aria-hidden>
      {active &&
        flakes.map((f) => (
          <motion.div
            key={f.id}
            className="absolute"
            style={{
              left: `${f.x}%`,
              width: f.size,
              height: f.shape === 'rect' ? f.size * 0.6 : f.size,
              borderRadius: f.shape === 'circle' ? '50%' : f.shape === 'diamond' ? '1px' : '1px',
              background: f.color,
              rotate: f.rotation,
              opacity: 0,
              top: '-5%',
            }}
            initial={{ y: '-10%', opacity: 0, rotate: f.rotation }}
            animate={{
              y: '110vh',
              x: f.drift,
              opacity: [0, 0.9, 0.9, 0.6, 0],
              rotate: f.rotation + 360,
            }}
            transition={{
              duration: f.duration,
              delay: f.delay,
              ease: 'easeIn',
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          />
        ))}
    </div>
  );
}

// ─── Progress Timeline ───────────────────────────────────────────────────

function ProgressTimeline({ state }: { state: DrawState }) {
  const steps: { key: DrawState; label: string; icon: string }[] = [
    { key: 'COUNTDOWN', label: 'COUNTDOWN', icon: '⏱' },
    { key: 'SPINNING', label: 'SPINNING', icon: '🎰' },
    { key: 'REVEALED', label: 'REVEAL', icon: '✨' },
    { key: 'COMPLETED', label: 'COMPLETED', icon: '🏆' },
  ];
  const order: DrawState[] = ['IDLE', 'COUNTDOWN', 'SPINNING', 'REVEALED', 'COMPLETED'];
  const currentIdx = order.indexOf(state);
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => {
        const stepIdx = order.indexOf(s.key);
        const isActive = stepIdx <= currentIdx && currentIdx >= order.indexOf('COUNTDOWN');
        const isCurrent = s.key === state;
        return (
          <div key={s.key} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-8 h-0.5 rounded-full transition-colors duration-500 ${isActive ? 'bg-amber-400/60 shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'bg-white/10'}`}
              />
            )}
            <motion.div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors duration-500 ${
                isActive
                  ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
                  : 'bg-transparent text-white/15 border border-white/5'
              } ${isCurrent ? 'shadow-[0_0_12px_rgba(251,191,36,0.3)]' : ''}`}
              animate={isCurrent ? { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] } : {}}
              transition={isCurrent ? { repeat: Infinity, duration: 2 } : {}}
            >
              <span>{isActive ? '✓' : s.icon}</span>
              <span>{s.label}</span>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tier Badge ──────────────────────────────────────────────────────────

function TierBadge({ prizeTier }: { prizeTier: string | null }) {
  if (!prizeTier) return null;
  const t = tier(prizeTier);
  return (
    <motion.span
      className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-black tracking-widest border ${t.text} bg-gradient-to-r ${t.bg} border-current/20`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
      {prizeTier.toUpperCase()}
    </motion.span>
  );
}

// ─── WINNER Screen (PREMIUM REDESIGN) ────────────────────────────────────

function WinnerReveal({ data, done }: { data: DrawData; done: boolean }) {
  const t = tier(data.prizeTier);
  const photoUrl = normalizeImageUrl(data.participantPhotoUrl);
  const prizeUrl = normalizeImageUrl(data.prizeImageUrl);
  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-6 md:px-10">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <div
          className="h-full w-full blur-3xl"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 40%, rgba(234,179,8,0.18) 0%, rgba(251,191,36,0.08) 30%, ${t.glow} 50%, transparent 70%)`,
          }}
        />
      </motion.div>
      <GoldConfetti active />
      <div className="z-10 flex flex-col items-center max-w-4xl w-full gap-5">
        {/* HEADER */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h1
            className="text-[clamp(2.5rem,7vw,5.5rem)] font-black leading-none tracking-tight"
            style={{
              backgroundImage: 'linear-gradient(180deg, #fef3c7 0%, #f59e0b 40%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🎉 SELAMAT! 🎉
          </h1>
          <motion.p
            className="text-[clamp(0.75rem,1.5vw,1.1rem)] font-bold tracking-[0.4em] uppercase text-amber-300/80 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ delay: 0.3, repeat: Infinity, duration: 2.5 }}
          >
            PEMENANG LUCKY DRAW
          </motion.p>
        </motion.div>
        {/* PHOTO */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 100, damping: 12 }}
        >
          <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-yellow-500/20 blur-2xl" />
          <div className="absolute -inset-3 rounded-full border-2 border-amber-400/20 shadow-[0_0_60px_rgba(251,191,36,0.2)]" />
          <div
            className="absolute -inset-1.5 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #d97706, #fbbf24)',
              opacity: 0.6,
              filter: 'blur(2px)',
            }}
          />
          <div className="relative w-[clamp(8rem,18vw,12rem)] h-[clamp(8rem,18vw,12rem)] rounded-full border-[3px] border-amber-400/40 overflow-hidden shadow-[0_0_80px_rgba(251,191,36,0.25),0_0_160px_rgba(251,191,36,0.1)]">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={data.participantName ?? 'Winner'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  el.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`w-full h-full rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-[clamp(3rem,8vw,5rem)] ${photoUrl ? 'hidden' : ''}`}
            >
              👤
            </div>
          </div>
          <motion.div
            className="absolute -inset-4 rounded-full border border-amber-400/15"
            animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          />
        </motion.div>
        {/* NAME RIBBON */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 120, damping: 12 }}
        >
          <div className="relative px-10 py-3 overflow-hidden">
            <div
              className="absolute inset-0 opacity-15"
              style={{
                background:
                  'linear-gradient(135deg, #fbbf24 0%, #f59e0b 25%, #d97706 50%, #f59e0b 75%, #fbbf24 100%)',
              }}
            />
            <h2 className="relative text-[clamp(1.8rem,5vw,4rem)] font-black tracking-tight text-white text-center drop-shadow-[0_2px_12px_rgba(251,191,36,0.4)]">
              {data.participantName ?? '—'}
            </h2>
          </div>
          <div className="h-0.5 mx-6 rounded-full bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        </motion.div>
        {/* COMPANY */}
        {data.participantCompany && (
          <motion.p
            className="text-[clamp(0.8rem,1.3vw,1rem)] text-white/30 font-medium tracking-[0.15em] uppercase -mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {data.participantCompany}
          </motion.p>
        )}
        {/* PRIZE CARD */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 100, damping: 14 }}
        >
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-transparent to-amber-500/10 blur-2xl" />
          <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-white/[0.01] backdrop-blur-xl px-8 md:px-12 py-6 flex flex-col items-center gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
            <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
            <motion.p
              className="text-[clamp(0.7rem,1vw,0.85rem)] font-bold tracking-[0.35em] uppercase text-amber-300/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              MENDAPATKAN
            </motion.p>
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85, type: 'spring', stiffness: 150, damping: 12 }}
            >
              <div className="absolute -inset-2 rounded-2xl bg-amber-400/10 blur-xl" />
              {prizeUrl ? (
                <img
                  src={prizeUrl}
                  alt={data.prizeName ?? 'Prize'}
                  className="relative w-[clamp(4rem,8vw,6rem)] h-[clamp(4rem,8vw,6rem)] rounded-2xl object-contain border border-white/10 shadow-xl"
                />
              ) : (
                <div className="relative w-[clamp(4rem,8vw,6rem)] h-[clamp(4rem,8vw,6rem)] rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-white/10 flex items-center justify-center text-[clamp(2rem,4vw,3rem)] shadow-xl">
                  🎁
                </div>
              )}
            </motion.div>
            <motion.h3
              className={`text-[clamp(1.5rem,4vw,2.8rem)] font-black text-center leading-tight ${t.text}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {data.prizeName ?? '—'}
            </motion.h3>
            <TierBadge prizeTier={data.prizeTier} />
          </div>
        </motion.div>
        {/* DRAW INFO */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {data.drawId && (
            <span className="text-white/15 text-[clamp(0.6rem,0.8vw,0.7rem)] font-mono tracking-wider">
              DRAW ID: {data.drawId.slice(0, 12).toUpperCase()}
            </span>
          )}
          <span className="text-white/10">•</span>
          <span className="text-white/15 text-[clamp(0.6rem,0.8vw,0.7rem)] font-mono tracking-wider">
            {data.startedAt
              ? new Date(data.startedAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : ''}
          </span>
        </motion.div>
        {/* PROGRESS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
        >
          <ProgressTimeline state={done ? 'COMPLETED' : 'REVEALED'} />
        </motion.div>
      </div>
    </div>
  );
}

// ─── MonitorPage (Main Export) ────────────────────────────────────────────

export default function MonitorPage() {
  const { isConnected, emit } = useSocket();
  const [count, setCount] = useState(3);
  const [showGo, setShowGo] = useState(false);
  const [drawState, setDrawState] = useState<DrawState>('IDLE');
  const [drawData, setDrawData] = useState<DrawData | null>(null);
  const countRef = useRef(3);
  const countTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedDrawIdRef = useRef<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const startCountdown = useCallback(() => {
    countRef.current = 3;
    setCount(3);
    setShowGo(false);
    if (countTimerRef.current) clearInterval(countTimerRef.current);
    countTimerRef.current = setInterval(() => {
      countRef.current -= 1;
      if (countRef.current <= 0) {
        if (countTimerRef.current) clearInterval(countTimerRef.current);
        setCount(0);
        setShowGo(true);
        return;
      }
      setCount(countRef.current);
    }, 1000);
  }, []);

  const stopCountdown = useCallback(() => {
    if (countTimerRef.current) {
      clearInterval(countTimerRef.current);
      countTimerRef.current = null;
    }
  }, []);

  // ─── Socket connection diagnostics ──────────────────────────────────
  useEffect(() => {
    console.log('[Monitor] API URL:', env.API_BASE_URL);
    console.log('[Monitor] Socket URL:', env.SOCKET_URL);
  }, []);

  useEffect(() => {
    console.log('[Monitor] Socket status:', isConnected ? 'CONNECTED' : 'OFFLINE');
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      console.log('[Monitor] Socket CONNECTED');
    }
  }, [isConnected]);
  useSocketEvent(
    SOCKET_EVENTS.DRAW_STARTED as SocketEventName,
    useCallback(
      (p: any) => {
        if (!p) return;
        console.log('[Monitor] draw:started', {
          drawId: p.drawId,
          participantName: p.participantName,
          prizeName: p.prizeName,
          prizeId: p.prizeId,
        });
        setDrawData({
          state: 'COUNTDOWN',
          drawId: p.drawId ?? null,
          participantId: p.participantId ?? null,
          participantName: p.participantName ?? null,
          participantCompany: p.participantCompany ?? null,
          participantPhotoUrl: p.participantPhotoUrl ?? null,
          prizeId: p.prizeId ?? null,
          prizeName: p.prizeName ?? null,
          prizeTier: p.prizeTier ?? null,
          prizeImageUrl: p.prizeImageUrl ?? null,
          remainingStock: p.remainingStock ?? null,
          startedAt: p.timestamp ?? null,
        });
        setDrawState('COUNTDOWN');
        startCountdown();
      },
      [startCountdown],
    ),
  );

  useSocketEvent(
    SOCKET_EVENTS.DRAW_SPINNING as SocketEventName,
    useCallback(
      (p: any) => {
        stopCountdown();
        console.log('[Monitor] draw:spinning', {
          participantName: p?.participantName,
          prizeName: p?.prizeName,
        });
        // Merge any new participant data from spinning payload if present
        if (p && (p.participantName || p.prizeName)) {
          setDrawData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              participantName: p.participantName ?? prev.participantName,
              prizeName: p.prizeName ?? prev.prizeName,
              prizeTier: p.prizeTier ?? prev.prizeTier,
              prizeImageUrl: p.prizeImageUrl ?? prev.prizeImageUrl,
            };
          });
        }
        setDrawState('SPINNING');
      },
      [stopCountdown],
    ),
  );

  useSocketEvent(
    SOCKET_EVENTS.DRAW_WINNER as SocketEventName,
    useCallback(
      (p: any) => {
        if (!p) return;
        stopCountdown();
        console.log('[Monitor] draw:winner', {
          drawId: p.drawId,
          participantName: p.participantName,
          prizeName: p.prizeName,
          prizeId: p.prizeId,
        });
        setDrawData((prev) => {
          const base = prev ?? {
            state: 'REVEALED' as DrawState,
            drawId: null,
            participantId: null,
            participantName: null,
            participantCompany: null,
            participantPhotoUrl: null,
            prizeId: null,
            prizeName: null,
            prizeTier: null,
            prizeImageUrl: null,
            remainingStock: null,
            startedAt: null,
          };
          return {
            ...base,
            state: 'REVEALED',
            participantName: p.participantName ?? base.participantName,
            participantCompany: p.participantCompany ?? base.participantCompany,
            participantPhotoUrl: p.participantPhotoUrl ?? base.participantPhotoUrl,
            prizeName: p.prizeName ?? base.prizeName,
            prizeTier: p.prizeTier ?? base.prizeTier,
            prizeImageUrl: p.prizeImageUrl ?? base.prizeImageUrl,
          };
        });
        setDrawState('REVEALED');
      },
      [stopCountdown],
    ),
  );

  useSocketEvent(
    SOCKET_EVENTS.DRAW_COMPLETED as SocketEventName,
    useCallback(
      (p: any) => {
        stopCountdown();
        console.log('[Monitor] draw:completed', { drawId: p?.drawId });
        const drawId = p?.drawId;
        setDrawState('COMPLETED');
        // Guard: only clear if the drawId hasn't changed (no new draw started)
        if (drawId) completedDrawIdRef.current = drawId;
        setTimeout(() => {
          if (drawId && completedDrawIdRef.current !== drawId) return;
          setDrawState('IDLE');
          setDrawData(null);
          completedDrawIdRef.current = null;
        }, 5000);
      },
      [stopCountdown],
    ),
  );

  // ─── Reconnection sync ──────────────────────────────────────────────
  useEffect(() => {
    if (isConnected) emit?.('draw:get-state' as any, {});
  }, [isConnected, emit]);

  useSocketEvent(
    SOCKET_EVENTS.DRAW_STATE_SYNC as SocketEventName,
    useCallback(
      (st: any) => {
        console.log('[Monitor] draw:state-sync', {
          state: st?.state,
          participantName: st?.participantName,
          prizeName: st?.prizeName,
        });
        if (!st?.state || st.state === 'IDLE') return;
        setDrawData({
          state: st.state ?? 'IDLE',
          drawId: st.drawId ?? null,
          participantId: st.participantId ?? null,
          participantName: st.participantName ?? null,
          participantCompany: st.participantCompany ?? null,
          participantPhotoUrl: st.participantPhotoUrl ?? null,
          prizeId: st.prizeId ?? null,
          prizeName: st.prizeName ?? null,
          prizeTier: st.prizeTier ?? null,
          prizeImageUrl: st.prizeImageUrl ?? null,
          remainingStock: st.remainingStock ?? null,
          startedAt: st.startedAt ?? null,
        });
        setDrawState(st.state);
        if (st.state === 'COUNTDOWN') startCountdown();
      },
      [startCountdown],
    ),
  );

  // ─── HTTP fallback ──────────────────────────────────────────────────
  useEffect(() => {
    if (isConnected) return;
    fetch(`${env.API_BASE_URL}/booth/draw-state`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.state && j.data.state !== 'IDLE') {
          setDrawState(j.data.state);
          setDrawData(j.data);
        }
      })
      .catch(() => {});
  }, [isConnected]);

  // ─── Fullscreen ─────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  useEffect(() => () => stopCountdown(), [stopCountdown]);

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#020617] select-none font-sans">
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b1a] via-[#020617] to-[#060a18]" />
      <ParticleField />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center px-6 md:px-10 py-3 border-b border-white/[0.04] bg-gradient-to-b from-[#020617cc] to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <span className="text-white font-black text-base">R</span>
          </div>
          <span className="text-white/35 text-sm font-semibold tracking-widest uppercase">
            RADIANT GROUP
          </span>
          <span className="text-white/10 text-xs font-mono ml-2 hidden sm:inline">LUCKY DRAW</span>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-success-500/10 text-success-400' : 'bg-danger-500/10 text-danger-400'}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]' : 'bg-danger-400'}`}
            />
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main stage */}
      <AnimatePresence mode="wait">
        {drawState === 'IDLE' && (
          <motion.div
            key="idle"
            className="absolute inset-0 pt-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <IdleScreen />
          </motion.div>
        )}
        {drawState === 'COUNTDOWN' && (
          <motion.div
            key="ct"
            className="absolute inset-0 pt-14"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.25 }}
          >
            <CountdownScreen count={count} showGo={showGo} />
          </motion.div>
        )}
        {drawState === 'SPINNING' && (
          <motion.div
            key="sp"
            className="absolute inset-0 pt-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SpinningScreen participantName={drawData?.participantName} />
          </motion.div>
        )}
        {(drawState === 'REVEALED' || drawState === 'COMPLETED') && drawData && (
          <motion.div
            key="rv"
            className="absolute inset-0 pt-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <WinnerReveal data={drawData} done={drawState === 'COMPLETED'} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-between items-center px-8 py-2 border-t border-white/[0.04] bg-gradient-to-t from-[#020617] to-transparent">
        <span className="text-white/10 text-[10px] font-mono tracking-wider">
          RADIANT LUCKY DRAW · v1.0
        </span>
        <span className="text-white/08 text-[10px] font-mono">1920×1080 · 16:9 EVENT DISPLAY</span>
      </div>
    </div>
  );
}

// ─── END ──────────────────────────────────────────────────────────────────
