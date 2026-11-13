/**
 * NameSpinStage — the Spin Nama scene: title/prize header, the wheel and the
 * winner card. Used full-screen on the Monitor and inside the operator page.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NameSpinWheel } from './NameSpinWheel';
import { MonitorImage } from '@pages/monitor/MonitorImage';
import { normalizeImageUrl } from '@/utils';
import type { NameSpinResult } from '@api/nameSpin';

interface Props {
  /** Idle wheel (from the Monitor state or the operator's list). */
  segments: string[];
  totalNames: number;
  title?: string | null;
  prizeName?: string | null;
  prizeImageUrl?: string | null;
  /** Active/last spin; while set its segments are shown. */
  spin?: NameSpinResult | null;
  size?: 'md' | 'lg';
  onRevealed?: (spinId: string) => void;
}

export function NameSpinStage({
  segments,
  totalNames,
  title,
  prizeName,
  prizeImageUrl,
  spin,
  size = 'lg',
  onRevealed,
}: Props) {
  const [revealedId, setRevealedId] = useState<string | null>(null);

  // A new spin hides the previous winner until the wheel stops.
  useEffect(() => {
    if (spin && spin.spinId !== revealedId) setRevealedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spin?.spinId]);

  const revealed = !!spin && revealedId === spin.spinId;
  const wheelSegments = spin ? spin.segments : segments;
  const shownTitle = spin ? spin.title : title;
  const shownPrize = spin ? spin.prizeName : prizeName;
  const shownPrizeImg = spin ? spin.prizeImageUrl : prizeImageUrl;
  const prizeImg = shownPrizeImg ? normalizeImageUrl(shownPrizeImg) : null;
  const count = spin ? spin.totalNames : totalNames;
  const lg = size === 'lg';

  return (
    <div
      className={`w-full h-full flex ${lg ? 'flex-col lg:flex-row' : 'flex-col'} items-center justify-center gap-6 lg:gap-12`}
    >
      {/* Wheel */}
      <div
        className={lg ? 'w-[min(82vh,58vw)] max-w-full' : 'w-full max-w-[420px]'}
        style={{ filter: 'drop-shadow(0 0 40px rgba(124,58,237,0.25))' }}
      >
        <NameSpinWheel
          segments={wheelSegments}
          spin={spin ?? null}
          highlight={revealed && spin ? spin.winnerSegment : null}
          onSpinEnd={(id) => {
            setRevealedId(id);
            onRevealed?.(id);
          }}
        />
      </div>

      {/* Side panel */}
      <div
        className={`flex flex-col items-center text-center gap-4 ${lg ? 'lg:w-[34vw] lg:max-w-[560px]' : 'w-full'}`}
      >
        {shownTitle && (
          <p
            className={`text-white/45 font-bold tracking-[0.3em] uppercase ${lg ? 'text-sm md:text-lg' : 'text-xs'}`}
          >
            {shownTitle}
          </p>
        )}
        {shownPrize && (
          <div className="flex flex-col items-center gap-3">
            {prizeImg && (
              <div
                className={`${lg ? 'w-36 h-36 md:w-44 md:h-44' : 'w-20 h-20'} rounded-2xl overflow-hidden border border-amber-400/30 bg-white/[0.04] flex items-center justify-center`}
              >
                <MonitorImage
                  src={prizeImg}
                  alt={shownPrize}
                  className="w-full h-full object-contain p-2"
                  displaySize={lg ? 176 : 80}
                />
              </div>
            )}
            <p className={`text-amber-300 font-bold ${lg ? 'text-2xl md:text-4xl' : 'text-lg'}`}>
              {shownPrize}
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {revealed && spin ? (
            <motion.div
              key={`win-${spin.spinId}`}
              initial={{ opacity: 0, scale: 0.85, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="flex flex-col items-center gap-2"
            >
              <p
                className={`text-amber-300/70 font-bold tracking-[0.35em] uppercase ${lg ? 'text-sm md:text-base' : 'text-xs'}`}
              >
                Selamat kepada
              </p>
              <p
                className={`font-black tracking-tight leading-tight break-words ${lg ? 'text-5xl md:text-7xl' : 'text-3xl'}`}
                style={{
                  backgroundImage: 'linear-gradient(135deg,#fde68a,#f59e0b,#fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {spin.winnerName}
              </p>
            </motion.div>
          ) : (
            <motion.p
              key={spin ? `spinning-${spin.spinId}` : 'idle'}
              initial={{ opacity: 0 }}
              animate={{ opacity: spin ? [0.5, 1, 0.5] : 1 }}
              transition={spin ? { repeat: Infinity, duration: 1.2 } : { duration: 0.4 }}
              className={`text-white/50 font-semibold tracking-widest uppercase ${lg ? 'text-lg md:text-2xl' : 'text-sm'}`}
            >
              {spin ? 'Mengundi…' : count > 0 ? 'Siap diundi' : 'Menunggu daftar nama'}
            </motion.p>
          )}
        </AnimatePresence>

        {count > 0 && <p className="text-white/25 text-xs font-mono">{count} nama</p>}
      </div>
    </div>
  );
}

export default NameSpinStage;
