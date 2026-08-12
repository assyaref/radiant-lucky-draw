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
import { boothApi, type Winner } from '@/api/booth';

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

interface PrizeEntry {
  id: string;
  name: string;
  imageUrl?: string;
  tier: string;
  remaining: number;
}

interface WinnerEntry {
  id: string;
  drawId: string;
  participantName: string;
  participantCompany: string;
  participantPhotoUrl?: string;
  prizeName: string;
  prizeTier: string;
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

// --- PRIZE LIST PANEL (Left) ---
function PrizeListPanel({
  prizes,
  highlightedPrizeId,
}: {
  prizes: PrizeEntry[];
  highlightedPrizeId?: string | null;
}) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] backdrop-blur-sm">
        <span className="text-lg">{String.fromCodePoint(0x1f381)}</span>
        <h3 className="text-white/30 text-xs font-bold tracking-[0.25em] uppercase">HADIAH</h3>
        <span className="ml-auto text-white/10 text-[10px] font-mono">{prizes.length} item</span>
      </div>
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5"
        style={{ scrollbarWidth: 'thin' }}
      >
        {prizes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white/10">
            <span className="text-6xl">{String.fromCodePoint(0x1f381)}</span>
            <p className="text-xs tracking-widest uppercase">BELUM ADA HADIAH</p>
          </div>
        ) : (
          prizes.map((p) => {
            const isHighlighted = p.id === highlightedPrizeId;
            const t = tier(p.tier);
            const soldOut = p.remaining <= 0;
            const imgUrl = p.imageUrl ? normalizeImageUrl(p.imageUrl) : null;
            return (
              <motion.div
                key={p.id}
                layout
                className={
                  'relative flex items-center gap-3.5 p-3 rounded-2xl border transition-all ' +
                  (isHighlighted
                    ? 'border-amber-400/50 bg-gradient-to-r from-amber-500/[0.08] to-yellow-500/[0.04] shadow-[0_0_30px_rgba(251,191,36,0.12)]'
                    : soldOut
                      ? 'border-white/[0.03] bg-white/[0.01] opacity-50'
                      : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.08]')
                }
                animate={
                  isHighlighted
                    ? {
                        scale: [1, 1.01, 1],
                        boxShadow: [
                          '0 0 20px rgba(251,191,36,0.1)',
                          '0 0 40px rgba(251,191,36,0.22)',
                          '0 0 20px rgba(251,191,36,0.1)',
                        ],
                      }
                    : {}
                }
                transition={{ repeat: Infinity, duration: 2.2 }}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/[0.04] flex-shrink-0 flex items-center justify-center border border-white/[0.06] shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={p.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-white/20 text-xl">{String.fromCodePoint(0x1f381)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/85 text-xs font-semibold truncate leading-tight">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={'text-[10px] font-bold ' + t.text}>
                      {p.tier.toUpperCase()}
                    </span>
                    <span
                      className={
                        'text-[10px] font-mono ' + (soldOut ? 'text-red-400/60' : 'text-white/25')
                      }
                    >
                      {soldOut ? 'HABIS' : 'Stok: ' + p.remaining}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- CENTER PANEL ---
function CenterPanel({
  drawState,
  drawData,
  count,
  showGo,
  done,
  prizes,
  onVisualStop,
}: {
  drawState: DrawState;
  drawData: DrawData | null;
  count: number;
  showGo: boolean;
  done: boolean;
  prizes: PrizeEntry[];
  onVisualStop?: (prizeId: string) => void;
}) {
  const participantPhotoUrl = drawData?.participantPhotoUrl
    ? normalizeImageUrl(drawData.participantPhotoUrl)
    : null;
  const prizeImageUrl = drawData?.prizeImageUrl ? normalizeImageUrl(drawData.prizeImageUrl) : null;
  const t = tier(drawData?.prizeTier);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-4">
      <AnimatePresence mode="wait">
        {drawState === 'IDLE' && (
          <motion.div
            key="ci"
            className="flex flex-col items-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="pointer-events-none absolute inset-0"
              animate={{ opacity: [0.08, 0.18, 0.08] }}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15)_0%,rgba(139,92,246,0.06)_35%,transparent_65%)]" />
            </motion.div>
            <p className="text-white/15 text-sm md:text-base font-light tracking-[0.3em] uppercase z-10"></p>
            <h1
              className="text-[clamp(2.5rem,6vw,5rem)] font-black tracking-tight text-center leading-none z-10"
              style={{
                backgroundImage: 'linear-gradient(135deg,#3b82f6,#8b5cf6,#f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              LUCKY DRAW
            </h1>
            <div className="rounded-full border border-primary-400/15 bg-primary-400/[0.03] px-10 py-4">
              <p className="text-white/50 text-xl font-light tracking-wider">SIAP UNTUK MENANG?</p>
            </div>
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-primary-400"
                  animate={{ opacity: [0.15, 1, 0.15], scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.5 }}
                />
              ))}
            </div>
            <p className="text-white/10 text-sm tracking-widest uppercase">DIGITAL BOOTH</p>
          </motion.div>
        )}
        {drawState === 'COUNTDOWN' && (
          <motion.div
            key="cc"
            className="w-full h-full flex items-center justify-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CountdownScreen count={count} showGo={showGo} />
          </motion.div>
        )}
        {drawState === 'SPINNING' && (
          <motion.div
            key="cs"
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* VISUAL ONLY: no actual winner data displayed during SPINNING */}
            <SpinningScreen prizes={prizes} onVisualStop={onVisualStop} />
          </motion.div>
        )}
        {(drawState === 'REVEALED' || drawState === 'COMPLETED') && (
          <motion.div
            key="cw"
            className="flex flex-col items-center gap-5"
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              className="pointer-events-none absolute inset-0"
              animate={{ opacity: [0.25, 0.5, 0.25] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <div
                className="h-full w-full blur-3xl"
                style={{
                  background:
                    'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(234,179,8,0.16) 0%, rgba(251,191,36,0.06) 30%, transparent 70%)',
                }}
              />
            </motion.div>
            <h1
              className="text-[clamp(2rem,4.5vw,3.8rem)] font-black leading-none tracking-tight text-center z-10"
              style={{
                backgroundImage: 'linear-gradient(180deg, #fef3c7 0%, #f59e0b 40%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {String.fromCodePoint(0x1f389)} SELAMAT! {String.fromCodePoint(0x1f389)}
            </h1>
            <p className="text-amber-300/60 text-sm font-bold tracking-[0.35em] uppercase z-10 animate-pulse">
              PEMENANG LUCKY DRAW
            </p>

            {/* ── ACTUAL WINNER: Participant Photo + Info (server-authoritative) ── */}
            {drawData && (
              <motion.div
                className="z-10 flex flex-col items-center gap-4 mt-2"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {/* Participant Photo */}
                <motion.div
                  className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-amber-400/60 bg-white/[0.04] flex items-center justify-center"
                  style={{
                    boxShadow: '0 0 50px rgba(251,191,36,0.3), 0 0 100px rgba(245,158,11,0.15)',
                  }}
                >
                  {participantPhotoUrl ? (
                    <img
                      src={participantPhotoUrl}
                      alt={drawData.participantName ?? 'Winner'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-5xl">{String.fromCodePoint(0x1f464)}</span>
                  )}
                </motion.div>

                {/* Participant Name */}
                <p className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white text-center">
                  {drawData.participantName ?? '\u2014'}
                </p>

                {/* Participant Company */}
                {drawData.participantCompany && (
                  <p className="text-base md:text-lg text-amber-200/60 font-medium tracking-wide">
                    {drawData.participantCompany}
                  </p>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3 w-full max-w-xs">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
                  <span className="text-amber-300/50 text-xs font-bold tracking-[0.25em] uppercase">
                    MENDAPATKAN
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
                </div>

                {/* Prize Image */}
                <motion.div
                  className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden bg-white/[0.04] border border-amber-400/30 flex items-center justify-center"
                  style={{
                    boxShadow: '0 0 40px rgba(251,191,36,0.2)',
                  }}
                  animate={{
                    boxShadow: [
                      '0 0 40px rgba(251,191,36,0.2)',
                      '0 0 60px rgba(251,191,36,0.35)',
                      '0 0 40px rgba(251,191,36,0.2)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {prizeImageUrl ? (
                    <img
                      src={prizeImageUrl}
                      alt={drawData.prizeName ?? 'Prize'}
                      className="w-full h-full object-contain p-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-5xl">{String.fromCodePoint(0x1f381)}</span>
                  )}
                </motion.div>

                {/* Prize Name */}
                <p className="text-xl md:text-2xl font-bold tracking-tight text-amber-200 text-center max-w-md">
                  {drawData.prizeName ?? '\u2014'}
                </p>

                {/* Prize Tier Badge */}
                {drawData.prizeTier && (
                  <span
                    className={`px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${t.text} bg-white/[0.05] border border-white/10`}
                  >
                    {drawData.prizeTier}
                  </span>
                )}
              </motion.div>
            )}

            {done && (
              <p className="text-white/30 text-xs font-mono z-10">
                {String.fromCodePoint(0x2713)} Draw Selesai
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- WINNER LIST PANEL (Right) ---
function WinnerListPanel({ winners }: { winners: WinnerEntry[] }) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] backdrop-blur-sm">
        <span className="text-lg">{String.fromCodePoint(0x1f3c6)}</span>
        <h3 className="text-white/30 text-xs font-bold tracking-[0.25em] uppercase">PEMENANG</h3>
        <span className="ml-auto text-white/10 text-[10px] font-mono">{winners.length} orang</span>
      </div>
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5"
        style={{ scrollbarWidth: 'thin' }}
      >
        {winners.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white/10">
            <span className="text-6xl">{String.fromCodePoint(0x1f3c6)}</span>
            <p className="text-xs tracking-widest uppercase">BELUM ADA PEMENANG</p>
          </div>
        ) : (
          winners.map((w, i) => {
            const t = tier(w.prizeTier);
            const photoUrl = w.participantPhotoUrl
              ? normalizeImageUrl(w.participantPhotoUrl)
              : null;
            const medal =
              i === 0
                ? String.fromCodePoint(0x1f947)
                : i === 1
                  ? String.fromCodePoint(0x1f948)
                  : i === 2
                    ? String.fromCodePoint(0x1f949)
                    : String.fromCodePoint(0x2b50);
            const isLatest = i === 0;
            return (
              <motion.div
                key={w.drawId}
                initial={i < 3 ? { opacity: 0, x: 30 } : false}
                animate={
                  isLatest
                    ? {
                        opacity: 1,
                        x: 0,
                        boxShadow: [
                          '0 0 15px rgba(251,191,36,0.06)',
                          '0 0 35px rgba(251,191,36,0.15)',
                          '0 0 15px rgba(251,191,36,0.06)',
                        ],
                      }
                    : { opacity: 1, x: 0 }
                }
                transition={
                  isLatest
                    ? {
                        delay: i * 0.05,
                        duration: 0.35,
                        boxShadow: { repeat: Infinity, duration: 2.5 },
                      }
                    : { delay: i * 0.05, duration: 0.35 }
                }
                className={
                  'relative flex items-center gap-3.5 p-3 rounded-2xl border transition-all ' +
                  (isLatest
                    ? 'border-amber-400/40 bg-gradient-to-r from-amber-500/[0.06] to-yellow-500/[0.03] shadow-[0_0_25px_rgba(251,191,36,0.1)]'
                    : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.08]')
                }
              >
                {isLatest && (
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-[9px] font-bold text-black tracking-wider z-10 shadow-[0_0_12px_rgba(251,191,36,0.4)]">
                    PEMENANG
                  </div>
                )}
                <div
                  className={
                    'relative w-14 h-14 flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center ' +
                    (isLatest
                      ? 'ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                      : 'border-2 border-white/[0.06]')
                  }
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={w.participantName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-white/20 text-base">{medal}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-xs font-bold truncate leading-tight">
                    {w.participantName}
                  </p>
                  <p className="text-white/35 text-[10px] truncate mt-0.5">
                    {w.participantCompany}
                  </p>
                  <p className={'text-[10px] font-semibold mt-1 ' + t.text}>{w.prizeName}</p>
                </div>
                <span className="text-white/10 text-sm flex-shrink-0 ml-1">{medal}</span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
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

// ─── SPINNING Screen (VISUAL PRIZE ONLY) ────────────────────────────────────
// displayPrize is for ANIMATION ONLY — it does NOT determine the actual winner.
// The actual winner & prize come from draw:winner via Socket.IO (server-authoritative).

function SpinningScreen({
  prizes,
  onVisualStop,
}: {
  prizes: PrizeEntry[];
  onVisualStop?: (prizeId: string) => void;
}) {
  const [displayPrize, setDisplayPrize] = useState<PrizeEntry | null>(null);
  const [converge, setConverge] = useState(false);
  const finalPrizeRef = useRef<PrizeEntry | null>(null);
  const hasStoppedRef = useRef(false);
  const mountedRef = useRef(true);
  const onVisualStopRef = useRef(onVisualStop);

  // Keep callback ref in sync without mutation during render
  useEffect(() => {
    onVisualStopRef.current = onVisualStop;
  });

  // Mark unmounted to prevent state updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Phase 1: Fast cycling (80ms)
  useEffect(() => {
    if (prizes.length === 0) return;
    hasStoppedRef.current = false;
    finalPrizeRef.current = null;

    const fastInterval = setInterval(() => {
      // VISUAL ONLY — does NOT determine the actual winner
      const index = Math.floor(Math.random() * prizes.length);
      setDisplayPrize(prizes[index]);
    }, 80);

    const slowTimeout = setTimeout(() => {
      setConverge(true);
      clearInterval(fastInterval);
    }, 2000);

    console.log('[Monitor] visual prize spinning STARTED (fast phase)');

    return () => {
      clearInterval(fastInterval);
      clearTimeout(slowTimeout);
      setConverge(false);
    };
  }, [prizes]);

  // Phase 2: Slower cycling (200ms) after converge, then STOP
  useEffect(() => {
    if (!converge || prizes.length === 0) return;

    const slowInterval = setInterval(() => {
      // VISUAL ONLY — does NOT determine the actual winner
      const index = Math.floor(Math.random() * prizes.length);
      setDisplayPrize(prizes[index]);
    }, 200);

    console.log('[Monitor] visual prize spinning SLOWING DOWN');

    // Phase 3: Stop cycling after ~3s of slow phase
    const stopTimeout = setTimeout(() => {
      clearInterval(slowInterval);
      if (!mountedRef.current) return;
      // Pick final visual prize
      const finalIdx = Math.floor(Math.random() * prizes.length);
      const finalPrize = prizes[finalIdx];
      setDisplayPrize(finalPrize);
      finalPrizeRef.current = finalPrize;
      if (!hasStoppedRef.current) {
        hasStoppedRef.current = true;
        console.log('[Monitor] visual prize spinning STOPPED', {
          prizeId: finalPrize.id,
          prizeName: finalPrize.name,
        });
        onVisualStopRef.current?.(finalPrize.id);
      }
    }, 3000);

    return () => {
      clearInterval(slowInterval);
      clearTimeout(stopTimeout);
    };
  }, [converge, prizes]);

  useEffect(() => {
    if (displayPrize) {
      console.log('[Monitor] visual prize spinning', {
        prizeId: displayPrize.id,
        prizeName: displayPrize.name,
      });
    }
  }, [displayPrize]);

  const imgUrl = displayPrize?.imageUrl ? normalizeImageUrl(displayPrize.imageUrl) : null;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      {/* Pulsing background glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.15, 0.45, 0.15] }}
        transition={{ repeat: Infinity, duration: converge ? 1.2 : 0.5 }}
      >
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.25)_0%,rgba(59,130,246,0.12)_35%,transparent_65%)]" />
      </motion.div>

      {/* Scanning line */}
      <motion.div
        className="absolute left-[10%] right-[10%] h-0.5 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-sm z-10"
        animate={{ top: ['20%', '70%', '20%'] }}
        transition={{ repeat: Infinity, duration: converge ? 1.4 : 0.7, ease: 'linear' }}
      />

      {/* Prize image cycling */}
      <AnimatePresence mode="wait">
        <motion.div
          key={displayPrize?.id ?? 'empty'}
          className="z-10 flex flex-col items-center gap-5"
          initial={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
          transition={{ duration: converge ? 0.25 : 0.1 }}
        >
          {/* Prize image container with glow */}
          <motion.div
            className="relative w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden bg-white/[0.04] border border-white/10 flex items-center justify-center"
            style={{
              boxShadow: '0 0 40px rgba(139,92,246,0.2), 0 0 80px rgba(59,130,246,0.1)',
            }}
            animate={{
              boxShadow: converge
                ? [
                    '0 0 40px rgba(139,92,246,0.2), 0 0 80px rgba(59,130,246,0.1)',
                    '0 0 60px rgba(251,191,36,0.3), 0 0 100px rgba(245,158,11,0.15)',
                    '0 0 40px rgba(139,92,246,0.2), 0 0 80px rgba(59,130,246,0.1)',
                  ]
                : [
                    '0 0 40px rgba(139,92,246,0.2), 0 0 80px rgba(59,130,246,0.1)',
                    '0 0 50px rgba(139,92,246,0.35), 0 0 90px rgba(59,130,246,0.2)',
                    '0 0 40px rgba(139,92,246,0.2), 0 0 80px rgba(59,130,246,0.1)',
                  ],
            }}
            transition={{ repeat: Infinity, duration: converge ? 2.5 : 1 }}
          >
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={displayPrize?.name ?? 'Prize'}
                className="w-full h-full object-contain p-3"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-6xl">{String.fromCodePoint(0x1f381)}</span>
            )}
          </motion.div>

          {/* Prize name */}
          <p className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white/80 text-center px-4 max-w-sm">
            {displayPrize?.name ?? '...'}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Bottom label */}
      <motion.p
        className="z-10 mt-6 text-lg md:text-xl font-bold tracking-[0.25em] text-white/40 uppercase"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
      >
        MEMUTAR HADIAH
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

// ─── WINNER Screen (PREMIUM REDESIGN) ────────────────────────────────────

export default function MonitorPage() {
  const { isConnected, emit } = useSocket();
  const [count, setCount] = useState(3);
  const [showGo, setShowGo] = useState(false);
  const [drawState, setDrawState] = useState<DrawState>('IDLE');
  const [drawData, setDrawData] = useState<DrawData | null>(null);
  const countRef = useRef(3);
  const countTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedDrawIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [prizes, setPrizes] = useState<PrizeEntry[]>([]);
  const [winners, setWinners] = useState<WinnerEntry[]>([]);
  const [highlightedPrizeId, setHighlightedPrizeId] = useState<string | null>(null);

  // Fetch prizes and winners on mount
  useEffect(() => {
    boothApi
      .getMonitorPrizes()
      .then((r) => {
        if (Array.isArray(r.data)) setPrizes(r.data);
      })
      .catch((err) => console.error('[Monitor] Failed to load prizes', err));
    boothApi
      .getPublicWinners(50)
      .then((r) => {
        if (Array.isArray(r.data)) {
          const mapped: WinnerEntry[] = (r.data as Winner[]).map((w) => ({
            id: w.id,
            drawId: w.drawId,
            participantName: w.participantName,
            participantCompany: w.participantCompany,
            participantPhotoUrl: w.participantPhotoUrl,
            prizeName: w.prizeName,
            prizeTier: w.prizeTier,
          }));
          setWinners(mapped);
        }
      })
      .catch((err) => console.error('[Monitor] Failed to load winners', err));
  }, []);

  // Cleanup mounted flag on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ─── Refresh winner list from server ─────────────────────────────────
  const refreshWinners = useCallback(async () => {
    console.log('[Monitor] Refreshing winner list after draw completed');
    try {
      const response = await boothApi.getPublicWinners(50);
      if (!mountedRef.current) return;

      if (Array.isArray(response.data)) {
        const mapped: WinnerEntry[] = (response.data as Winner[]).map((w) => ({
          id: w.id,
          drawId: w.drawId,
          participantName: w.participantName,
          participantCompany: w.participantCompany,
          participantPhotoUrl: w.participantPhotoUrl,
          prizeName: w.prizeName,
          prizeTier: w.prizeTier,
        }));
        setWinners(mapped);
        console.log('[Monitor] Winner list refreshed', {
          count: mapped.length,
        });
      }
    } catch (error) {
      console.error('[Monitor] Failed to refresh winners', error);
    }
  }, []);

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
        setHighlightedPrizeId(null);
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
        setHighlightedPrizeId(null);

        // Debug: log the actual winner data from server
        console.log('[Monitor] ACTUAL WINNER REVEAL', {
          participantName: p.participantName,
          participantPhotoUrl: p.participantPhotoUrl,
          participantCompany: p.participantCompany,
          prizeId: p.prizeId,
          prizeName: p.prizeName,
          prizeImageUrl: p.prizeImageUrl,
          prizeTier: p.prizeTier,
        });
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
        // Refresh winner list from server after draw completes
        // Small delay ensures the database transaction is finished
        setTimeout(() => {
          refreshWinners();
        }, 300);
        // Update prize stock if available
        if (p?.prizeId != null && p?.remainingStock != null) {
          setPrizes((prev) =>
            prev.map((pr) => (pr.id === p.prizeId ? { ...pr, remaining: p.remainingStock } : pr)),
          );
        }
        const drawId = p?.drawId;
        setDrawState('COMPLETED');
        setHighlightedPrizeId(null);
        // Guard: only clear if the drawId hasn't changed (no new draw started)
        if (drawId) completedDrawIdRef.current = drawId;
        setTimeout(() => {
          if (drawId && completedDrawIdRef.current !== drawId) return;
          setDrawState('IDLE');
          setDrawData(null);
          setHighlightedPrizeId(null);
          completedDrawIdRef.current = null;
        }, 5000);
      },
      [stopCountdown, refreshWinners],
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

      <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center px-6 md:px-10 py-4 border-b border-white/[0.04] bg-gradient-to-b from-[#020617cc] to-transparent">
        <div className="flex items-center gap-4 ml-auto">
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

      {/* Main stage: 3-Column Grid */}
      <div
        className="absolute top-16 bottom-9 left-0 right-0 z-10 grid"
        style={{
          gridTemplateColumns: 'minmax(280px, 0.8fr) minmax(500px, 1.8fr) minmax(280px, 0.8fr)',
        }}
      >
        {/* LEFT: Prize List */}
        <div className="relative border-r border-white/[0.03]">
          <PrizeListPanel prizes={prizes} highlightedPrizeId={highlightedPrizeId} />
        </div>

        {/* CENTER: Lucky Draw */}
        <div className="relative">
          <CenterPanel
            drawState={drawState}
            drawData={drawData}
            count={count}
            showGo={showGo}
            done={drawState === 'COMPLETED'}
            prizes={prizes}
            onVisualStop={(prizeId) => setHighlightedPrizeId(prizeId)}
          />
        </div>

        {/* RIGHT: Winner List */}
        <div className="relative border-l border-white/[0.03]">
          <WinnerListPanel winners={winners} />
        </div>
      </div>

      {/* Gold Confetti during winner reveal */}
      {(drawState === 'REVEALED' || drawState === 'COMPLETED') && <GoldConfetti active />}

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-between items-center px-8 py-2 border-t border-white/[0.04] bg-gradient-to-t from-[#020617] to-transparent">
        <div className="flex items-center gap-4">
          <ProgressTimeline state={drawState} />
          <span className="text-white/10 text-[10px] font-mono tracking-wider">
            RADIANT LUCKY DRAW · v1.0
          </span>
        </div>
        <span className="text-white/06 text-[10px] font-mono">1920x1080 · 16:9</span>
      </div>
    </div>
  );
}

// ─── END ──────────────────────────────────────────────────────────────────
