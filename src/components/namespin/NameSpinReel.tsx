/**
 * NameSpinReel — slot-machine style name reel used by the operator page and
 * the Monitor. Spins through the provided names, decelerates and lands on the
 * winner (decided by the server), then reveals the winner card.
 */

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MonitorImage } from '@pages/monitor/MonitorImage';
import { normalizeImageUrl } from '@/utils';

export interface NameSpinReelProps {
  spinId: string;
  reel: string[];
  winnerName: string;
  durationMs: number;
  /** ISO time the server started the spin; late viewers skip ahead. */
  startedAt?: string;
  prizeName?: string | null;
  prizeImageUrl?: string | null;
  title?: string | null;
  totalNames?: number;
  size?: 'md' | 'lg';
  onRevealed?: () => void;
}

const SIZES = {
  md: { row: 64, text: 'text-2xl md:text-3xl', winner: 'text-3xl md:text-4xl', width: 'max-w-xl' },
  lg: { row: 112, text: 'text-4xl md:text-5xl', winner: 'text-5xl md:text-7xl', width: 'max-w-4xl' },
} as const;

/** Deterministic shuffle so every screen builds the same strip for a spin. */
function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function NameSpinReel({
  spinId,
  reel,
  winnerName,
  durationMs,
  startedAt,
  prizeName,
  prizeImageUrl,
  title,
  totalNames,
  size = 'lg',
  onRevealed,
}: NameSpinReelProps) {
  const s = SIZES[size];

  // Strip: several loops of the other names, then the winner, then 2 trailing rows.
  const { strip, targetIndex } = useMemo(() => {
    const others = reel.filter((n) => n !== winnerName);
    const pool = others.length ? others : [winnerName];
    const minRows = 70;
    const loops = Math.max(2, Math.ceil(minRows / pool.length));
    const body: string[] = [];
    for (let l = 0; l < loops; l++) body.push(...seededShuffle(pool, `${spinId}:${l}`));
    const tail = seededShuffle(pool, `${spinId}:tail`).slice(0, 2);
    return { strip: [...body, winnerName, ...tail], targetIndex: body.length };
  }, [reel, winnerName, spinId]);

  const elapsed = startedAt ? Math.max(0, Date.now() - Date.parse(startedAt)) : 0;
  const remaining = Math.max(0, durationMs - elapsed);
  const [revealed, setRevealed] = useState(remaining < 300);

  useEffect(() => {
    setRevealed(remaining < 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  useEffect(() => {
    if (revealed) onRevealed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  // Winner sits in the middle of a 3-row window.
  const finalY = -(targetIndex - 1) * s.row;
  // Late viewers start part-way through the strip.
  const progress = durationMs > 0 ? Math.min(1, elapsed / durationMs) : 1;
  const startY = finalY * Math.min(0.85, progress);
  const prizeImg = prizeImageUrl ? normalizeImageUrl(prizeImageUrl) : null;

  return (
    <div className={`w-full ${s.width} mx-auto flex flex-col items-center gap-6`}>
      {(title || prizeName) && (
        <div className="text-center space-y-1">
          {title && (
            <p className="text-white/40 text-xs md:text-sm font-bold tracking-[0.3em] uppercase">
              {title}
            </p>
          )}
          {prizeName && (
            <p className="text-amber-300/90 text-lg md:text-2xl font-bold tracking-wide">
              {prizeName}
            </p>
          )}
        </div>
      )}

      <div
        className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
        style={{ height: s.row * 3 }}
      >
        {/* Center highlight */}
        <div
          className="pointer-events-none absolute left-0 right-0 z-10 border-y-2 border-amber-400/60 bg-amber-400/[0.06]"
          style={{ top: s.row, height: s.row }}
        />
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1/3 bg-gradient-to-b from-[#020617] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/3 bg-gradient-to-t from-[#020617] to-transparent" />

        <motion.div
          key={spinId}
          initial={{ y: revealed ? finalY : startY }}
          animate={{ y: finalY }}
          transition={
            revealed
              ? { duration: 0 }
              : { duration: remaining / 1000, ease: [0.12, 0.75, 0.15, 1] }
          }
          onAnimationComplete={() => setRevealed(true)}
          style={{ willChange: 'transform' }}
        >
          {strip.map((name, i) => (
            <div
              key={i}
              className={`flex items-center justify-center px-6 font-black tracking-tight truncate ${s.text} ${
                revealed && i === targetIndex ? 'text-amber-300' : 'text-white/80'
              }`}
              style={{ height: s.row }}
            >
              <span className="truncate">{name}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            key={`${spinId}-win`}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <p className="text-amber-300/70 text-xs md:text-sm font-bold tracking-[0.35em] uppercase">
              Selamat kepada
            </p>
            <p
              className={`${s.winner} font-black tracking-tight leading-tight`}
              style={{
                backgroundImage: 'linear-gradient(135deg,#fde68a,#f59e0b,#fbbf24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {winnerName}
            </p>
            {prizeImg && (
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border border-amber-400/30 bg-white/[0.04] flex items-center justify-center">
                <MonitorImage
                  src={prizeImg}
                  alt={prizeName ?? 'Hadiah'}
                  className="w-full h-full object-contain p-2"
                  displaySize={144}
                />
              </div>
            )}
            {totalNames ? (
              <p className="text-white/25 text-xs font-mono">dari {totalNames} nama</p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NameSpinReel;
